import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {prepareReleaseConfig} from './utils.js';

function parseGitAuthorship(gitAuthorship: string): {name: string; email: string} {
  const match = /^(.+?)\s*<(.+?)>$/.exec(gitAuthorship);

  if (!match) {
    throw new Error(`Invalid git_authorship format: "${gitAuthorship}". Expected "Name <email>".`);
  }

  const [, name, email] = match;
  return {name, email};
}

async function ensureSemanticReleaseDependencies(workspace: string): Promise<void> {
  core.info('Installing semantic-release dependencies with yarn.');
  await exec.exec(
    'bash',
    [
      '-lc',
      'corepack yarn add --dev --exact semantic-release @semantic-release/changelog @semantic-release/git @semantic-release/commit-analyzer @semantic-release/release-notes-generator',
    ],
    {
      cwd: workspace,
    }
  );

  core.info('Restoring package.json and lock files.');

  for (const file of ['yarn.lock', 'package.json', 'package-lock.json']) {
    const {exitCode, stderr} = await exec.getExecOutput('git', ['checkout', '--', file], {
      cwd: workspace,
      ignoreReturnCode: true,
      silent: true,
    });
    if (exitCode !== 0) {
      if (stderr.includes('did not match any file')) {
        const filePath = path.join(workspace, file);
        if (fs.existsSync(filePath)) {
          fs.rmSync(filePath);
          core.info(`Deleted ${file} (was not tracked before install).`);
        }
      } else {
        core.warning(`git checkout -- ${file} failed: ${stderr.trim()}`);
      }
    }
  }
}

function parseReleaseAssets(assetsInput: string): string[] {
  const assets = assetsInput
    .split(/[\n,]+/)
    .map(item => item.trim())
    .filter(Boolean);

  return assets.length > 0 ? assets : ['CHANGELOG.md'];
}

export async function run(): Promise<void> {
  const token = core.getInput('GITHUB_TOKEN', {required: true});
  const gitAuthorship = core.getInput('git_authorship', {required: true});
  const releaseAssets = parseReleaseAssets(core.getInput('assets'));
  const runCommand = core.getInput('run_command') || 'npx --no semantic-release';
  const workspace = process.env.GITHUB_WORKSPACE ?? process.cwd();
  const {name, email} = parseGitAuthorship(gitAuthorship);
  const releaseConfig = prepareReleaseConfig(workspace, releaseAssets);

  core.info(`Prepared release rules in ${releaseConfig.source}.`);
  if (!releaseConfig.changed) {
    core.info('releaseRules already matched the required configuration.');
  }

  try {
    await ensureSemanticReleaseDependencies(workspace);

    await exec.exec('git', ['config', 'user.name', name], {cwd: workspace});
    await exec.exec('git', ['config', 'user.email', email], {cwd: workspace});

    core.info(
      `This is the release config which will be applied before running semantic-release:\n${JSON.stringify(releaseConfig.appliedConfig, null, 2)}`
    );
    core.info(`Running release command: ${runCommand}`);

    await exec.exec('bash', ['-lc', runCommand], {
      cwd: workspace,
      env: {
        ...process.env,
        GITHUB_TOKEN: token,
        GIT_AUTHOR_NAME: name,
        GIT_AUTHOR_EMAIL: email,
        GIT_COMMITTER_NAME: name,
        GIT_COMMITTER_EMAIL: email,
      },
    });
  } finally {
    releaseConfig.restore();
  }
}

if (require.main === module) {
  run().catch(error => {
    core.setFailed(error instanceof Error ? error.message : String(error));
  });
}
