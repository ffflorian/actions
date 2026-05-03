import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as github from '@actions/github';
import * as utils from '../utils';

jest.mock('@actions/core');
jest.mock('@actions/exec');
jest.mock('@actions/github');
jest.mock('../utils');

const mockGetInput = core.getInput as jest.MockedFunction<typeof core.getInput>;
const mockSetFailed = core.setFailed as jest.MockedFunction<typeof core.setFailed>;
const mockSetOutput = core.setOutput as jest.MockedFunction<typeof core.setOutput>;
const mockInfo = core.info as jest.MockedFunction<typeof core.info>;
const mockExec = exec.exec as jest.MockedFunction<typeof exec.exec>;
const mockGetOctokit = github.getOctokit as jest.MockedFunction<typeof github.getOctokit>;
const mockHasChanges = utils.hasChanges as jest.MockedFunction<typeof utils.hasChanges>;
const mockGetLastUpdateDate = utils.getLastUpdateDate as jest.MockedFunction<
  typeof utils.getLastUpdateDate
>;

const mockOctokit = {
  rest: {
    pulls: {
      create: jest.fn(),
      list: jest.fn(),
    },
  },
};

function setupDefaultInputs(overrides: Record<string, string> = {}): void {
  const defaults: Record<string, string> = {
    git_authorship: 'Test Bot <bot@example.com>',
    github_token: 'test-token',
    cooldown_days: '0',
  };
  mockGetInput.mockImplementation((name: string) => overrides[name] ?? defaults[name] ?? '');
}

describe('run', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupDefaultInputs();
    mockGetOctokit.mockReturnValue(mockOctokit as never);
    (github.context as {repo: {owner: string; repo: string}}).repo = {
      owner: 'test-owner',
      repo: 'test-repo',
    };
    mockExec.mockResolvedValue(0);
    mockHasChanges.mockResolvedValue(true);
    mockGetLastUpdateDate.mockResolvedValue(null);
    mockOctokit.rest.pulls.create.mockResolvedValue({
      data: {number: 42, html_url: 'https://github.com/test-owner/test-repo/pull/42'},
    });
  });

  it('should fail when cooldown_days is not a valid integer', async () => {
    setupDefaultInputs({cooldown_days: 'invalid'});
    const {run} = await import('../main');
    await run();

    expect(mockSetFailed).toHaveBeenCalledWith(
      expect.stringContaining('cooldown_days must be a non-negative integer')
    );
  });

  it('should fail when cooldown_days is negative', async () => {
    setupDefaultInputs({cooldown_days: '-5'});
    const {run} = await import('../main');
    await run();

    expect(mockSetFailed).toHaveBeenCalledWith(
      expect.stringContaining('cooldown_days must be a non-negative integer')
    );
  });

  it('should skip when last PR was created within the cooldown period', async () => {
    const recentDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000); // 1 day ago
    mockGetLastUpdateDate.mockResolvedValue(recentDate);
    setupDefaultInputs({cooldown_days: '7'});
    const {run} = await import('../main');
    await run();

    expect(mockInfo).toHaveBeenCalledWith(expect.stringContaining('Skipping'));
    expect(mockExec).not.toHaveBeenCalledWith('hugo', expect.anything());
  });

  it('should run update when last PR is older than the cooldown period', async () => {
    const oldDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    mockGetLastUpdateDate.mockResolvedValue(oldDate);
    setupDefaultInputs({cooldown_days: '7'});
    const {run} = await import('../main');
    await run();

    expect(mockExec).toHaveBeenCalledWith('hugo', ['mod', 'get', '-u', './...']);
  });

  it('should skip creating a PR when no changes are detected', async () => {
    mockHasChanges.mockResolvedValue(false);
    const {run} = await import('../main');
    await run();

    expect(mockInfo).toHaveBeenCalledWith(
      'No changes detected after Hugo module update. Nothing to do.'
    );
    expect(mockOctokit.rest.pulls.create).not.toHaveBeenCalled();
  });

  it('should fail when git_authorship is not in "Name <email>" format', async () => {
    setupDefaultInputs({git_authorship: 'InvalidFormat'});
    const {run} = await import('../main');
    await run();

    expect(mockSetFailed).toHaveBeenCalledWith(
      'git_authorship must be in format "Name <email>"'
    );
  });

  it('should create a PR and set outputs when changes are present', async () => {
    const {run} = await import('../main');
    await run();

    expect(mockExec).toHaveBeenCalledWith('hugo', ['mod', 'get', '-u', './...']);
    expect(mockExec).toHaveBeenCalledWith('hugo', ['mod', 'tidy']);
    expect(mockOctokit.rest.pulls.create).toHaveBeenCalledWith(
      expect.objectContaining({
        owner: 'test-owner',
        repo: 'test-repo',
        title: 'chore(deps): update Hugo modules',
        base: 'main',
      })
    );
    expect(mockSetOutput).toHaveBeenCalledWith('pr_number', '42');
    expect(mockSetOutput).toHaveBeenCalledWith(
      'pr_url',
      'https://github.com/test-owner/test-repo/pull/42'
    );
  });

  it('should configure git with the parsed name and email', async () => {
    setupDefaultInputs({git_authorship: 'My Bot <mybot@org.com>'});
    const {run} = await import('../main');
    await run();

    expect(mockExec).toHaveBeenCalledWith('git', ['config', 'user.name', 'My Bot']);
    expect(mockExec).toHaveBeenCalledWith('git', ['config', 'user.email', 'mybot@org.com']);
  });
});
