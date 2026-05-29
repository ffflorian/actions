import * as fs from 'node:fs';
import * as path from 'node:path';

export type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
export interface JsonObject extends Record<string, JsonValue> {}

export interface ReleaseTarget {
  config: JsonObject;
  document: JsonObject;
  path: string;
  source: '.releaserc.json' | 'package.json';
  mode: 'existing-releaserc' | 'package-release' | 'full-releaserc';
}

export interface PreparedReleaseConfig {
  changed: boolean;
  appliedConfig: JsonObject;
  path: string;
  source: ReleaseTarget['source'];
  restore: () => void;
}

export const RELEASE_RULES = [
  {type: 'chore', release: 'patch'},
  {type: 'ci', release: 'patch'},
  {type: 'docs', release: 'patch'},
  {type: 'feat', release: 'minor'},
  {type: 'fix', release: 'patch'},
  {type: 'perf', release: 'patch'},
  {type: 'refactor', release: 'patch'},
  {type: 'revert', release: 'patch'},
  {type: 'style', release: 'patch'},
] as const;

const DEFAULT_NOTE_KEYWORDS = ['BREAKING CHANGE', 'BREAKING CHANGES', 'BREAKING'];
const DEFAULT_RELEASE_ASSETS = ['CHANGELOG.md'];

const COMMIT_ANALYZER_PLUGIN = '@semantic-release/commit-analyzer';
const RELEASE_NOTES_PLUGIN = '@semantic-release/release-notes-generator';
const GIT_PLUGIN = '@semantic-release/git';

function isJsonObject(value: unknown): value is JsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function cloneJsonObject(value: JsonObject): JsonObject {
  return structuredClone(value);
}

