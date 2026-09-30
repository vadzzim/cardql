import { describe, expect, it } from 'vitest';
import { profile } from './profile.js';
import { validateSeedProfile } from './profile.schema.js';

const job = {
  company: 'Acme',
  position: 'Engineer',
  startDate: '2020-01',
  endDate: '2021-06',
  achievements: ['Shipped things'],
};

describe('validateSeedProfile', () => {
  it('accepts the bundled seed profile', () => {
    expect(() => validateSeedProfile(profile)).not.toThrow();
  });

  it('trims text fields', () => {
    const result = validateSeedProfile({ ...profile, name: '  Jane  ' });

    expect(result.name).toBe('Jane');
  });

  it('allows optional fields to be omitted', () => {
    const { location: _location, email: _email, ...rest } = profile;

    expect(() => validateSeedProfile(rest)).not.toThrow();
  });

  it('converts months to the first day of the month', () => {
    const result = validateSeedProfile({
      ...profile,
      experience: [{ ...job, startDate: '2021-03', endDate: '2021-03' }],
    });

    expect(result.experience[0]).toMatchObject({
      startDate: new Date('2021-03-01T00:00:00Z'),
      endDate: new Date('2021-03-01T00:00:00Z'),
    });
  });

  it('allows endDate to be omitted for the current job', () => {
    const { endDate: _endDate, ...current } = job;

    const result = validateSeedProfile({ ...profile, experience: [current] });

    expect(result.experience[0].endDate).toBeUndefined();
  });

  it.each([
    ['a blank name', { name: '   ' }],
    ['an invalid email', { email: 'not-an-email' }],
    ['an unknown field', { id: '00000000-0000-0000-0000-000000000000' }],
    [
      'an unknown link field',
      { links: [{ label: 'Site', url: 'https://a.dev', position: 5 }] },
    ],
    [
      'a link without protocol',
      { links: [{ label: 'Site', url: 'site.dev' }] },
    ],
    [
      'a javascript: link',
      { links: [{ label: 'XSS', url: 'javascript:alert(1)' }] },
    ],
    [
      'a link with a blank label',
      { links: [{ label: '', url: 'https://a.dev' }] },
    ],
    [
      'duplicate link labels',
      {
        links: [
          { label: 'GitHub', url: 'https://github.com/a' },
          { label: 'GitHub', url: 'https://github.com/b' },
        ],
      },
    ],
    ['an unknown skill field', { skills: [{ name: 'Go', level: 5 }] }],
    ['a skill with a blank name', { skills: [{ name: '  ' }] }],
    [
      'duplicate skill names ignoring case',
      { skills: [{ name: 'TypeScript' }, { name: 'typescript' }] },
    ],
    [
      'an unknown project field',
      { projects: [{ name: 'A', url: 'https://a.dev', id: 'x' }] },
    ],
    [
      'a project with a blank name',
      { projects: [{ name: ' ', url: 'https://a.dev' }] },
    ],
    ['a project without a url', { projects: [{ name: 'A' }] }],
    [
      'a project with a non-http url',
      { projects: [{ name: 'A', url: 'ftp://a.dev' }] },
    ],
    [
      'duplicate project names',
      {
        projects: [
          { name: 'A', url: 'https://a.dev' },
          { name: 'A', url: 'https://b.dev' },
        ],
      },
    ],
    ['an unknown experience field', { experience: [{ ...job, id: 'x' }] }],
    ['a blank company', { experience: [{ ...job, company: ' ' }] }],
    ['a blank achievement', { experience: [{ ...job, achievements: [''] }] }],
    [
      'a full start date',
      { experience: [{ ...job, startDate: '2021-03-01' }] },
    ],
    ['month 13', { experience: [{ ...job, endDate: '2021-13' }] }],
    [
      'an end month before the start month',
      { experience: [{ ...job, startDate: '2021-03', endDate: '2021-02' }] },
    ],
  ])('rejects %s', (_case, override) => {
    expect(() => validateSeedProfile({ ...profile, ...override })).toThrow(
      /Invalid seed profile/,
    );
  });
});
