import * as fs from 'node:fs';
import * as path from 'node:path';

export type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
export interface JsonObject extends Record<string, JsonValue> {}

export interface ReleaseTarget {
  config: JsonObject;
  document: JsonObject;
  path: string;
  source: '.releaserc.json' | 'package.json';
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

const COMMIT_ANALYZER_PLUGIN = '@semantic-release/commit-analyzer';
const RELEASE_NOTES_PLUGIN = '@semantic-release/release-notes-generator';

function isJsonObject(value: unknown): value is JsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
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
  const commitAnalyzerIndex = names.findIndex(name => name?.includes('commit-analyzer') === true);

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

  const hasReleaseNotesGenerator = plugins
    .map(getPluginName)
    .some(name => name?.includes('release-notes-generator') === true);

  if (!hasReleaseNotesGenerator) {
    plugins.push(RELEASE_NOTES_PLUGIN);
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
    };
  }

  if (!isJsonObject(releaseConfig)) {
    throw new Error(`package.json#release must contain a JSON object when it is present.`);
  }

  return {
    config: releaseConfig,
    document,
    path: packageJsonPath,
    source: 'package.json',
  };
}

export function prepareReleaseConfig(workspace: string): PreparedReleaseConfig {
  const target = findReleaseTarget(workspace);
  const originalExists = fs.existsSync(target.path);
  const originalContent = originalExists ? fs.readFileSync(target.path, 'utf8') : null;
  const nextRules = RELEASE_RULES.map(rule => ({...rule}));
  const before = JSON.stringify(target.config);

  applyForcedRules(target.config, nextRules);
  const changed = before !== JSON.stringify(target.config);
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
