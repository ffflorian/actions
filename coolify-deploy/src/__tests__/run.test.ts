import * as core from '@actions/core';
import {beforeEach, describe, expect, it, vi} from 'vitest';

vi.mock('@actions/core');

const mockGetInput = vi.mocked(core.getInput);
const mockInfo = vi.mocked(core.info);
const mockSetFailed = vi.mocked(core.setFailed);

function setupInputs(overrides: Record<string, string> = {}): void {
  const defaults: Record<string, string> = {
    token: 'test-token',
    domain: 'coolify.example.com',
    uuid: 'resource-1',
    force: 'false',
    waitForDeploy: 'false',
    timeout: '300',
    interval: '10',
  };

  mockGetInput.mockImplementation((name: string) => overrides[name] ?? defaults[name] ?? '');
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
    const {run} = await import('../main');

    await run();

    expect(mockSetFailed).toHaveBeenCalledWith('uuid input is required.');
  });

  it('fails when domain is empty', async () => {
    setupInputs({domain: '  '});
    const {run} = await import('../main');

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

    const {run} = await import('../main');

    await expect(run()).rejects.toThrow('Deployment request failed with HTTP status 500.');
  });

  it('requests a deployment without waiting when waitForDeploy is false', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      text: async () => JSON.stringify({deployments: [{deployment_uuid: 'deployment-1'}]}),
    });
    vi.stubGlobal('fetch', fetchMock);

    const {run} = await import('../main');
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

    const {run} = await import('../main');
    const runPromise = run();
    await vi.runAllTimersAsync();
    await runPromise;

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(mockInfo).toHaveBeenCalledWith('✅ All 1 deployment(s) completed successfully.');
  });
});
