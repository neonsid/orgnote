import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should have login button available", async ({ page }) => {
    const loginButton = page.getByRole("button", { name: /log in|sign in/i });
    await expect(loginButton).toBeVisible();
  });

  test("login dialog should open when clicking login", async ({ page }) => {
    const loginButton = page.getByRole("button", { name: /log in|sign in/i });
    await loginButton.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
  });

  test("should have sign up option", async ({ page }) => {
    const signUpButton = page.getByRole("button", { name: /sign up|get started/i });
    await expect(signUpButton).toBeVisible();
  });
});
