import { profile } from './profile.js';
import { validateSeedProfile } from './profile.schema.js';

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
  ])('rejects %s', (_case, override) => {
    expect(() => validateSeedProfile({ ...profile, ...override })).toThrow(
      /Invalid seed profile/,
    );
  });
});
