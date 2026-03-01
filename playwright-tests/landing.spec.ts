import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display the main heading", async ({ page }) => {
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test("should have a working navigation", async ({ page }) => {
    const nav = page.locator("nav");
    await expect(nav).toBeVisible({ timeout: 10000 });
  });

  test("should display the site title or logo", async ({ page }) => {
    const title = page.getByText(/Orgnote/i);
    await expect(title).toBeVisible({ timeout: 10000 });
  });

  test("page should have correct title", async ({ page }) => {
    await expect(page).toHaveTitle(/Orgnote/i);
  });

  test("should be responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible({ timeout: 10000 });
  });
});
