import * as core from '@actions/core';
import * as github from '@actions/github';
import {
  buildDeployUrl,
  FAILURE_STATUSES,
  getDeploymentIds,
  IN_PROGRESS_STATUSES,
  isValidDomain,
  type DeployResponse,
  type DeploymentStatusResponse,
  normalizeDomain,
  parseBooleanInput,
  parsePositiveIntegerInput,
  SUCCESS_STATUSES,
} from './utils';

type Octokit = ReturnType<typeof github.getOctokit>;
type GithubDeploymentState = 'in_progress' | 'success' | 'failure';

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

async function requestJson<T>(
  url: string,
  token: string,
  httpMethod: string = 'GET'
): Promise<{body: T; status: number; text: string}> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    method: httpMethod,
  });

  const text = await response.text();
  let body = {} as T;
  if (text) {
    try {
      body = JSON.parse(text) as T;
    } catch {
      body = {} as T;
    }
  }

  return {
    body,
    status: response.status,
    text,
  };
}

async function getLatestReleaseTag(octokit: Octokit): Promise<string | undefined> {
  await sleep(5000);
  try {
    const {owner, repo} = github.context.repo;
    const response = await octokit.rest.repos.getLatestRelease({owner, repo});
    return response.data.tag_name;
  } catch (error) {
    core.warning(`Failed to fetch latest release tag: ${error instanceof Error ? error.message : String(error)}`);
    return undefined;
  }
}

async function createGithubDeployment(octokit: Octokit, environment: string): Promise<number | undefined> {
  try {
    const {owner, repo} = github.context.repo;
    const latestTag = await getLatestReleaseTag(octokit);
    const deployRef = latestTag ?? github.context.sha;

    if (latestTag) {
      core.info(`🏷️ Using latest release tag as deployment ref: ${latestTag}`);
    } else {
      core.info(`ℹ️ No release tag found; using commit SHA as deployment ref: ${github.context.sha}`);
    }

    const response = await octokit.rest.repos.createDeployment({
      auto_merge: false,
      environment,
      owner,
      ref: deployRef,
      repo,
      required_contexts: [],
    });

    if (response.status === 201) {
      core.info(`🚦 Created GitHub deployment (ID: ${response.data.id}).`);
      return response.data.id;
    }
  } catch (error) {
    core.warning(`Failed to create GitHub deployment: ${error instanceof Error ? error.message : String(error)}`);
  }

  return undefined;
}

async function setGithubDeploymentStatus(
  octokit: Octokit,
  deploymentId: number,
  state: GithubDeploymentState
): Promise<void> {
  try {
    const {owner, repo} = github.context.repo;

    await octokit.rest.repos.createDeploymentStatus({
      deployment_id: deploymentId,
      owner,
      repo,
      state,
    });

    core.info(`🚦 GitHub deployment status set to ${state}.`);
  } catch (error) {
    core.warning(`Failed to set GitHub deployment status: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function waitForDeployments(
  domain: string,
  token: string,
  deploymentUuids: string[],
  timeoutSeconds: number,
  intervalSeconds: number
): Promise<void> {
  core.info(
    `⏳ Waiting for ${deploymentUuids.length} deployment(${deploymentUuids.length > 1 ? 's' : ''}) to complete...`
  );
  core.info(`Deployment UUIDs: ${deploymentUuids.join(' ')}`);

  let elapsedSeconds = 0;

  while (elapsedSeconds < timeoutSeconds) {
    let completedCount = 0;
    let failedCount = 0;
    let inProgressCount = 0;

    for (const deploymentUuid of deploymentUuids) {
      const statusUrl = `https://${domain}/api/v1/deployments/${deploymentUuid}`;
      const {body, status} = await requestJson<DeploymentStatusResponse>(statusUrl, token);

      if (status !== 200) {
        inProgressCount += 1;
        core.warning(`⚠️ Failed to get status for deployment ${deploymentUuid} (HTTP ${status}).`);
        continue;
      }

      const deploymentStatus = body.status?.trim() ?? '';
      const deploymentIdentifier = body.application_name?.trim() || deploymentUuid;

      if (SUCCESS_STATUSES.has(deploymentStatus)) {
        completedCount += 1;
        core.info(`✅ Deployment ${deploymentIdentifier} (${deploymentUuid}) completed successfully.`);
      } else if (FAILURE_STATUSES.has(deploymentStatus)) {
        failedCount += 1;
        core.error(`❌ Deployment ${deploymentIdentifier} (${deploymentUuid}) failed with status: ${deploymentStatus}`);
      } else if (IN_PROGRESS_STATUSES.has(deploymentStatus) || deploymentStatus.length === 0) {
        inProgressCount += 1;
        core.info(`⏳ Deployment ${deploymentIdentifier} (${deploymentUuid}) is in progress.`);
      } else {
        inProgressCount += 1;
        core.warning(
          `⚠️ Deployment ${deploymentIdentifier} (${deploymentUuid}) has unknown status: ${deploymentStatus}`
        );
      }
    }

    core.info(
      `📊 Deployment progress: ${completedCount} completed, ${failedCount} failed, ${inProgressCount} in progress (${elapsedSeconds}s/${timeoutSeconds}s)`
    );

    if (failedCount > 0) {
      throw new Error(`${failedCount} deployment(${failedCount > 1 ? 's' : ''}) failed.`);
    }

    if (completedCount === deploymentUuids.length) {
      if (deploymentUuids.length > 1) {
        core.info(`✅ All ${deploymentUuids.length} deployments completed successfully.`);
      } else {
        core.info(`✅ Deployment completed successfully.`);
      }
      return;
    }

    await sleep(intervalSeconds * 1000);
    elapsedSeconds += intervalSeconds;
  }

  throw new Error(`Deployment timeout reached after ${timeoutSeconds}s.`);
}

