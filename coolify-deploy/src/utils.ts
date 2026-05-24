export interface DeployResponse {
  deployments?: Array<{
    deployment_uuid?: string;
    message?: string;
  }>;
}

export interface DeploymentStatusResponse {
  status?: string;
  application_name?: string;
}

export const SUCCESS_STATUSES = new Set(['successful', 'finished']);
export const FAILURE_STATUSES = new Set(['failed', 'cancelled', 'skipped']);
export const IN_PROGRESS_STATUSES = new Set(['running', 'pending', 'queued', 'in_progress', 'processing']);

export function normalizeDomain(domain: string): string {
  return domain
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '');
}

export function parseBooleanInput(name: string, value: string): boolean {
  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  throw new Error(`${name} must be either 'true' or 'false', got: '${value}'.`);
}

export function parsePositiveIntegerInput(name: string, value: string): number {
  if (!/^\d+$/.test(value)) {
    throw new Error(`${name} must be a positive integer, got: '${value}'.`);
  }

  const parsed = Number.parseInt(value, 10);
  if (parsed <= 0) {
    throw new Error(`${name} must be a positive integer, got: '${value}'.`);
  }

  return parsed;
}

export function buildDeployUrl(domain: string, force: boolean, uuid: string): string {
  const url = new URL(`https://${normalizeDomain(domain)}/api/v1/deploy`);
  url.searchParams.set('force', String(force));
  url.searchParams.set('uuid', uuid);
  return url.toString();
}

export function getDeploymentIds(response: DeployResponse): string[] {
  return (response.deployments ?? [])
    .map(deployment => deployment.deployment_uuid?.trim())
    .filter((deploymentUuid): deploymentUuid is string => Boolean(deploymentUuid));
}
