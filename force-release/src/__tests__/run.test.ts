import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

vi.mock('@actions/core');
vi.mock('@actions/exec');

const mockExec = vi.mocked(exec.exec);
const mockGetExecOutput = vi.mocked(exec.getExecOutput);
const mockGetInput = vi.mocked(core.getInput);
const mockInfo = vi.mocked(core.info);
const mockSetFailed = vi.mocked(core.setFailed);

const tempDirs: string[] = [];

function createWorkspace(): string {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'force-release-run-'));
  tempDirs.push(workspace);
  return workspace;
}

function setupInputs(overrides: Record<string, string> = {}): void {
  const defaults: Record<string, string> = {
    GITHUB_TOKEN: 'token',
    git_authorship: 'Florian Imdahl <git@ffflorian.de>',
    assets: 'CHANGELOG.md',
    run_command: 'npx --no semantic-release',
  };

  mockGetInput.mockImplementation((name: string) => overrides[name] ?? defaults[name] ?? '');
}

beforeEach(() => {
  vi.clearAllMocks();
  mockExec.mockResolvedValue(0);
  mockGetExecOutput.mockResolvedValue({exitCode: 0, stdout: '', stderr: ''});
  setupInputs();
});

afterEach(() => {
  delete process.env.GITHUB_WORKSPACE;

  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      fs.rmSync(dir, {recursive: true, force: true});
    }
  }
});

