import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for E2E testing
 * Uses system browsers instead of downloading
 * Dev: Chrome and Firefox only
 * CI: All browsers including WebKit and mobile
 * @see https://playwright.dev/docs/test-configuration
 */

// Dev projects: Chrome and Firefox only
const devProjects = [
  {
    name: "chromium",
    use: {
      ...devices["Desktop Chrome"],
      launchOptions: {
        executablePath: "/usr/bin/chromium",
      },
    },
  },
  {
    name: "firefox",
    use: {
      ...devices["Desktop Firefox"],
      launchOptions: {
        executablePath: "/usr/bin/firefox",
      },
    },
  },
];

// CI projects: All browsers including WebKit and mobile
const ciProjects = [
  ...devProjects,
  {
    name: "webkit",
    use: {
      ...devices["Desktop Safari"],
      launchOptions: {
        executablePath: "/usr/bin/epiphany",
      },
    },
  },
  {
    name: "Mobile Chrome",
    use: {
      ...devices["Pixel 5"],
      launchOptions: {
        executablePath: "/usr/bin/chromium",
      },
    },
  },
  {
    name: "Mobile Safari",
    use: {
      ...devices["iPhone 12"],
      launchOptions: {
        executablePath: "/usr/bin/epiphany",
      },
    },
  },
];

export default defineConfig({
  testDir: "./playwright-tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  timeout: 30000,
  expect: {
    timeout: 10000,
  },
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    actionTimeout: 15000,
  },
  projects: process.env.CI ? ciProjects : devProjects,
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
