import * as core from '@actions/core';
import * as github from '@actions/github';
import {createHmac, randomUUID} from 'node:crypto';

type HeaderOptions = {
  eventType: string;
  deliveryId: string;
  payloadBody: string;
  secret?: string;
  hookId?: string;
  installationTargetId?: string;
  installationTargetType?: string;
};

type PayloadWithTargets = {
  organization?: {id?: number | string};
  repository?: {id?: number | string};
};

function buildHookshotUserAgent(deliveryId: string): string {
  return `GitHub-Hookshot/${deliveryId.replaceAll('-', '').slice(0, 8)}`;
}

function buildSignatureHeaders(payloadBody: string, secret: string): Record<string, string> {
  return {
    'X-Hub-Signature': `sha1=${createHmac('sha1', secret).update(payloadBody).digest('hex')}`,
    'X-Hub-Signature-256': `sha256=${createHmac('sha256', secret).update(payloadBody).digest('hex')}`,
  };
}

function resolveInstallationTarget(
  payload: PayloadWithTargets
): Pick<HeaderOptions, 'installationTargetId' | 'installationTargetType'> {
  if (payload.repository?.id !== undefined) {
    return {
      installationTargetId: String(payload.repository.id),
      installationTargetType: 'repository',
    };
  }

  if (payload.organization?.id !== undefined) {
    return {
      installationTargetId: String(payload.organization.id),
      installationTargetType: 'organization',
    };
  }

  return {};
}

export function buildHeaders({
  eventType,
  deliveryId,
  payloadBody,
  secret,
  hookId,
  installationTargetId,
  installationTargetType,
}: HeaderOptions): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: '*/*',
    'Content-Type': 'application/json',
    'User-Agent': buildHookshotUserAgent(deliveryId),
    'X-Github-Delivery': deliveryId,
    'X-Github-Event': eventType,
  };

  if (hookId) {
    headers['X-Github-Hook-Id'] = hookId;
  }

  if (installationTargetId && installationTargetType) {
    headers['X-Github-Hook-Installation-Target-Id'] = installationTargetId;
    headers['X-Github-Hook-Installation-Target-Type'] = installationTargetType;
  }

  if (secret) {
    Object.assign(headers, buildSignatureHeaders(payloadBody, secret));
  }

  return headers;
}

export async function run(): Promise<void> {
  const webhookUrl = core.getInput('webhook_url', {required: true});
  const secret = core.getInput('secret');
  const eventType = core.getInput('event_type') || github.context.eventName || 'workflow_dispatch';
  const hookId = core.getInput('hook_id').trim();
  const timeoutInput = core.getInput('timeout_ms') || '10000';
  const timeoutMs = parseInt(timeoutInput, 10);

  if (!/^\d+$/.test(timeoutInput.trim()) || timeoutMs <= 0) {
    throw new Error(`timeout_ms must be a positive integer, got: '${timeoutInput}'.`);
  }

  const payload = github.context.payload;
  const payloadBody = JSON.stringify(payload);
  const deliveryId = randomUUID();
  const headers = buildHeaders({
    eventType,
    deliveryId,
    payloadBody,
    secret,
    hookId,
    ...resolveInstallationTarget(payload as PayloadWithTargets),
  });

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

if (require.main === module) {
  run().catch(error => {
    core.setFailed(error instanceof Error ? error.message : String(error));
  });
}
