import standards from '@craga89/standards/oxfmt' with { type: 'json' };

export default {
  ...standards,
  ignorePatterns: [...standards.ignorePatterns, 'site/**'],
};
