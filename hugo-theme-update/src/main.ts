import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as github from '@actions/github';
import {BRANCH_PREFIX, getLastUpdateDate, hasChanges} from './utils';

export async function run(): Promise<void> {
  const gitAuthorship = core.getInput('git_authorship', {required: true});
  const githubToken = core.getInput('github_token', {required: true});
  const cooldownDaysStr = core.getInput('cooldown_days');
  const cooldownDays = parseInt(cooldownDaysStr || '0', 10);

  if (isNaN(cooldownDays) || cooldownDays < 0) {
    core.setFailed(`cooldown_days must be a non-negative integer, got: '${cooldownDaysStr}'`);
    return;
  }

  const octokit = github.getOctokit(githubToken);
  const {owner, repo} = github.context.repo;

  // Cooldown check: skip if last update PR was created within cooldown_days
  if (cooldownDays > 0) {
    const lastUpdateDate = await getLastUpdateDate(octokit, owner, repo);
    if (lastUpdateDate !== null) {
      const daysSince = (Date.now() - lastUpdateDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < cooldownDays) {
        core.info(
          `Last Hugo module update PR was created ${daysSince.toFixed(1)} days ago. ` +
            `Cooldown is ${cooldownDays} days. Skipping.`
        );
        return;
      }
    }
  }

  // Run Hugo module update
  core.info('Running hugo mod get -u ./...');
  await exec.exec('hugo', ['mod', 'get', '-u', './...']);

  core.info('Running hugo mod tidy');
  await exec.exec('hugo', ['mod', 'tidy']);

  // Check for changes
  if (!(await hasChanges())) {
    core.info('No changes detected after Hugo module update. Nothing to do.');
    return;
  }

  // Parse git authorship
  const authorMatch = gitAuthorship.match(/^(.+?)\s*<(.+?)>$/);
  if (!authorMatch) {
    core.setFailed('git_authorship must be in format "Name <email>"');
    return;
  }
  const [, authorName, authorEmail] = authorMatch;

  // Configure git
  await exec.exec('git', ['config', 'user.name', authorName]);
  await exec.exec('git', ['config', 'user.email', authorEmail]);

  // Create branch
  const dateSuffix = new Date().toISOString().slice(0, 10);
  const branchName = `${BRANCH_PREFIX}${dateSuffix}`;
  await exec.exec('git', ['checkout', '-b', branchName]);

  // Commit all changes
  await exec.exec('git', ['add', '--all']);
  await exec.exec('git', ['commit', '-m', 'chore(deps): update Hugo modules']);

  // Push branch
  await exec.exec('git', ['push', 'origin', branchName]);

  // Create PR
  const {data: pr} = await octokit.rest.pulls.create({
    owner,
    repo,
    title: 'chore(deps): update Hugo modules',
    head: branchName,
    base: 'main',
    body: [
      'This PR updates all Hugo modules to their latest versions.',
      '',
      'Changes were made by running:',
      '```',
      'hugo mod get -u ./...',
      'hugo mod tidy',
      '```',
    ].join('\n'),
  });

  core.info(`Created PR #${pr.number}: ${pr.html_url}`);
  core.setOutput('pr_number', String(pr.number));
  core.setOutput('pr_url', pr.html_url);
}

if (require.main === module) {
  run().catch(error => {
    core.setFailed(error instanceof Error ? error.message : String(error));
  });
}
