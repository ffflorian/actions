import * as core from '@actions/core';
import * as github from '@actions/github';
import {beforeEach, describe, expect, it, vi} from 'vitest';

vi.mock('@actions/core');
vi.mock('@actions/github');

const mockGetInput = vi.mocked(core.getInput);
const mockInfo = vi.mocked(core.info);
const mockSetFailed = vi.mocked(core.setFailed);
const mockGetOctokit = vi.mocked(github.getOctokit);

const mockCreateDeployment = vi.fn();
const mockCreateDeploymentStatus = vi.fn();
const mockGetLatestRelease = vi.fn();

function setupInputs(overrides: Record<string, string> = {}): void {
  const defaults: Record<string, string> = {
    token: 'test-token',
    domain: 'coolify.example.com',
    uuid: 'resource-1',
    force: 'false',
    waitForDeploy: 'false',
    timeout: '300',
    interval: '10',
    GITHUB_TOKEN: '',
    environment: 'production',
  };

  mockGetInput.mockImplementation((name: string) => overrides[name] ?? defaults[name] ?? '');
}

function setupOctokit(): void {
  mockGetLatestRelease.mockResolvedValue({data: {tag_name: 'v1.0.0'}});

  mockGetOctokit.mockReturnValue({
    rest: {
      repos: {
        createDeployment: mockCreateDeployment,
        createDeploymentStatus: mockCreateDeploymentStatus,
        getLatestRelease: mockGetLatestRelease,
      },
    },
  } as unknown as ReturnType<typeof github.getOctokit>);

  vi.mocked(github).context = {
    repo: {owner: 'test-owner', repo: 'test-repo'},
    sha: 'abc123',
  } as typeof github.context;
}

