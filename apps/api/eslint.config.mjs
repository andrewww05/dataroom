import globals from 'globals';

import { base } from '../../eslint.config.mjs';

export default [
  ...base,
  {
    files: ['**/*.{ts,js,mjs}'],
    languageOptions: {
      globals: { ...globals.node, ...globals.jest },
    },
    rules: {
      // Nest resolves providers from decorator metadata, so empty interfaces
      // and parameter properties are idiomatic here.
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
];
