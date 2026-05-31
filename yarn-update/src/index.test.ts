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
  const issuesAddAssignees = vi.fn();
  const pullsRequestReviewers = vi.fn();
  const getOctokit = vi.fn(() => ({
    rest: {
      issues: {
        addAssignees: issuesAddAssignees,
      },
      pulls: {
        list: pullsList,
        update: pullsUpdate,
        create: pullsCreate,
        requestReviewers: pullsRequestReviewers,
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
    issuesAddAssignees,
    pullsCreate,
    pullsList,
    pullsRequestReviewers,
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
    mocks.pullsCreate.mockResolvedValue({data: {number: 99}});
    mocks.issuesAddAssignees.mockResolvedValue({});
    mocks.pullsRequestReviewers.mockResolvedValue({});

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
    expect(mocks.issuesAddAssignees).not.toHaveBeenCalled();
    expect(mocks.pullsRequestReviewers).not.toHaveBeenCalled();
    expect(mocks.exec).toHaveBeenCalledWith('git', [
      'push',
      '--force',
      'https://x-access-token:token-123@github.com/ffflorian/actions',
      'chore/deps/yarn-4.15.0',
    ]);
    expect(mocks.setFailed).not.toHaveBeenCalled();
  });

  it('assigns and requests a reviewer when creating a new pull request', async () => {
    mocks.getInput.mockImplementation((name: string) => {
      if (name === 'git_authorship') {
        return 'Bot <bot@example.com>';
      }
      if (name === 'release_cooldown_days') {
        return '0';
      }
      if (name === 'assignees') {
        return 'octocat';
      }
      if (name === 'reviewers') {
        return 'monalisa';
      }
      return '';
    });

    mocks.pullsList.mockResolvedValue({data: []});

    await import('./index.js');

    await vi.waitFor(() => {
      expect(mocks.pullsCreate).toHaveBeenCalledWith({
        owner: 'ffflorian',
        repo: 'actions',
        title: 'chore(deps): bump yarn to version 4.15.0',
        body:
          'This PR updates all yarn installations in this repository to version **4.15.0**.\n\n' +
          'See the [release notes](https://github.com/yarnpkg/berry/releases/tag/%40yarnpkg%2Fcli%2F4.15.0) for more details.',
        head: 'chore/deps/yarn-4.15.0',
        base: 'main',
      });
    });

    expect(mocks.issuesAddAssignees).toHaveBeenCalledWith({
      owner: 'ffflorian',
      repo: 'actions',
      issue_number: 99,
      assignees: ['octocat'],
    });

    expect(mocks.pullsRequestReviewers).toHaveBeenCalledWith({
      owner: 'ffflorian',
      repo: 'actions',
      pull_number: 99,
      reviewers: ['monalisa'],
    });

    expect(mocks.setFailed).not.toHaveBeenCalled();
  });

  it('assigns and requests a reviewer when updating an existing pull request', async () => {
    mocks.getInput.mockImplementation((name: string) => {
      if (name === 'git_authorship') {
        return 'Bot <bot@example.com>';
      }
      if (name === 'release_cooldown_days') {
        return '0';
      }
      if (name === 'assignees') {
        return 'octocat';
      }
      if (name === 'reviewers') {
        return 'monalisa';
      }
      return '';
    });

    await import('./index.js');

    await vi.waitFor(() => {
      expect(mocks.issuesAddAssignees).toHaveBeenCalledWith({
        owner: 'ffflorian',
        repo: 'actions',
        issue_number: 42,
        assignees: ['octocat'],
      });
    });

    expect(mocks.pullsRequestReviewers).toHaveBeenCalledWith({
      owner: 'ffflorian',
      repo: 'actions',
      pull_number: 42,
      reviewers: ['monalisa'],
    });

    expect(mocks.pullsCreate).not.toHaveBeenCalled();
    expect(mocks.setFailed).not.toHaveBeenCalled();
  });
});