export async function run(): Promise<void> {
  const token = core.getInput('token', {required: true});
  const uuid = core.getInput('uuid', {required: true}).trim();
  const domain = normalizeDomain(core.getInput('domain') || 'app.coolify.io');
  const force = parseBooleanInput('force', core.getInput('force') || 'false');
  const waitForDeploy = parseBooleanInput('waitForDeploy', core.getInput('waitForDeploy') || 'false');
  const timeoutSeconds = parsePositiveIntegerInput('timeout', core.getInput('timeout') || '300');
  const intervalSeconds = parsePositiveIntegerInput('interval', core.getInput('interval') || '10');
  const githubToken = core.getInput('GITHUB_TOKEN');
  const environment = core.getInput('environment') || 'production';

  if (!uuid) {
    core.setFailed('uuid input is required.');
    return;
  }

  if (!domain) {
    core.setFailed('domain input must not be empty.');
    return;
  }

  if (!isValidDomain(domain)) {
    core.setFailed(`domain input is invalid: '${domain}'.`);
    return;
  }

  let octokit: Octokit | undefined;
  let githubDeploymentId: number | undefined;

  if (githubToken) {
    octokit = github.getOctokit(githubToken);
    githubDeploymentId = await createGithubDeployment(octokit, environment);
    if (githubDeploymentId !== undefined) {
      await setGithubDeploymentStatus(octokit, githubDeploymentId, 'in_progress');
    }
  }

  try {
    core.info('🚀 Deploying to Coolify...');
    const deployUrl = buildDeployUrl(domain, force, uuid);
    core.info(`Making deployment request to: ${deployUrl}`);

    const {body, status} = await requestJson<DeployResponse>(deployUrl, token, 'POST');

    core.info(`Response status: ${status}`);

    if (status !== 200) {
      throw new Error(`Deployment request failed with HTTP status ${status}.`);
    }

    core.info('✅ Deployment request successful.');

    if (!waitForDeploy) {
      core.info('✅ Deployment request sent successfully (not waiting for completion).');
      if (octokit && githubDeploymentId !== undefined) {
        await setGithubDeploymentStatus(octokit, githubDeploymentId, 'success');
      }
      return;
    }

    const deploymentMessages = (body.deployments ?? []).map(deployment => deployment.message?.trim()).filter(Boolean);
    if (deploymentMessages.length > 0) {
      core.info('📋 Deployment messages:');
      for (const message of deploymentMessages) {
        core.info(`  • ${message}`);
      }
    }

    const deploymentUuids = getDeploymentIds(body);
    if (deploymentUuids.length === 0) {
      throw new Error('Could not extract deployment UUIDs from the deployment response.');
    }

    await waitForDeployments(domain, token, deploymentUuids, timeoutSeconds, intervalSeconds);

    if (octokit && githubDeploymentId !== undefined) {
      await setGithubDeploymentStatus(octokit, githubDeploymentId, 'success');
    }
  } catch (error) {
    if (octokit && githubDeploymentId !== undefined) {
      await setGithubDeploymentStatus(octokit, githubDeploymentId, 'failure');
    }
    throw error;
  }
}

if (require.main === module) {
  run().catch(error => {
    core.setFailed(error instanceof Error ? error.message : String(error));
  });
}
