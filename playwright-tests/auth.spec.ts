import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should have login button available", async ({ page }) => {
    const loginButton = page.getByRole("button", { name: "Login" });
    await expect(loginButton).toBeVisible({ timeout: 10000 });
  });

  test("login dialog should open when clicking login", async ({ page }) => {
    const loginButton = page.getByRole("button", { name: "Login" });
    await loginButton.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10000 });
  });

  test("should have sign up option", async ({ page }) => {
    const signUpButton = page.getByRole("button", { name: "Sign up" });
    await expect(signUpButton).toBeVisible({ timeout: 10000 });
  });
});
