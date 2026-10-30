import standards from './node_modules/.pnpm-config/@craga89/standards/configs/oxfmt/base.json' with { type: 'json' };

export default {
  ...standards,
  ignorePatterns: [...standards.ignorePatterns, 'site/**'],
};