describe('run', () => {
  it('prepares release config and runs semantic-release command', async () => {
    const workspace = createWorkspace();
    process.env.GITHUB_WORKSPACE = workspace;
    const configPath = path.join(workspace, '.releaserc.json');
    const original = JSON.stringify({branches: ['main']}, null, 2);
    fs.writeFileSync(configPath, original);

    const {run} = await import('../index');
    await run();

    expect(mockExec.mock.calls).toEqual([
      [
        'bash',
        [
          '-lc',
          'corepack yarn add --dev --exact semantic-release @semantic-release/changelog @semantic-release/git @semantic-release/commit-analyzer @semantic-release/release-notes-generator',
        ],
        {cwd: workspace},
      ],
      ['git', ['config', 'user.name', 'Florian Imdahl'], {cwd: workspace}],
      ['git', ['config', 'user.email', 'git@ffflorian.de'], {cwd: workspace}],
      [
        'bash',
        ['-lc', 'npx --no semantic-release'],
        {
          cwd: workspace,
          env: expect.objectContaining({
            GITHUB_TOKEN: 'token',
            GIT_AUTHOR_NAME: 'Florian Imdahl',
            GIT_AUTHOR_EMAIL: 'git@ffflorian.de',
            GIT_COMMITTER_NAME: 'Florian Imdahl',
            GIT_COMMITTER_EMAIL: 'git@ffflorian.de',
          }),
        },
      ],
    ]);
    const appliedConfigLogs = mockInfo.mock.calls.filter(
      ([message]) =>
        typeof message === 'string' &&
        message.includes('This is the release config which will be applied before running semantic-release:')
    );
    expect(appliedConfigLogs).toHaveLength(1);
    expect(fs.readFileSync(configPath, 'utf8')).toBe(original);

    expect(mockGetExecOutput.mock.calls).toEqual([
      ['git', ['checkout', '--', 'yarn.lock'], {cwd: workspace, ignoreReturnCode: true, silent: true}],
      ['git', ['checkout', '--', 'package.json'], {cwd: workspace, ignoreReturnCode: true, silent: true}],
      ['git', ['checkout', '--', 'package-lock.json'], {cwd: workspace, ignoreReturnCode: true, silent: true}],
    ]);
  });

  it('uses a custom release command input', async () => {
    const workspace = createWorkspace();
    process.env.GITHUB_WORKSPACE = workspace;
    setupInputs({run_command: 'npx --no semantic-release -- --dry-run'});
    fs.writeFileSync(path.join(workspace, '.releaserc.json'), JSON.stringify({branches: ['main']}, null, 2));

    const {run} = await import('../index');
    await run();

    expect(mockExec).toHaveBeenNthCalledWith(
      1,
      'bash',
      [
        '-lc',
        'corepack yarn add --dev --exact semantic-release @semantic-release/changelog @semantic-release/git @semantic-release/commit-analyzer @semantic-release/release-notes-generator',
      ],
      {cwd: workspace}
    );
    expect(mockExec).toHaveBeenCalledWith('bash', ['-lc', 'npx --no semantic-release -- --dry-run'], {
      cwd: workspace,
      env: expect.objectContaining({
        GITHUB_TOKEN: 'token',
      }),
    });
  });

  it('deletes a lock file when git reports it did not match any file', async () => {
    const workspace = createWorkspace();
    process.env.GITHUB_WORKSPACE = workspace;
    fs.writeFileSync(path.join(workspace, '.releaserc.json'), JSON.stringify({branches: ['main']}, null, 2));
    const yarnLockPath = path.join(workspace, 'yarn.lock');
    fs.writeFileSync(yarnLockPath, '');

    mockGetExecOutput.mockImplementation(async (_cmd, args) => {
      const file = (args as string[])[2];
      if (file === 'yarn.lock') {
        return {exitCode: 1, stdout: '', stderr: "error: pathspec 'yarn.lock' did not match any file(s) known to git"};
      }
      return {exitCode: 0, stdout: '', stderr: ''};
    });

    const {run} = await import('../index');
    await run();

    expect(fs.existsSync(yarnLockPath)).toBe(false);
  });

  it('creates and removes .releaserc.json when no release config exists', async () => {
    const workspace = createWorkspace();
    process.env.GITHUB_WORKSPACE = workspace;
    fs.writeFileSync(path.join(workspace, 'package.json'), JSON.stringify({name: 'demo'}, null, 2));

    const {run} = await import('../index');
    await run();

    expect(fs.existsSync(path.join(workspace, '.releaserc.json'))).toBe(false);
  });

  it('creates a minimal .releaserc.json when package.json#release exists', async () => {
    const workspace = createWorkspace();
    process.env.GITHUB_WORKSPACE = workspace;
    setupInputs({assets: 'CHANGELOG.md\ndocs/RELEASE.md'});
    fs.writeFileSync(
      path.join(workspace, 'package.json'),
      JSON.stringify(
        {
          name: 'demo',
          release: {
            branches: ['main'],
          },
        },
        null,
        2
      )
    );

    const {run} = await import('../index');
    await run();

    const appliedConfigLog = mockInfo.mock.calls.find(
      ([message]) =>
        typeof message === 'string' &&
        message.includes('This is the release config which will be applied before running semantic-release:')
    );

    expect(appliedConfigLog?.[0]).toContain('"plugins": [');
    expect(appliedConfigLog?.[0]).toContain('"@semantic-release/commit-analyzer"');
    expect(appliedConfigLog?.[0]).not.toContain('"@semantic-release/git"');
    expect(fs.existsSync(path.join(workspace, '.releaserc.json'))).toBe(false);
    expect(JSON.parse(fs.readFileSync(path.join(workspace, 'package.json'), 'utf8'))).toEqual({
      name: 'demo',
      release: {
        branches: ['main'],
      },
    });
  });

  it('restores release config when semantic-release command fails', async () => {
    const workspace = createWorkspace();
    process.env.GITHUB_WORKSPACE = workspace;
    const configPath = path.join(workspace, '.releaserc.json');
    const original = JSON.stringify({branches: ['main']}, null, 2);
    fs.writeFileSync(configPath, original);
    mockExec.mockImplementation(async (command: string) => {
      if (command === 'bash') {
        throw new Error('semantic-release failed');
      }
      return 0;
    });

    const {run} = await import('../index');
    await expect(run()).rejects.toThrow('semantic-release failed');
    expect(fs.readFileSync(configPath, 'utf8')).toBe(original);
  });

  it('reports failures when run as the entrypoint', async () => {
    setupInputs({git_authorship: 'invalid'});
    const workspace = createWorkspace();
    process.env.GITHUB_WORKSPACE = workspace;
    fs.writeFileSync(path.join(workspace, '.releaserc.json'), JSON.stringify({branches: ['main']}, null, 2));

    const {run} = await import('../index');

    await expect(run()).rejects.toThrow('Invalid git_authorship format: "invalid". Expected "Name <email>".');
    expect(mockSetFailed).not.toHaveBeenCalled();
  });
});
