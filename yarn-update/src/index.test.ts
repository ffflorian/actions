import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

const mocks = vi.hoisted(() => {
  const getInput = vi.fn();
  const info = vi.fn();
  const error = vi.fn();
  const setFailed = vi.fn();
  const setOutput = vi.fn();

  const exec = vi.fn(async (cmd: string, args: string[], options?: {listeners?: {stdout?: (data: Buffer) => void}}) => {
    if (options?.listeners?.stdout) {
      if (cmd === 'yarn' && args[0] === '--version') {
        const version = mocks.yarnVersionReads === 0 ? '4.14.0' : '4.15.0';
        mocks.yarnVersionReads += 1;
        options.listeners.stdout(Buffer.from(version));
      }

      if (cmd === 'git' && args.join(' ') === 'remote get-url origin') {
        options.listeners.stdout(Buffer.from('https://github.com/ffflorian/actions'));
      }
    }

    return 0;
  });

  const pullsList = vi.fn();
  const pullsUpdate = vi.fn();
  const pullsCreate = vi.fn();
  const getOctokit = vi.fn(() => ({
    rest: {
      pulls: {
        list: pullsList,
        update: pullsUpdate,
        create: pullsCreate,
      },
    },
  }));

  const findYarnDirs = vi.fn();
  const hasGitRepository = vi.fn();
  const fetchEligibleRelease = vi.fn();
  const compareVersions = vi.fn((a: string, b: string) => (a === b ? 0 : a < b ? -1 : 1));

  return {
    compareVersions,
    error,
    exec,
    fetchEligibleRelease,
    findYarnDirs,
    getInput,
    getOctokit,
    hasGitRepository,
    info,
    pullsCreate,
    pullsList,
    pullsUpdate,
    setFailed,
    setOutput,
    yarnVersionReads: 0,
  };
});

vi.mock('@actions/core', () => ({
  error: mocks.error,
  getInput: mocks.getInput,
  info: mocks.info,
  setFailed: mocks.setFailed,
  setOutput: mocks.setOutput,
}));

vi.mock('@actions/exec', () => ({
  exec: mocks.exec,
}));

vi.mock('@actions/github', () => ({
  context: {
    repo: {owner: 'ffflorian', repo: 'actions'},
  },
  getOctokit: mocks.getOctokit,
}));

vi.mock('./utils.js', () => ({
  compareVersions: mocks.compareVersions,
  fetchEligibleRelease: mocks.fetchEligibleRelease,
  findYarnDirs: mocks.findYarnDirs,
  hasGitRepository: mocks.hasGitRepository,
}));

describe('yarn-update index', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    mocks.yarnVersionReads = 0;
    mocks.getInput.mockImplementation((name: string) => {
      if (name === 'git_authorship') {
        return 'Bot <bot@example.com>';
      }

      if (name === 'release_cooldown_days') {
        return '0';
      }

      return '';
    });

    mocks.hasGitRepository.mockReturnValue(true);
    mocks.findYarnDirs.mockReturnValue(['/workspace/.yarn']);
    mocks.fetchEligibleRelease.mockResolvedValue(null);
    mocks.pullsList.mockResolvedValue({data: [{number: 42}]});
    mocks.pullsUpdate.mockResolvedValue({});
    mocks.pullsCreate.mockResolvedValue({});

    process.env.GITHUB_TOKEN = 'token-123';
    process.env.GITHUB_WORKSPACE = '/workspace';
  });

  afterEach(() => {
    delete process.env.GITHUB_TOKEN;
    delete process.env.GITHUB_WORKSPACE;
  });

  it('updates existing branch pull request instead of creating a new one', async () => {
    await import('./index.js');

    await vi.waitFor(() => {
      expect(mocks.pullsList).toHaveBeenCalledWith({
        owner: 'ffflorian',
        repo: 'actions',
        state: 'open',
        head: 'ffflorian:chore/deps/yarn-4.15.0',
        base: 'main',
      });
    });

    expect(mocks.pullsUpdate).toHaveBeenCalledWith({
      owner: 'ffflorian',
      repo: 'actions',
      pull_number: 42,
      title: 'chore(deps): bump yarn to version 4.15.0',
      body:
        'This PR updates all yarn installations in this repository to version **4.15.0**.\n\n' +
        'See the [release notes](https://github.com/yarnpkg/berry/releases/tag/%40yarnpkg%2Fcli%2F4.15.0) for more details.',
    });

    expect(mocks.pullsCreate).not.toHaveBeenCalled();
    expect(mocks.exec).toHaveBeenCalledWith('git', [
      'push',
      '--force',
      'https://x-access-token:token-123@github.com/ffflorian/actions',
      'chore/deps/yarn-4.15.0',
    ]);
    expect(mocks.setFailed).not.toHaveBeenCalled();
  });
});
