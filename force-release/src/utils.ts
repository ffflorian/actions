import * as fs from 'node:fs';
import * as path from 'node:path';

export type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
export interface JsonObject {
  [key: string]: JsonValue;
}

export interface ReleaseTarget {
  config: JsonObject;
  document: JsonObject;
  path: string;
  source: '.releaserc.json' | 'package.json';
}

export const RELEASE_RULES = [
  {type: 'feat', release: 'minor'},
  {type: 'fix', release: 'patch'},
  {type: 'perf', release: 'patch'},
  {type: 'revert', release: 'patch'},
  {type: 'docs', release: 'patch'},
  {type: 'style', release: 'patch'},
  {type: 'refactor', release: 'patch'},
  {type: 'ci', release: 'patch'},
  {type: 'chore', release: 'patch'},
] as const;

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

export function updateReleaseRules(workspace: string): {
  changed: boolean;
  path: string;
  source: ReleaseTarget['source'];
} {
  const target = findReleaseTarget(workspace);
  const nextRules = RELEASE_RULES.map(rule => ({...rule}));
  const changed = JSON.stringify(target.config['releaseRules']) !== JSON.stringify(nextRules);

  target.config['releaseRules'] = nextRules;
  fs.writeFileSync(target.path, `${JSON.stringify(target.document, null, 2)}\n`);

  return {
    changed,
    path: target.path,
    source: target.source,
  };
}
