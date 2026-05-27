import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as path from 'node:path';
import {updateReleaseRules} from './utils.js';

function parseGitAuthorship(gitAuthorship: string): {name: string; email: string} {
  const match = /^(.+?)\s*<(.+?)>$/.exec(gitAuthorship);

  if (!match) {
    throw new Error(`Invalid git_authorship format: "${gitAuthorship}". Expected "Name <email>".`);
  }

  const [, name, email] = match;
  return {name, email};
}

export async function run(): Promise<void> {
  const commitMessage = core.getInput('commit_message') || 'chore: Force release';
  const gitAuthorship = core.getInput('git_authorship', {required: true});
  const workspace = process.env['GITHUB_WORKSPACE'] ?? process.cwd();
  const {name, email} = parseGitAuthorship(gitAuthorship);
  const {changed, path: configPath, source} = updateReleaseRules(workspace);
  const relativeConfigPath = path.relative(workspace, configPath) || path.basename(configPath);

  core.info(`Updated release rules in ${source}.`);
  if (!changed) {
    core.info('releaseRules already matched the required configuration; creating an empty release commit.');
  }

  await exec.exec('git', ['config', 'user.name', name], {cwd: workspace});
  await exec.exec('git', ['config', 'user.email', email], {cwd: workspace});
  await exec.exec('git', ['add', relativeConfigPath], {cwd: workspace});
  await exec.exec('git', ['commit', '--allow-empty', '-m', commitMessage], {cwd: workspace});
  await exec.exec('git', ['push', 'origin', 'HEAD'], {cwd: workspace});
}

if (require.main === module) {
  run().catch(error => {
    core.setFailed(error instanceof Error ? error.message : String(error));
  });
}
