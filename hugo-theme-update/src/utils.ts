import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as github from '@actions/github';

export const BRANCH_PREFIX = 'chore/deps/hugo-modules-';

export async function getLastUpdateDate(
  octokit: ReturnType<typeof github.getOctokit>,
  owner: string,
  repo: string
): Promise<Date | null> {
  try {
    const {data: prs} = await octokit.rest.pulls.list({
      owner,
      repo,
      state: 'all',
      per_page: 20,
      sort: 'created',
      direction: 'desc',
    });

    const hugoPR = prs.find((pr: {head: {ref: string}}) => pr.head.ref.startsWith(BRANCH_PREFIX));
    if (hugoPR) {
      return new Date(hugoPR.created_at);
    }
  } catch (error) {
    core.warning(`Failed to check last update date: ${error}`);
  }
  return null;
}

export async function getCommandOutput(cmd: string, args: string[]): Promise<string> {
  let output = '';
  await exec.exec(cmd, args, {
    listeners: {
      stdout: (data: Buffer) => {
        output += data.toString();
      },
    },
    silent: true,
  });
  return output.trim();
}

export async function hasChanges(): Promise<boolean> {
  const output = await getCommandOutput('git', ['status', '--porcelain']);
  return output.length > 0;
}