function readJsonObject(filePath: string, label: string): JsonObject {
  let parsed: unknown;

  try {
    parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as unknown;
  } catch (error) {
    throw new Error(
      `Failed to parse ${label} at ${filePath}: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  if (!isJsonObject(parsed)) {
    throw new Error(`${label} at ${filePath} must contain a JSON object.`);
  }

  return parsed;
}

function getPluginName(plugin: JsonValue): string | null {
  if (typeof plugin === 'string') {
    return plugin;
  }

  if (Array.isArray(plugin) && plugin.length > 0 && typeof plugin[0] === 'string') {
    return plugin[0];
  }

  return null;
}

function createFullReleaseConfig(assets: string[]): JsonObject {
  return {
    plugins: [
      [
        COMMIT_ANALYZER_PLUGIN,
        {
          preset: 'angular',
          releaseRules: [...RELEASE_RULES],
          parserOpts: {
            noteKeywords: DEFAULT_NOTE_KEYWORDS,
          },
        },
      ],
      [
        RELEASE_NOTES_PLUGIN,
        {
          preset: 'angular',
          parserOpts: {
            noteKeywords: DEFAULT_NOTE_KEYWORDS,
          },
        },
      ],
      '@semantic-release/changelog',
      [
        '@semantic-release/github',
        {
          releasedLabels: false,
          successComment: false,
        },
      ],
      [
        '@semantic-release/git',
        {
          assets,
          message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
        },
      ],
    ],
  };
}

function applyForcedRules(config: JsonObject, rules: Array<{type: string; release: string}>): void {
  const plugins = config['plugins'];

  if (plugins === undefined) {
    config['releaseRules'] = rules;
    return;
  }

  if (!Array.isArray(plugins)) {
    throw new Error('semantic-release config field "plugins" must be an array when present.');
  }

  const names = plugins.map(getPluginName);
  const commitAnalyzerIndex = names.findIndex(name => name === COMMIT_ANALYZER_PLUGIN);

  if (commitAnalyzerIndex >= 0) {
    const commitAnalyzer = plugins[commitAnalyzerIndex];
    if (typeof commitAnalyzer === 'string') {
      plugins[commitAnalyzerIndex] = [commitAnalyzer, {releaseRules: rules}];
    } else if (Array.isArray(commitAnalyzer)) {
      const [, options] = commitAnalyzer;
      const nextOptions = isJsonObject(options) ? {...options} : {};
      nextOptions['releaseRules'] = rules;
      plugins[commitAnalyzerIndex] = [commitAnalyzer[0], nextOptions];
    } else {
      plugins[commitAnalyzerIndex] = [COMMIT_ANALYZER_PLUGIN, {releaseRules: rules}];
    }
  } else {
    plugins.unshift([COMMIT_ANALYZER_PLUGIN, {releaseRules: rules}]);
  }

  const hasReleaseNotesGenerator = plugins.map(getPluginName).some(name => name === RELEASE_NOTES_PLUGIN);

  if (!hasReleaseNotesGenerator) {
    plugins.push(RELEASE_NOTES_PLUGIN);
  }
}

function applyGitAssets(config: JsonObject, assets: string[]): void {
  const plugins = config['plugins'];

  if (plugins === undefined) {
    return;
  }

  if (!Array.isArray(plugins)) {
    throw new Error('semantic-release config field "plugins" must be an array when present.');
  }

  const names = plugins.map(getPluginName);
  const gitIndex = names.findIndex(name => name === GIT_PLUGIN);

  if (gitIndex < 0) {
    return;
  }

  const gitPlugin = plugins[gitIndex];

  if (typeof gitPlugin === 'string') {
    plugins[gitIndex] = [gitPlugin, {assets}];
    return;
  }

  if (Array.isArray(gitPlugin)) {
    const [, options] = gitPlugin;
    const nextOptions = isJsonObject(options) ? {...options} : {};
    nextOptions['assets'] = assets;
    plugins[gitIndex] = [gitPlugin[0], nextOptions];
  }
}

export function findReleaseTarget(workspace: string): ReleaseTarget {
  const releaseRcPath = path.join(workspace, '.releaserc.json');
  if (fs.existsSync(releaseRcPath)) {
    const document = readJsonObject(releaseRcPath, '.releaserc.json');
    return {
      config: document,
      document,
      path: releaseRcPath,
      source: '.releaserc.json',
      mode: 'existing-releaserc',
    };
  }

  const packageJsonPath = path.join(workspace, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    const document: JsonObject = {};
    return {
      config: document,
      document,
      path: releaseRcPath,
      source: '.releaserc.json',
      mode: 'full-releaserc',
    };
  }

  const document = readJsonObject(packageJsonPath, 'package.json');
  const releaseConfig = document['release'];

  if (releaseConfig === undefined) {
    const newDocument: JsonObject = {};
    return {
      config: newDocument,
      document: newDocument,
      path: releaseRcPath,
      source: '.releaserc.json',
      mode: 'full-releaserc',
    };
  }

  if (!isJsonObject(releaseConfig)) {
    throw new Error(`package.json#release must contain a JSON object when it is present.`);
  }

  const generatedDocument = cloneJsonObject(releaseConfig);
  return {
    config: generatedDocument,
    document: generatedDocument,
    path: releaseRcPath,
    source: 'package.json',
    mode: 'package-release',
  };
}

export function prepareReleaseConfig(
  workspace: string,
  assets: string[] = DEFAULT_RELEASE_ASSETS
): PreparedReleaseConfig {
  const target = findReleaseTarget(workspace);
  const originalExists = fs.existsSync(target.path);
  const originalContent = originalExists ? fs.readFileSync(target.path, 'utf8') : null;
  const before = JSON.stringify(target.config);

  if (originalExists || target.mode === 'package-release') {
    const nextRules = RELEASE_RULES.map(rule => ({...rule}));
    applyForcedRules(target.config, nextRules);
    applyGitAssets(target.config, assets);
  } else {
    Object.assign(target.config, createFullReleaseConfig(assets));
  }

  const changed = !originalExists || before !== JSON.stringify(target.config);
  fs.writeFileSync(target.path, `${JSON.stringify(target.document, null, 2)}\n`);

  return {
    changed,
    appliedConfig: target.config,
    path: target.path,
    source: target.source,
    restore: () => {
      if (originalContent === null) {
        if (fs.existsSync(target.path)) {
          fs.rmSync(target.path);
        }
        return;
      }

      fs.writeFileSync(target.path, originalContent);
    },
  };
}
