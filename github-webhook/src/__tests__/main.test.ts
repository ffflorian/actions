import * as core from '@actions/core';
import {createHmac} from 'node:crypto';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {buildHeaders, buildSyntheticHookId, run} from '../main';

vi.mock('@actions/core');

const {mockContext} = vi.hoisted(() => ({
  mockContext: {
    eventName: 'push',
    payload: {
      ref: 'refs/heads/main',
      repository: {full_name: 'ffflorian/actions', id: 207300990},
    },
  },
}));

vi.mock('@actions/github', () => ({
  context: mockContext,
}));

describe('buildHeaders', () => {
  it('creates required GitHub-style headers', () => {
    const payloadBody = JSON.stringify(mockContext.payload);
    const headers = buildHeaders({
      eventType: 'push',
      deliveryId: '1a57e472-537d-11f1-8e9b-7bc2ead18eb0',
      payloadBody,
      secret: 'super-secret',
      installationTargetId: '207300990',
      installationTargetType: 'repository',
    });

    expect(headers.Accept).toBe('*/*');
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['User-Agent']).toBe('GitHub-Hookshot/1a57e472');
    expect(headers['X-GitHub-Delivery']).toBe('1a57e472-537d-11f1-8e9b-7bc2ead18eb0');
    expect(headers['X-GitHub-Event']).toBe('push');
    expect(headers['X-GitHub-Hook-Id']).toBe(buildSyntheticHookId('1a57e472-537d-11f1-8e9b-7bc2ead18eb0'));
    expect(headers['X-GitHub-Hook-Installation-Target-Id']).toBe('207300990');
    expect(headers['X-GitHub-Hook-Installation-Target-Type']).toBe('repository');
    expect(headers['X-Hub-Signature']).toBe(
      `sha1=${createHmac('sha1', 'super-secret').update(payloadBody).digest('hex')}`
    );
    expect(headers['X-Hub-Signature-256']).toBe(
      `sha256=${createHmac('sha256', 'super-secret').update(payloadBody).digest('hex')}`
    );
  });
});

describe('run', () => {
  const mockGetInput = vi.mocked(core.getInput);
  const mockSetOutput = vi.mocked(core.setOutput);
  const mockInfo = vi.mocked(core.info);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  function setupInputs(overrides: Record<string, string> = {}): void {
    const defaults: Record<string, string> = {
      webhook_url: 'https://example.invalid/webhook',
      secret: '',
      event_type: 'workflow_dispatch',
      timeout_ms: '10000',
    };

    mockGetInput.mockImplementation((name: string) => overrides[name] ?? defaults[name] ?? '');
  }

  it('sends webhook and sets outputs on success', async () => {
    setupInputs();
    vi.mocked(fetch).mockResolvedValue({ok: true, status: 202, text: async () => ''} as Response);

    await run();

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    const headers = options.headers as Record<string, string>;

    expect(url).toBe('https://example.invalid/webhook');
    expect(options.method).toBe('POST');
    expect(options.body).toBe(JSON.stringify(mockContext.payload));
    expect(headers.Accept).toBe('*/*');
    expect(headers['User-Agent']).toMatch(/^GitHub-Hookshot\/[0-9a-f]{8}$/);
    expect(headers['X-GitHub-Event']).toBe('workflow_dispatch');
    expect(headers['X-GitHub-Delivery']).toEqual(expect.any(String));
    expect(headers['X-GitHub-Hook-Id']).toBe(buildSyntheticHookId(headers['X-GitHub-Delivery']));
    expect(headers['X-GitHub-Hook-Installation-Target-Id']).toBe('207300990');
    expect(headers['X-GitHub-Hook-Installation-Target-Type']).toBe('repository');
    expect(headers['X-Hub-Signature-256']).toBeUndefined();
    expect(mockSetOutput).toHaveBeenCalledWith('status_code', '202');
    expect(mockSetOutput).toHaveBeenCalledWith('delivery_id', expect.any(String));
    expect(mockInfo).toHaveBeenCalledWith(expect.stringContaining('Webhook delivered as'));
  });

  it('signs the payload when a secret is provided', async () => {
    setupInputs({secret: 'super-secret'});
    vi.mocked(fetch).mockResolvedValue({ok: true, status: 202, text: async () => ''} as Response);

    await run();

    const [, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    const headers = options.headers as Record<string, string>;
    const payloadBody = JSON.stringify(mockContext.payload);

    expect(headers['X-Hub-Signature']).toBe(
      `sha1=${createHmac('sha1', 'super-secret').update(payloadBody).digest('hex')}`
    );
    expect(headers['X-Hub-Signature-256']).toBe(
      `sha256=${createHmac('sha256', 'super-secret').update(payloadBody).digest('hex')}`
    );
  });

  it('throws for invalid timeout value', async () => {
    setupInputs({timeout_ms: '0'});

    await expect(run()).rejects.toThrow("timeout_ms must be a positive integer, got: '0'.");
    expect(fetch).not.toHaveBeenCalled();
  });

  it('throws on non-success response', async () => {
    setupInputs();
    vi.mocked(fetch).mockResolvedValue({ok: false, status: 500, text: async () => 'boom'} as Response);

    await expect(run()).rejects.toThrow('Webhook request failed with status 500: boom');
    expect(mockSetOutput).toHaveBeenCalledWith('status_code', '500');
  });
});
