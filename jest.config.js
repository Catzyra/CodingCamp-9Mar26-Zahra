export default {
  testEnvironment: 'jsdom',
  transform: {},
  moduleFileExtensions: ['js'],
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'scripts/**/*.js',
    '!scripts/main.js'
  ],
  coverageDirectory: 'coverage',
  verbose: true
};
