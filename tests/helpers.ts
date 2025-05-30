import { Page, expect } from "@playwright/test";

export const login = async (
  page: Page,
  username = "joaquim@commonknowledge.coop",
  password = "1234"
) => {
  await page.fill('input[name="email"]', username);
  await page.fill('input[name="password"]', password);

  const $login = page.locator("#navbar-login");
  await $login.click();

  const $logout = page.locator('#navbar-logout')
  await expect($logout).toBeVisible();
};
