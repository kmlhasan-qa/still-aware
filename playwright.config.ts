import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',

  timeout: 180000,
  retries: 1,
  workers: 1,

  use: {
    baseURL: 'https://cms-stillaware.itmanage.com.au',

    headless: true,
    viewport: { width: 1440, height: 900 },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },

  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'playwright-report.json' }],
  ],

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});