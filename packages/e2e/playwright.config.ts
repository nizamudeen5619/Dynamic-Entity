import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://127.0.0.1:4200',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    }
  ],
  // Run local servers before starting tests
  webServer: [
    {
      command: 'npm run dev -w demo-node',
      url: 'http://127.0.0.1:3001/api/entities/config/clients',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
      env: {
        USE_MEMORY_DB: 'true'
      }
    },
    {
      command: 'npm run dev -w demo-angular',
      url: 'http://127.0.0.1:4200',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    }
  ],
});
