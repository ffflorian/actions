import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {compareVersions, fetchEligibleRelease, findYarnDirs, parseVersion} from './utils.js';

vi.mock('@actions/core', () => ({
  warning: vi.fn(),
}));

describe('parseVersion', () => {
  it('parses a simple semver string', () => {
    expect(parseVersion('1.2.3')).toEqual([1, 2, 3]);
  });

  it('parses a two-part version', () => {
    expect(parseVersion('4.0')).toEqual([4, 0]);
  });

  it('strips pre-release suffix before parsing', () => {
    expect(parseVersion('4.5.0-rc.1')).toEqual([4, 5, 0]);
  });
});

describe('compareVersions', () => {
  it('returns 0 for equal versions', () => {
    expect(compareVersions('1.2.3', '1.2.3')).toBe(0);
  });

  it('returns positive when a > b', () => {
    expect(compareVersions('2.0.0', '1.9.9')).toBeGreaterThan(0);
  });

  it('returns negative when a < b', () => {
    expect(compareVersions('1.0.0', '1.0.1')).toBeLessThan(0);
  });

  it('handles minor version differences', () => {
    expect(compareVersions('1.3.0', '1.2.9')).toBeGreaterThan(0);
  });

  it('handles versions with different lengths', () => {
    expect(compareVersions('1.0', '1.0.0')).toBe(0);
  });

  it('ignores pre-release suffixes when comparing', () => {
    expect(compareVersions('4.5.0-rc.1', '4.5.0')).toBe(0);
  });
});

describe('findYarnDirs', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yarn-update-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, {force: true, recursive: true});
  });

  it('returns an empty array when no .yarn directories exist', () => {
    fs.mkdirSync(path.join(tmpDir, 'src'));
    expect(findYarnDirs(tmpDir)).toEqual([]);
  });

  it('finds a .yarn directory at the top level', () => {
    const yarnDir = path.join(tmpDir, '.yarn');
    fs.mkdirSync(yarnDir);
    expect(findYarnDirs(tmpDir)).toEqual([yarnDir]);
  });

  it('finds .yarn directories in nested subdirectories', () => {
    const nested = path.join(tmpDir, 'packages', 'foo');
    fs.mkdirSync(nested, {recursive: true});
    const yarnDir = path.join(nested, '.yarn');
    fs.mkdirSync(yarnDir);
    expect(findYarnDirs(tmpDir)).toEqual([yarnDir]);
  });

  it('finds multiple .yarn directories', () => {
    const a = path.join(tmpDir, 'a', '.yarn');
    const b = path.join(tmpDir, 'b', '.yarn');
    fs.mkdirSync(a, {recursive: true});
    fs.mkdirSync(b, {recursive: true});
    expect(findYarnDirs(tmpDir).sort()).toEqual([a, b].sort());
  });

  it('skips node_modules directories', () => {
    const nodeModulesYarn = path.join(tmpDir, 'node_modules', '.yarn');
    fs.mkdirSync(nodeModulesYarn, {recursive: true});
    expect(findYarnDirs(tmpDir)).toEqual([]);
  });

  it('skips .git directories', () => {
    const gitYarn = path.join(tmpDir, '.git', '.yarn');
    fs.mkdirSync(gitYarn, {recursive: true});
    expect(findYarnDirs(tmpDir)).toEqual([]);
  });

  it('respects maxDepth limit', () => {
    const deep = path.join(tmpDir, 'a', 'b', 'c', 'd', 'e', 'f', '.yarn');
    fs.mkdirSync(deep, {recursive: true});
    expect(findYarnDirs(tmpDir, 5)).toEqual([]);
  });
});

describe('fetchEligibleRelease', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function makeRelease(tag: string, daysAgo: number, prerelease = false): object {
    const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    return {tag_name: tag, prerelease, published_at: date.toISOString()};
  }

  function stubFetch(releases: object[]): void {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ok: true, json: async () => releases}));
  }

  it('returns null when no releases match the tag prefix', async () => {
    stubFetch([makeRelease('v1.0.0', 10)]);
    await expect(fetchEligibleRelease(5, undefined)).resolves.toBeNull();
  });

  it('returns null when matching release is too recent', async () => {
    stubFetch([makeRelease('@yarnpkg/cli/4.5.0', 2)]);
    await expect(fetchEligibleRelease(5, undefined)).resolves.toBeNull();
  });

  it('returns the version when matching release is old enough', async () => {
    stubFetch([makeRelease('@yarnpkg/cli/4.5.0', 10)]);
    await expect(fetchEligibleRelease(5, undefined)).resolves.toBe('4.5.0');
  });

  it('skips prerelease versions', async () => {
    stubFetch([makeRelease('@yarnpkg/cli/4.5.0-rc.1', 10, true), makeRelease('@yarnpkg/cli/4.4.0', 10)]);
    await expect(fetchEligibleRelease(5, undefined)).resolves.toBe('4.4.0');
  });

  it('returns null when the API response is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ok: false, status: 403}));
    await expect(fetchEligibleRelease(5, undefined)).resolves.toBeNull();
  });

  it('returns null when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));
    await expect(fetchEligibleRelease(5, undefined)).resolves.toBeNull();
  });

  it('includes Authorization header when token is provided', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ok: true, json: async () => []});
    vi.stubGlobal('fetch', fetchMock);
    await fetchEligibleRelease(5, 'my-token');
    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((options.headers as Record<string, string>)['Authorization']).toBe('Bearer my-token');
  });
});
