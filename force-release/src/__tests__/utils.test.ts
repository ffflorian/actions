import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {afterEach, describe, expect, it} from 'vitest';
import {RELEASE_RULES, findReleaseTarget, prepareReleaseConfig} from '../utils';

const tempDirs: string[] = [];

function createWorkspace(): string {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'force-release-utils-'));
  tempDirs.push(workspace);
  return workspace;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      fs.rmSync(dir, {recursive: true, force: true});
    }
  }
});

describe('findReleaseTarget', () => {
  it('prefers .releaserc.json when it exists', () => {
    const workspace = createWorkspace();
    fs.writeFileSync(path.join(workspace, '.releaserc.json'), JSON.stringify({branches: ['main']}, null, 2));
    fs.writeFileSync(path.join(workspace, 'package.json'), JSON.stringify({release: {branches: ['main']}}, null, 2));

    const target = findReleaseTarget(workspace);

    expect(target.source).toBe('.releaserc.json');
    expect(target.path).toBe(path.join(workspace, '.releaserc.json'));
  });

  it('falls back to package.json release config', () => {
    const workspace = createWorkspace();
    fs.writeFileSync(
      path.join(workspace, 'package.json'),
      JSON.stringify({name: 'demo', release: {branches: ['main']}}, null, 2)
    );

    const target = findReleaseTarget(workspace);

    expect(target.source).toBe('package.json');
    expect(target.config).toEqual({branches: ['main']});
  });

  it('creates a new .releaserc.json target when no release config exists', () => {
    const workspace = createWorkspace();
    fs.writeFileSync(path.join(workspace, 'package.json'), JSON.stringify({name: 'demo'}, null, 2));

    const target = findReleaseTarget(workspace);

    expect(target.source).toBe('.releaserc.json');
    expect(target.path).toBe(path.join(workspace, '.releaserc.json'));
    expect(target.config).toEqual({});
  });

  it('fails when package.json#release is present but invalid', () => {
    const workspace = createWorkspace();
    fs.writeFileSync(path.join(workspace, 'package.json'), JSON.stringify({name: 'demo', release: true}, null, 2));

    expect(() => findReleaseTarget(workspace)).toThrow(
      'package.json#release must contain a JSON object when it is present.'
    );
  });
});

describe('prepareReleaseConfig', () => {
  it('replaces commit-analyzer releaseRules in .releaserc.json plugins and restores it', () => {
    const workspace = createWorkspace();
    const configPath = path.join(workspace, '.releaserc.json');
    const original = JSON.stringify(
      {
        branches: ['main'],
        plugins: [['@semantic-release/commit-analyzer', {preset: 'conventionalcommits'}], '@semantic-release/github'],
      },
      null,
      2
    );
    fs.writeFileSync(configPath, original);

    const result = prepareReleaseConfig(workspace);
    const saved = JSON.parse(fs.readFileSync(configPath, 'utf8')) as {
      plugins: Array<string | [string, {releaseRules?: unknown; preset?: string}]>;
    };

    expect(result).toEqual({
      changed: true,
      appliedConfig: expect.objectContaining({
        branches: ['main'],
        plugins: expect.arrayContaining([
          ['@semantic-release/commit-analyzer', {preset: 'conventionalcommits', releaseRules: RELEASE_RULES}],
          '@semantic-release/github',
          '@semantic-release/release-notes-generator',
        ]),
      }),
      path: configPath,
      source: '.releaserc.json',
      restore: expect.any(Function),
    });
    expect(saved.plugins).toEqual([
      ['@semantic-release/commit-analyzer', {preset: 'conventionalcommits', releaseRules: RELEASE_RULES}],
      '@semantic-release/github',
      '@semantic-release/release-notes-generator',
    ]);

    result.restore();
    expect(fs.readFileSync(configPath, 'utf8')).toBe(original);
  });

  it('updates package.json release rules and restores file content', () => {
    const workspace = createWorkspace();
    const packageJsonPath = path.join(workspace, 'package.json');
    const original = JSON.stringify(
      {
        name: 'demo',
        release: {
          plugins: ['@semantic-release/commit-analyzer', '@semantic-release/github'],
        },
      },
      null,
      2
    );
    fs.writeFileSync(packageJsonPath, original);

    const result = prepareReleaseConfig(workspace);
    const saved = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as {
      release: {
        plugins: Array<string | [string, {releaseRules?: unknown}]>;
      };
    };

    expect(result).toEqual({
      changed: true,
      appliedConfig: expect.objectContaining({
        plugins: [
          ['@semantic-release/commit-analyzer', {releaseRules: RELEASE_RULES}],
          '@semantic-release/github',
          '@semantic-release/release-notes-generator',
        ],
      }),
      path: packageJsonPath,
      source: 'package.json',
      restore: expect.any(Function),
    });
    expect(saved.release.plugins).toEqual([
      ['@semantic-release/commit-analyzer', {releaseRules: RELEASE_RULES}],
      '@semantic-release/github',
      '@semantic-release/release-notes-generator',
    ]);

    result.restore();
    expect(fs.readFileSync(packageJsonPath, 'utf8')).toBe(original);
  });

  it('creates and removes .releaserc.json when no release config exists', () => {
    const workspace = createWorkspace();
    const releaseRcPath = path.join(workspace, '.releaserc.json');
    fs.writeFileSync(path.join(workspace, 'package.json'), JSON.stringify({name: 'demo'}, null, 2));

    const result = prepareReleaseConfig(workspace);
    const saved = JSON.parse(fs.readFileSync(releaseRcPath, 'utf8')) as {releaseRules: unknown};

    expect(result).toEqual({
      changed: true,
      appliedConfig: expect.objectContaining({
        releaseRules: RELEASE_RULES,
      }),
      path: releaseRcPath,
      source: '.releaserc.json',
      restore: expect.any(Function),
    });
    expect(saved.releaseRules).toEqual(RELEASE_RULES);

    result.restore();
    expect(fs.existsSync(releaseRcPath)).toBe(false);
  });
});
