import * as core from '@actions/core';
import * as exec from '@actions/exec';
import {BRANCH_PREFIX, getCommandOutput, getLastUpdateDate, hasChanges} from '../utils';

jest.mock('@actions/core');
jest.mock('@actions/exec');

const mockExec = exec.exec as jest.MockedFunction<typeof exec.exec>;
const mockWarning = core.warning as jest.MockedFunction<typeof core.warning>;

describe('BRANCH_PREFIX', () => {
  it('should equal chore/deps/hugo-modules-', () => {
    expect(BRANCH_PREFIX).toBe('chore/deps/hugo-modules-');
  });
});

describe('getCommandOutput', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should capture and return trimmed stdout', async () => {
    mockExec.mockImplementation(async (_cmd, _args, options) => {
      options?.listeners?.stdout?.(Buffer.from('hello world\n'));
      return 0;
    });

    const result = await getCommandOutput('echo', ['hello world']);

    expect(result).toBe('hello world');
    expect(mockExec).toHaveBeenCalledWith(
      'echo',
      ['hello world'],
      expect.objectContaining({silent: true})
    );
  });

  it('should return empty string when command produces no output', async () => {
    mockExec.mockResolvedValue(0);

    const result = await getCommandOutput('cmd', []);

    expect(result).toBe('');
  });

  it('should concatenate multiple stdout chunks', async () => {
    mockExec.mockImplementation(async (_cmd, _args, options) => {
      options?.listeners?.stdout?.(Buffer.from('foo'));
      options?.listeners?.stdout?.(Buffer.from('bar'));
      return 0;
    });

    const result = await getCommandOutput('cmd', []);

    expect(result).toBe('foobar');
  });
});

describe('hasChanges', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return true when git status has output', async () => {
    mockExec.mockImplementation(async (_cmd, _args, options) => {
      options?.listeners?.stdout?.(Buffer.from('M  src/main.ts\n'));
      return 0;
    });

    expect(await hasChanges()).toBe(true);
  });

  it('should return false when git status is empty', async () => {
    mockExec.mockResolvedValue(0);

    expect(await hasChanges()).toBe(false);
  });
});

describe('getLastUpdateDate', () => {
  const mockOctokit = {
    rest: {
      pulls: {
        list: jest.fn(),
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return null when no matching PR is found', async () => {
    mockOctokit.rest.pulls.list.mockResolvedValue({
      data: [
        {head: {ref: 'feature/other-branch'}, created_at: '2024-01-01T00:00:00Z'},
        {head: {ref: 'fix/bug-fix'}, created_at: '2024-02-01T00:00:00Z'},
      ],
    });

    const result = await getLastUpdateDate(mockOctokit as never, 'owner', 'repo');

    expect(result).toBeNull();
  });

  it('should return the creation date of the first matching PR', async () => {
    const createdAt = '2024-06-15T10:00:00Z';
    mockOctokit.rest.pulls.list.mockResolvedValue({
      data: [{head: {ref: `${BRANCH_PREFIX}2024-06-15`}, created_at: createdAt}],
    });

    const result = await getLastUpdateDate(mockOctokit as never, 'owner', 'repo');

    expect(result).toEqual(new Date(createdAt));
  });

  it('should return null when the PR list is empty', async () => {
    mockOctokit.rest.pulls.list.mockResolvedValue({data: []});

    const result = await getLastUpdateDate(mockOctokit as never, 'owner', 'repo');

    expect(result).toBeNull();
  });

  it('should return null and emit a warning when the API call fails', async () => {
    mockOctokit.rest.pulls.list.mockRejectedValue(new Error('API error'));

    const result = await getLastUpdateDate(mockOctokit as never, 'owner', 'repo');

    expect(result).toBeNull();
    expect(mockWarning).toHaveBeenCalledWith(expect.stringContaining('Failed to check last update date'));
  });
});
