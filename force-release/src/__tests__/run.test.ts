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
    commit_message: 'chore: Force release',
    git_authorship: 'Florian Imdahl <git@ffflorian.de>',
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
  it('updates .releaserc.json and pushes a commit', async () => {
    const workspace = createWorkspace();
    process.env['GITHUB_WORKSPACE'] = workspace;
    fs.writeFileSync(path.join(workspace, '.releaserc.json'), JSON.stringify({branches: ['main']}, null, 2));

    const {run} = await import('../index');
    await run();

    expect(mockExec.mock.calls).toEqual([
      ['git', ['config', 'user.name', 'Florian Imdahl'], {cwd: workspace}],
      ['git', ['config', 'user.email', 'git@ffflorian.de'], {cwd: workspace}],
      ['git', ['add', '.releaserc.json'], {cwd: workspace}],
      ['git', ['commit', '--allow-empty', '-m', 'chore: Force release'], {cwd: workspace}],
      ['git', ['push', 'origin', 'HEAD'], {cwd: workspace}],
    ]);
  });

  it('creates an empty commit when releaseRules already match', async () => {
    const workspace = createWorkspace();
    process.env['GITHUB_WORKSPACE'] = workspace;
    fs.writeFileSync(
      path.join(workspace, 'package.json'),
      JSON.stringify(
        {
          name: 'demo',
          release: {
            releaseRules: [
              {type: 'feat', release: 'minor'},
              {type: 'fix', release: 'patch'},
              {type: 'perf', release: 'patch'},
              {type: 'revert', release: 'patch'},
              {type: 'docs', release: 'patch'},
              {type: 'style', release: 'patch'},
              {type: 'refactor', release: 'patch'},
              {type: 'ci', release: 'patch'},
              {type: 'chore', release: 'patch'},
            ],
          },
        },
        null,
        2
      )
    );

    const {run} = await import('../index');
    await run();

    expect(mockExec).toHaveBeenCalledWith('git', ['commit', '--allow-empty', '-m', 'chore: Force release'], {
      cwd: workspace,
    });
  });

  it('creates .releaserc.json when no release config exists', async () => {
    const workspace = createWorkspace();
    process.env['GITHUB_WORKSPACE'] = workspace;
    fs.writeFileSync(path.join(workspace, 'package.json'), JSON.stringify({name: 'demo'}, null, 2));

    const {run} = await import('../index');
    await run();

    const releaseConfig = JSON.parse(fs.readFileSync(path.join(workspace, '.releaserc.json'), 'utf8')) as {
      releaseRules: unknown[];
    };

    expect(releaseConfig.releaseRules).toHaveLength(9);
    expect(mockExec).toHaveBeenCalledWith('git', ['add', '.releaserc.json'], {cwd: workspace});
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
