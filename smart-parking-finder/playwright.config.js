const { defineConfig, devices } = require('@playwright/test');

const PORT = 3100;
const BACKEND_PORT = 8788;
const baseURL = `http://localhost:${PORT}`;

module.exports = defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: [
    {
      command: 'node backend/server.js',
      port: BACKEND_PORT,
      reuseExistingServer: !process.env.CI,
      env: {
        PORT: String(BACKEND_PORT),
        DATA_FILE: `${require('os').tmpdir()}/parkswift-e2e-db.json`,
        ADMIN_TOKEN: 'e2e-admin-token',
      },
    },
    {
      command: 'npx next dev -p ' + PORT,
      port: PORT,
      reuseExistingServer: !process.env.CI,
      timeout: 60 * 1000,
      env: {
        NEXT_PUBLIC_API_BASE: `http://localhost:${BACKEND_PORT}`,
      },
    },
  ],
});
