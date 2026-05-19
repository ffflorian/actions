import * as core from '@actions/core';
import * as github from '@actions/github';
import {createHmac, randomUUID} from 'node:crypto';

export function buildPayload(payloadInput: string): unknown {
  if (!payloadInput.trim()) {
    return github.context.payload;
  }

  try {
    return JSON.parse(payloadInput);
  } catch {
    throw new Error('payload must be valid JSON when provided.');
  }
}

export function buildHeaders(
  eventType: string,
  deliveryId: string,
  payloadBody: string,
  webhookSecret?: string
): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'GitHub-Hookshot/actions-webhook',
    'X-GitHub-Delivery': deliveryId,
    'X-GitHub-Event': eventType,
  };

  if (webhookSecret && webhookSecret.length > 0) {
    headers['X-Hub-Signature-256'] = `sha256=${createHmac('sha256', webhookSecret).update(payloadBody).digest('hex')}`;
  }

  return headers;
}

export async function run(): Promise<void> {
  const webhookUrl = core.getInput('webhook_url', {required: true});
  const eventType = core.getInput('event_type') || github.context.eventName || 'workflow_dispatch';
  const payloadInput = core.getInput('payload');
  const webhookSecret = core.getInput('webhook_secret');
  const timeoutInput = core.getInput('timeout_ms') || '10000';
  const timeoutMs = parseInt(timeoutInput, 10);

  if (!/^\d+$/.test(timeoutInput.trim()) || timeoutMs <= 0) {
    throw new Error(`timeout_ms must be a positive integer, got: '${timeoutInput}'.`);
  }

  const payload = buildPayload(payloadInput);
  const payloadBody = JSON.stringify(payload);
  const deliveryId = randomUUID();
  const headers = buildHeaders(eventType, deliveryId, payloadBody, webhookSecret);

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers,
    body: payloadBody,
    signal: AbortSignal.timeout(timeoutMs),
  });

  core.setOutput('delivery_id', deliveryId);
  core.setOutput('status_code', String(response.status));

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Webhook request failed with status ${response.status}: ${responseText.slice(0, 1000)}`);
  }

  core.info(`Webhook delivered as ${deliveryId} with status ${response.status}.`);
}

run().catch(error => {
  core.setFailed(error instanceof Error ? error.message : String(error));
});
