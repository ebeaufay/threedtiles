// vitest.config.js
import { defineConfig } from 'vitest/config';
import path from 'path';
import viteConfig from './vite.config.js';

export default defineConfig({
  ...viteConfig,
  test: {
    globals: true, // Enables global test APIs like describe, it, expect
    //environment: 'jsdom', // Simulates a browser environment
    coverage: {
      provider: 'c8', // Coverage provider
      reporter: ['text', 'json', 'html'], // Coverage reports
    },
    setupFiles: './tests/setup.js', // Path to setup file
    include: ['tests/**/*.test.js'], // Pattern to find test files
  },
  silent: false,
});