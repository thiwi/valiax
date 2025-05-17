module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/tests/__mocks__/fileMock.js',
    '^src/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setupTests.js'],
  testMatch: [
  '**/tests/**/*.test.js',
  '**/tests/**/*.test.jsx',
  '**/tests/**/*.test.ts',
  '**/tests/**/*.test.tsx'
  ],
  collectCoverageFrom: [
    'backend/**/*.{js,py}',
    'frontend/src/**/*.{js,jsx,ts,tsx}',
    '!frontend/src/index.tsx',
    '!frontend/src/setupProxy.js',
    '!**/node_modules/**'
  ],
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  transformIgnorePatterns: [
    '/node_modules/(?!.*\\.mjs$)'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
}
