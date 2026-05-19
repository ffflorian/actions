import * as core from '@actions/core';
import * as github from '@actions/github';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {buildHeaders, buildPayload, run} from '../main';

vi.mock('@actions/core');

const {mockContext} = vi.hoisted(() => ({
  mockContext: {
    eventName: 'push',
    payload: {ref: 'refs/heads/main', repository: {full_name: 'ffflorian/actions'}},
  },
}));

vi.mock('@actions/github', () => ({
  context: mockContext,
}));

describe('buildPayload', () => {
  it('uses github context payload when payload input is empty', () => {
    expect(buildPayload('')).toEqual(mockContext.payload);
  });

  it('parses payload input JSON when provided', () => {
    expect(buildPayload('{"hello":"world"}')).toEqual({hello: 'world'});
  });

  it('throws for invalid payload JSON', () => {
    expect(() => buildPayload('{invalid')).toThrow('payload must be valid JSON when provided.');
  });
});

describe('buildHeaders', () => {
  it('creates required GitHub-style headers', () => {
    const headers = buildHeaders('push', 'delivery-id', '{"foo":"bar"}');

    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['User-Agent']).toBe('GitHub-Hookshot/actions-webhook');
    expect(headers['X-GitHub-Event']).toBe('push');
    expect(headers['X-GitHub-Delivery']).toBe('delivery-id');
    expect(headers['X-Hub-Signature-256']).toBeUndefined();
  });

  it('adds signature header when secret is provided', () => {
    const headers = buildHeaders('push', 'delivery-id', '{"foo":"bar"}', 'my-secret');

    expect(headers['X-Hub-Signature-256']).toMatch(/^sha256=[0-9a-f]{64}$/);
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
      event_type: 'workflow_dispatch',
      payload: '',
      webhook_secret: '',
      timeout_ms: '10000',
    };

    mockGetInput.mockImplementation((name: string) => overrides[name] ?? defaults[name] ?? '');
  }

  it('sends webhook and sets outputs on success', async () => {
    setupInputs({payload: '{"run":123}', webhook_secret: 'top-secret'});
    vi.mocked(fetch).mockResolvedValue({ok: true, status: 202, text: async () => ''} as Response);

    await run();

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    const headers = options.headers as Record<string, string>;

    expect(url).toBe('https://example.invalid/webhook');
    expect(options.method).toBe('POST');
    expect(options.body).toBe('{"run":123}');
    expect(headers['X-GitHub-Event']).toBe('workflow_dispatch');
    expect(headers['X-Hub-Signature-256']).toMatch(/^sha256=[0-9a-f]{64}$/);
    expect(mockSetOutput).toHaveBeenCalledWith('status_code', '202');
    expect(mockSetOutput).toHaveBeenCalledWith('delivery_id', expect.any(String));
    expect(mockInfo).toHaveBeenCalledWith(expect.stringContaining('Webhook delivered as'));
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
