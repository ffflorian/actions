import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as github from '@actions/github';
import * as path from 'path';
import {compareVersions, fetchEligibleRelease, findYarnDirs} from './utils.js';

async function getOutput(cmd: string, args: string[], cwd: string): Promise<string> {
  let output = '';
  await exec.exec(cmd, args, {
    cwd,
    listeners: {
      stdout: (data: Buffer) => {
        output += data.toString();
      },
    },
    silent: true,
  });
  return output.trim();
}

async function createPullRequest(gitAuthorship: string, targetVersion: string, token: string): Promise<void> {
  const authorMatch = /^(.+?)\s*<(.+?)>$/.exec(gitAuthorship);
  if (!authorMatch) {
    throw new Error(`Invalid git_authorship format: "${gitAuthorship}". Expected "Name <email>".`);
  }
  const [, authorName, authorEmail] = authorMatch;

  await exec.exec('git', ['config', 'user.name', authorName]);
  await exec.exec('git', ['config', 'user.email', authorEmail]);

  const branchName = `chore/deps/yarn-${targetVersion}`;
  const commitMsg = `chore(deps): bump yarn to version ${targetVersion}`;

  await exec.exec('git', ['checkout', '-b', branchName]);
  await exec.exec('git', ['add', '-A']);
  await exec.exec('git', ['commit', '-m', commitMsg]);

  const remoteUrl = await getOutput('git', ['remote', 'get-url', 'origin'], process.cwd());
  const authedUrl = remoteUrl.replace('https://', `https://x-access-token:${token}@`);
  await exec.exec('git', ['push', authedUrl, branchName]);

  const {owner, repo} = github.context.repo;
  const octokit = github.getOctokit(token);

  const encodedVersion = encodeURIComponent(`@yarnpkg/cli/${targetVersion}`);
  const body =
    `This PR updates all yarn installations in this repository to version **${targetVersion}**.\n\n` +
    `See the [release notes](https://github.com/yarnpkg/berry/releases/tag/${encodedVersion}) for more details.`;

  await octokit.rest.pulls.create({
    owner,
    repo,
    title: commitMsg,
    body,
    head: branchName,
    base: 'main',
  });

  core.info(`Pull request created: ${branchName}`);
}

async function run(): Promise<void> {
  const gitAuthorship = core.getInput('git_authorship', {required: true});
  const cooldownInput = core.getInput('release_cooldown_days') || '0';
  const cooldownDays = parseInt(cooldownInput, 10);

  if (!/^\d+$/.test(cooldownInput.trim())) {
    core.setFailed(`release_cooldown_days must be a non-negative integer, got: '${cooldownInput}'.`);
    return;
  }

  const token = process.env['GITHUB_TOKEN'];
  const workspace = process.env['GITHUB_WORKSPACE'] ?? process.cwd();

  const yarnDirs = findYarnDirs(workspace);

  if (yarnDirs.length === 0) {
    core.info('No .yarn directories found.');
    return;
  }

  let updated = false;
  let targetVersion = '';

  let eligibleVersion: string | null = null;
  if (cooldownDays > 0) {
    eligibleVersion = await fetchEligibleRelease(cooldownDays, token);
    if (!eligibleVersion) {
      core.info(`No yarn release is older than ${cooldownDays} days. Skipping update.`);
      return;
    }
    core.info(`Targeting yarn ${eligibleVersion} (latest release at least ${cooldownDays} day(s) old).`);
  }

  for (const yarnDir of yarnDirs) {
    const projectDir = path.dirname(yarnDir);
    core.info(`Checking yarn in ${projectDir} ...`);

    const oldVersion = await getOutput('yarn', ['--version'], projectDir);

    if (eligibleVersion !== null) {
      if (compareVersions(oldVersion, eligibleVersion) >= 0) {
        core.info(
          `yarn ${oldVersion} in ${projectDir} is already at or newer than candidate ${eligibleVersion}. Skipping.`
        );
        continue;
      }
      await exec.exec('yarn', ['set', 'version', eligibleVersion], {cwd: projectDir});
    } else {
      await exec.exec('yarn', ['set', 'version', 'stable'], {cwd: projectDir});
    }

    const newVersion = await getOutput('yarn', ['--version'], projectDir);

    if (oldVersion === newVersion) {
      core.info(`yarn is already up to date in ${projectDir}.`);
    } else {
      core.info(`yarn updated from ${oldVersion} to ${newVersion} in ${projectDir}.`);
      core.info(`Running yarn install to update lockfile in ${projectDir} ...`);
      await exec.exec('yarn', ['install', '--mode=update-lockfile'], {cwd: projectDir});
      updated = true;

      if (!targetVersion) {
        targetVersion = newVersion;
      } else if (targetVersion !== newVersion) {
        core.setFailed(
          `Expected all yarn installations to update to the same stable version, but got ${targetVersion} and ${newVersion}.`
        );
        return;
      }
    }
  }

  if (updated) {
    core.setOutput('YARN_VERSION', targetVersion);
    if (token) {
      await createPullRequest(gitAuthorship, targetVersion, token);
    } else {
      core.warning('GITHUB_TOKEN not set; skipping pull request creation.');
    }
  }
}

run().catch(err => {
  core.setFailed(String(err));
});
