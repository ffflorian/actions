import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as github from '@actions/github';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import * as utils from '../utils';

vi.mock('@actions/core');
vi.mock('@actions/exec');
vi.mock('../utils');

const {mockContext, mockOctokit} = vi.hoisted(() => {
  const mockContext = {repo: {owner: 'test-owner', repo: 'test-repo'}};
  const mockOctokit = {
    rest: {
      pulls: {
        create: vi.fn(),
        list: vi.fn(),
      },
    },
  };
  return {mockContext, mockOctokit};
});

vi.mock('@actions/github', () => ({
  getOctokit: vi.fn(() => mockOctokit),
  context: mockContext,
}));

const mockGetInput = vi.mocked(core.getInput);
const mockSetFailed = vi.mocked(core.setFailed);
const mockSetOutput = vi.mocked(core.setOutput);
const mockInfo = vi.mocked(core.info);
const mockExec = vi.mocked(exec.exec);
const mockGetOctokit = vi.mocked(github.getOctokit);
const mockHasChanges = vi.mocked(utils.hasChanges);
const mockGetLastUpdateDate = vi.mocked(utils.getLastUpdateDate);

function setupDefaultInputs(overrides: Record<string, string> = {}): void {
  const defaults: Record<string, string> = {
    git_authorship: 'Test Bot <bot@example.com>',
    github_token: 'test-token',
    cooldown_days: '0',
  };
  mockGetInput.mockImplementation((name: string) => overrides[name] ?? defaults[name] ?? '');
}

describe('run', () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    setupDefaultInputs();
    mockGetOctokit.mockReturnValue(mockOctokit as never);
    mockContext.repo = {owner: 'test-owner', repo: 'test-repo'};
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

    expect(mockSetFailed).toHaveBeenCalledWith(expect.stringContaining('cooldown_days must be a non-negative integer'));
  });

  it('should fail when cooldown_days is negative', async () => {
    setupDefaultInputs({cooldown_days: '-5'});
    const {run} = await import('../main');
    await run();

    expect(mockSetFailed).toHaveBeenCalledWith(expect.stringContaining('cooldown_days must be a non-negative integer'));
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

    expect(mockInfo).toHaveBeenCalledWith('No changes detected after Hugo module update. Nothing to do.');
    expect(mockOctokit.rest.pulls.create).not.toHaveBeenCalled();
  });

  it('should fail when git_authorship is not in "Name <email>" format', async () => {
    setupDefaultInputs({git_authorship: 'InvalidFormat'});
    const {run} = await import('../main');
    await run();

    expect(mockSetFailed).toHaveBeenCalledWith('git_authorship must be in format "Name <email>"');
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
    expect(mockSetOutput).toHaveBeenCalledWith('pr_url', 'https://github.com/test-owner/test-repo/pull/42');
  });

  it('should configure git with the parsed name and email', async () => {
    setupDefaultInputs({git_authorship: 'My Bot <mybot@org.com>'});
    const {run} = await import('../main');
    await run();

    expect(mockExec).toHaveBeenCalledWith('git', ['config', 'user.name', 'My Bot']);
    expect(mockExec).toHaveBeenCalledWith('git', ['config', 'user.email', 'mybot@org.com']);
  });
});
