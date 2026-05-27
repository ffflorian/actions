import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

vi.mock('@actions/core');
vi.mock('@actions/exec');

const mockExec = vi.mocked(exec.exec);
const mockGetInput = vi.mocked(core.getInput);
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
    run_command: 'npx --no semantic-release',
  };

  mockGetInput.mockImplementation((name: string) => overrides[name] ?? defaults[name] ?? '');
}

beforeEach(() => {
  vi.clearAllMocks();
  mockExec.mockResolvedValue(0);
  setupInputs();
});

afterEach(() => {
  delete process.env['GITHUB_WORKSPACE'];

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
    process.env['GITHUB_WORKSPACE'] = workspace;
    const configPath = path.join(workspace, '.releaserc.json');
    const original = JSON.stringify({branches: ['main']}, null, 2);
    fs.writeFileSync(configPath, original);

    const {run} = await import('../index');
    await run();

    expect(mockExec.mock.calls).toEqual([
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
    expect(fs.readFileSync(configPath, 'utf8')).toBe(original);
  });

  it('uses a custom release command input', async () => {
    const workspace = createWorkspace();
    process.env['GITHUB_WORKSPACE'] = workspace;
    setupInputs({run_command: 'npx --no semantic-release -- --dry-run'});
    fs.writeFileSync(path.join(workspace, '.releaserc.json'), JSON.stringify({branches: ['main']}, null, 2));

    const {run} = await import('../index');
    await run();

    expect(mockExec).toHaveBeenCalledWith('bash', ['-lc', 'npx --no semantic-release -- --dry-run'], {
      cwd: workspace,
      env: expect.objectContaining({
        GITHUB_TOKEN: 'token',
      }),
    });
  });

  it('creates and removes .releaserc.json when no release config exists', async () => {
    const workspace = createWorkspace();
    process.env['GITHUB_WORKSPACE'] = workspace;
    fs.writeFileSync(path.join(workspace, 'package.json'), JSON.stringify({name: 'demo'}, null, 2));

    const {run} = await import('../index');
    await run();

    expect(fs.existsSync(path.join(workspace, '.releaserc.json'))).toBe(false);
  });

  it('restores release config when semantic-release command fails', async () => {
    const workspace = createWorkspace();
    process.env['GITHUB_WORKSPACE'] = workspace;
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
    process.env['GITHUB_WORKSPACE'] = workspace;
    fs.writeFileSync(path.join(workspace, '.releaserc.json'), JSON.stringify({branches: ['main']}, null, 2));

    const {run} = await import('../index');

    await expect(run()).rejects.toThrow('Invalid git_authorship format: "invalid". Expected "Name <email>".');
    expect(mockSetFailed).not.toHaveBeenCalled();
  });
});
