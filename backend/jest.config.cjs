module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  clearMocks: true,
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.test.json' }],
  },
};
