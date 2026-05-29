import * as core from '@actions/core';
import * as exec from '@actions/exec';
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
}

export async function run(): Promise<void> {
  const token = core.getInput('GITHUB_TOKEN', {required: true});
  const gitAuthorship = core.getInput('git_authorship', {required: true});
  const runCommand = core.getInput('run_command') || 'npx --no semantic-release';
  const workspace = process.env.GITHUB_WORKSPACE ?? process.cwd();
  const {name, email} = parseGitAuthorship(gitAuthorship);
  const releaseConfig = prepareReleaseConfig(workspace);

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
