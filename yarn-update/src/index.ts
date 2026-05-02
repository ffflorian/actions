import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as github from '@actions/github';
import * as fs from 'fs';
import * as path from 'path';

interface GitHubRelease {
  tag_name: string;
  prerelease: boolean;
  published_at: string | null;
}

function findYarnDirs(baseDir: string, maxDepth: number = 5): string[] {
  const results: string[] = [];

  function scan(dir: string, depth: number): void {
    if (depth > maxDepth) return;

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, {withFileTypes: true});
    } catch {
      return;
    }

    for (const entry of entries) {
      if (entry.name === '.git' || entry.name === 'node_modules') continue;
      if (entry.isDirectory()) {
        const fullPath = path.join(dir, entry.name);
        if (entry.name === '.yarn') {
          results.push(fullPath);
        } else {
          scan(fullPath, depth + 1);
        }
      }
    }
  }

  scan(baseDir, 1);
  return results;
}

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

function parseVersion(v: string): number[] {
  return v.split('-')[0].split('.').map(Number);
}

function compareVersions(a: string, b: string): number {
  const va = parseVersion(a);
  const vb = parseVersion(b);
  for (let i = 0; i < Math.max(va.length, vb.length); i++) {
    const diff = (va[i] ?? 0) - (vb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

async function fetchEligibleRelease(cooldownDays: number, token: string | undefined): Promise<string | null> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let releases: GitHubRelease[] = [];
  try {
    const response = await fetch('https://api.github.com/repos/yarnpkg/berry/releases?per_page=100', {headers});
    if (!response.ok) {
      core.warning(`GitHub API returned ${response.status}; skipping cooldown check.`);
      return null;
    }
    releases = (await response.json()) as GitHubRelease[];
  } catch (err) {
    core.warning(`Failed to fetch yarn releases: ${String(err)}`);
    return null;
  }

  const cutoff = new Date(Date.now() - cooldownDays * 24 * 60 * 60 * 1000);

  for (const release of releases) {
    if (!release.tag_name.startsWith('@yarnpkg/cli/')) continue;
    if (release.prerelease) continue;
    if (!release.published_at) continue;
    if (new Date(release.published_at) <= cutoff) {
      return release.tag_name.slice('@yarnpkg/cli/'.length);
    }
  }
  return null;
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
