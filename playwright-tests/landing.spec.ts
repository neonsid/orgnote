import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display the main heading", async ({ page }) => {
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible();
  });

  test("should have a working navigation", async ({ page }) => {
    const nav = page.getByRole("navigation");
    await expect(nav).toBeVisible();
  });

  test("should display the site title or logo", async ({ page }) => {
    const title = page.getByText(/goldfish/i);
    await expect(title).toBeVisible();
  });

  test("page should have correct title", async ({ page }) => {
    await expect(page).toHaveTitle(/goldfish/i);
  });

  test("should be responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible();
  });
});
