import {describe, expect, it} from 'vitest';
import {
  buildDeployUrl,
  FAILURE_STATUSES,
  getDeploymentIds,
  IN_PROGRESS_STATUSES,
  isValidDomain,
  normalizeDomain,
  parseBooleanInput,
  parsePositiveIntegerInput,
  SUCCESS_STATUSES,
} from '../utils';

describe('normalizeDomain', () => {
  it('removes protocol and trailing slash', () => {
    expect(normalizeDomain('https://coolify.example.com/')).toBe('coolify.example.com');
  });
});

describe('domain validation', () => {
  it('validates supported domain formats', () => {
    expect(isValidDomain('coolify.example.com')).toBe(true);
    expect(isValidDomain('coolify.example.com:443')).toBe(true);
    expect(isValidDomain('coolify.example.com/path')).toBe(false);
  });
});

describe('parseBooleanInput', () => {
  it('parses true and false', () => {
    expect(parseBooleanInput('force', 'true')).toBe(true);
    expect(parseBooleanInput('force', 'false')).toBe(false);
  });

  it('throws on invalid values', () => {
    expect(() => parseBooleanInput('force', 'yes')).toThrow("force must be either 'true' or 'false'");
  });
});

describe('parsePositiveIntegerInput', () => {
  it('parses positive integers', () => {
    expect(parsePositiveIntegerInput('timeout', '300')).toBe(300);
  });

  it('throws on zero and invalid values', () => {
    expect(() => parsePositiveIntegerInput('timeout', '0')).toThrow('timeout must be a positive integer');
    expect(() => parsePositiveIntegerInput('timeout', '1.5')).toThrow('timeout must be a positive integer');
  });
});

describe('buildDeployUrl', () => {
  it('builds the deploy URL with query parameters', () => {
    expect(buildDeployUrl('coolify.example.com', true, 'uuid-1,uuid-2')).toBe(
      'https://coolify.example.com/api/v1/deploy?force=true&uuid=uuid-1%2Cuuid-2'
    );
  });
});

describe('getDeploymentIds', () => {
  it('returns only non-empty deployment UUIDs', () => {
    expect(
      getDeploymentIds({
        deployments: [{deployment_uuid: 'one'}, {deployment_uuid: '  '}, {}, {deployment_uuid: 'two'}],
      })
    ).toEqual(['one', 'two']);
  });
});

describe('status sets', () => {
  it('classifies deployment states', () => {
    expect(SUCCESS_STATUSES.has('successful')).toBe(true);
    expect(FAILURE_STATUSES.has('failed')).toBe(true);
    expect(IN_PROGRESS_STATUSES.has('running')).toBe(true);
  });
});
