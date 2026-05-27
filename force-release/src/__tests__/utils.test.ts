import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {afterEach, describe, expect, it} from 'vitest';
import {RELEASE_RULES, findReleaseTarget, updateReleaseRules} from '../utils';

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
});

describe('updateReleaseRules', () => {
  it('replaces releaseRules in .releaserc.json', () => {
    const workspace = createWorkspace();
    const configPath = path.join(workspace, '.releaserc.json');
    fs.writeFileSync(
      configPath,
      JSON.stringify(
        {
          branches: ['main'],
          releaseRules: [{type: 'build', release: 'patch'}],
        },
        null,
        2
      )
    );

    const result = updateReleaseRules(workspace);
    const saved = JSON.parse(fs.readFileSync(configPath, 'utf8')) as {releaseRules: unknown};

    expect(result).toEqual({
      changed: true,
      path: configPath,
      source: '.releaserc.json',
    });
    expect(saved.releaseRules).toEqual(RELEASE_RULES);
  });

  it('updates package.json release rules and reports unchanged configs', () => {
    const workspace = createWorkspace();
    const packageJsonPath = path.join(workspace, 'package.json');
    fs.writeFileSync(
      packageJsonPath,
      JSON.stringify(
        {
          name: 'demo',
          release: {
            releaseRules: RELEASE_RULES,
          },
        },
        null,
        2
      )
    );

    const result = updateReleaseRules(workspace);
    const saved = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as {release: {releaseRules: unknown}};

    expect(result).toEqual({
      changed: false,
      path: packageJsonPath,
      source: 'package.json',
    });
    expect(saved.release.releaseRules).toEqual(RELEASE_RULES);
  });
});