describe('run', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    vi.useRealTimers();
    setupInputs();
  });

  it('fails when uuid is missing', async () => {
    setupInputs({uuid: '  '});
    const {run} = await import('..');

    await run();

    expect(mockSetFailed).toHaveBeenCalledWith('uuid input is required.');
  });

  it('fails when domain is empty', async () => {
    setupInputs({domain: '  '});
    const {run} = await import('..');

    await run();

    expect(mockSetFailed).toHaveBeenCalledWith('domain input must not be empty.');
  });

  it('throws when the deploy request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 500,
        text: async () => '{"error":"boom"}',
      })
    );

    const {run} = await import('..');

    await expect(run()).rejects.toThrow('Deployment request failed with HTTP status 500.');
  });

  it('requests a deployment without waiting when waitForDeploy is false', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      text: async () => JSON.stringify({deployments: [{deployment_uuid: 'deployment-1'}]}),
    });
    vi.stubGlobal('fetch', fetchMock);

    const {run} = await import('..');
    await run();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://coolify.example.com/api/v1/deploy?force=false&uuid=resource-1',
      expect.objectContaining({
        headers: expect.objectContaining({Authorization: 'Bearer test-token'}),
      })
    );
    expect(mockInfo).toHaveBeenCalledWith('✅ Deployment request sent successfully (not waiting for completion).');
  });

  it('waits for deployments until they succeed', async () => {
    setupInputs({waitForDeploy: 'true', timeout: '2', interval: '1'});
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        status: 200,
        text: async () => JSON.stringify({deployments: [{deployment_uuid: 'deployment-1', message: 'queued'}]}),
      })
      .mockResolvedValueOnce({
        status: 200,
        text: async () => JSON.stringify({status: 'running', application_name: 'my-app'}),
      })
      .mockResolvedValueOnce({
        status: 200,
        text: async () => JSON.stringify({status: 'successful', application_name: 'my-app'}),
      });
    vi.stubGlobal('fetch', fetchMock);
    vi.useFakeTimers();

    const {run} = await import('..');
    const runPromise = run();
    await vi.runAllTimersAsync();
    await runPromise;

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(mockInfo).toHaveBeenCalledWith('✅ Deployment completed successfully.');
  });

  describe('GitHub deployment status', () => {
    it('creates a deployment and sets in_progress then success when not waiting', async () => {
      setupInputs({GITHUB_TOKEN: 'gh-token'});
      setupOctokit();
      mockCreateDeployment.mockResolvedValue({status: 201, data: {id: 42}});
      mockCreateDeploymentStatus.mockResolvedValue({});

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          status: 200,
          text: async () => JSON.stringify({deployments: [{deployment_uuid: 'deployment-1'}]}),
        })
      );

      const {run} = await import('..');
      await run();

      expect(mockCreateDeployment).toHaveBeenCalledWith(
        expect.objectContaining({owner: 'test-owner', repo: 'test-repo', ref: 'v1.0.0', environment: 'production'})
      );
      expect(mockCreateDeploymentStatus).toHaveBeenCalledWith(
        expect.objectContaining({deployment_id: 42, state: 'in_progress'})
      );
      expect(mockCreateDeploymentStatus).toHaveBeenCalledWith(
        expect.objectContaining({deployment_id: 42, state: 'success'})
      );
    });

    it('sets failure status when deploy request fails', async () => {
      setupInputs({GITHUB_TOKEN: 'gh-token'});
      setupOctokit();
      mockCreateDeployment.mockResolvedValue({status: 201, data: {id: 42}});
      mockCreateDeploymentStatus.mockResolvedValue({});

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          status: 500,
          text: async () => '{"error":"boom"}',
        })
      );

      const {run} = await import('..');
      await expect(run()).rejects.toThrow('Deployment request failed with HTTP status 500.');

      expect(mockCreateDeploymentStatus).toHaveBeenCalledWith(
        expect.objectContaining({deployment_id: 42, state: 'in_progress'})
      );
      expect(mockCreateDeploymentStatus).toHaveBeenCalledWith(
        expect.objectContaining({deployment_id: 42, state: 'failure'})
      );
    });

    it('sets success status after waiting for deployments', async () => {
      setupInputs({GITHUB_TOKEN: 'gh-token', waitForDeploy: 'true', timeout: '2', interval: '1'});
      setupOctokit();
      mockCreateDeployment.mockResolvedValue({status: 201, data: {id: 99}});
      mockCreateDeploymentStatus.mockResolvedValue({});

      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce({
          status: 200,
          text: async () => JSON.stringify({deployments: [{deployment_uuid: 'dep-1', message: 'queued'}]}),
        })
        .mockResolvedValueOnce({
          status: 200,
          text: async () => JSON.stringify({status: 'successful', application_name: 'my-app'}),
        });
      vi.stubGlobal('fetch', fetchMock);
      vi.useFakeTimers();

      const {run} = await import('..');
      const runPromise = run();
      await vi.runAllTimersAsync();
      await runPromise;

      expect(mockCreateDeploymentStatus).toHaveBeenCalledWith(
        expect.objectContaining({deployment_id: 99, state: 'success'})
      );
    });

    it('skips GitHub status when GITHUB_TOKEN is not provided', async () => {
      setupInputs({GITHUB_TOKEN: ''});

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          status: 200,
          text: async () => JSON.stringify({deployments: [{deployment_uuid: 'deployment-1'}]}),
        })
      );

      const {run} = await import('..');
      await run();

      expect(mockGetOctokit).not.toHaveBeenCalled();
    });

    it('uses custom environment name', async () => {
      setupInputs({GITHUB_TOKEN: 'gh-token', environment: 'staging'});
      setupOctokit();
      mockCreateDeployment.mockResolvedValue({status: 201, data: {id: 7}});
      mockCreateDeploymentStatus.mockResolvedValue({});

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          status: 200,
          text: async () => JSON.stringify({deployments: [{deployment_uuid: 'deployment-1'}]}),
        })
      );

      const {run} = await import('..');
      await run();

      expect(mockCreateDeployment).toHaveBeenCalledWith(expect.objectContaining({environment: 'staging'}));
    });

    it('uses latest release tag as deployment ref', async () => {
      setupInputs({GITHUB_TOKEN: 'gh-token'});
      setupOctokit();
      mockGetLatestRelease.mockResolvedValue({data: {tag_name: 'v2.3.4'}});
      mockCreateDeployment.mockResolvedValue({status: 201, data: {id: 8}});
      mockCreateDeploymentStatus.mockResolvedValue({});

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          status: 200,
          text: async () => JSON.stringify({deployments: [{deployment_uuid: 'deployment-1'}]}),
        })
      );

      const {run} = await import('..');
      await run();

      expect(mockCreateDeployment).toHaveBeenCalledWith(expect.objectContaining({ref: 'v2.3.4'}));
    });

    it('falls back to context sha when no release exists', async () => {
      setupInputs({GITHUB_TOKEN: 'gh-token'});
      setupOctokit();
      mockGetLatestRelease.mockRejectedValue(new Error('Not Found'));
      mockCreateDeployment.mockResolvedValue({status: 201, data: {id: 9}});
      mockCreateDeploymentStatus.mockResolvedValue({});

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          status: 200,
          text: async () => JSON.stringify({deployments: [{deployment_uuid: 'deployment-1'}]}),
        })
      );

      const {run} = await import('..');
      await run();

      expect(mockCreateDeployment).toHaveBeenCalledWith(expect.objectContaining({ref: 'abc123'}));
      expect(mockInfo).toHaveBeenCalledWith('ℹ️ No release tag found; using commit SHA as deployment ref: abc123');
    });
  });
});
