/** @type {import('jest').Config} */
module.exports = {
  testMatch: ['<rootDir>/specs/**/*.spec.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.json',
      useESM: false,
      diagnostics: { warnOnly: true },
    }],
  },
  // Sequential: backend rate-limits at 300 req/min per user
  maxWorkers: 1,
  testTimeout: 60000,
  // Resolve JSON files (seed manifest)
  moduleFileExtensions: ['ts', 'js', 'json'],
  // Extra delay between test suites — same rationale as Playwright's 1-second preamble
  testSequencer: require.resolve('./sequencer.cjs'),
};
