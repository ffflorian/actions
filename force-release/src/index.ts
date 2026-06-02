import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {prepareReleaseConfig} from './utils.js';

const SEMANTIC_RELEASE_VERSION = '24.2.9';
const SEMANTIC_RELEASE_CHANGELOG_VERSION = '6.0.3';
const SEMANTIC_RELEASE_GIT_VERSION = '10.0.1';
const SEMANTIC_RELEASE_COMMIT_ANALYZER_VERSION = '13.0.1';
const SEMANTIC_RELEASE_RELEASE_NOTES_GENERATOR_VERSION = '14.1.0';

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
    'corepack',
    [
      'yarn',
      'add',
      '--dev',
      '--exact',
      `semantic-release@${SEMANTIC_RELEASE_VERSION}`,
      `@semantic-release/changelog@${SEMANTIC_RELEASE_CHANGELOG_VERSION}`,
      `@semantic-release/git@${SEMANTIC_RELEASE_GIT_VERSION}`,
      `@semantic-release/commit-analyzer@${SEMANTIC_RELEASE_COMMIT_ANALYZER_VERSION}`,
      `@semantic-release/release-notes-generator@${SEMANTIC_RELEASE_RELEASE_NOTES_GENERATOR_VERSION}`,
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
    core.info('Running release command: npx --no semantic-release');

    await exec.exec('npx', ['--no', 'semantic-release'], {
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
