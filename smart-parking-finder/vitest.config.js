const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  test: {
    include: ['**/*.test.js'],
    exclude: ['node_modules/**', 'e2e/**', '.next/**', 'out/**'],
  },
});
