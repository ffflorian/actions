import * as core from '@actions/core';
import * as fs from 'fs';
import * as path from 'path';

interface GitHubRelease {
  tag_name: string;
  prerelease: boolean;
  published_at: string | null;
}

export function findYarnDirs(baseDir: string, maxDepth: number = 5): string[] {
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

export function parseVersion(v: string): number[] {
  return v.split('-')[0].split('.').map(Number);
}

export function compareVersions(a: string, b: string): number {
  const va = parseVersion(a);
  const vb = parseVersion(b);
  for (let i = 0; i < Math.max(va.length, vb.length); i++) {
    const diff = (va[i] ?? 0) - (vb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export async function fetchEligibleRelease(cooldownDays: number, token: string | undefined): Promise<string | null> {
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
