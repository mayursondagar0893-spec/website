const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  test: {
    environment: 'node',
    environmentMatchGlobs: [
      ['tests/wa-init.test.js', 'jsdom'],
      ['tests/dark-mode.test.js', 'jsdom'],
    ],
  },
});
