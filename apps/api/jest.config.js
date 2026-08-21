/** @type {import('jest').Config} */
module.exports = {
  rootDir: 'src',
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'json', 'ts'],
  // The schema tests talk to the compose Postgres, so they need DATABASE_URL from apps/api/.env.
  setupFiles: ['dotenv/config'],
  testRegex: '.*\\.spec\\.ts$',
  // Only .ts — workspace deps ship prebuilt CommonJS that Jest can require as-is.
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/../tsconfig.json' }],
  },
  collectCoverageFrom: ['**/*.ts', '!**/*.spec.ts'],
  coverageDirectory: '<rootDir>/../coverage',
};
