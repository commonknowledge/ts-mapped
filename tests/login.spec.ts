import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("login/logout", async ({ page }) => {
  await page.goto("/");

  await login(page)

  await expect(page.locator('nav select')).toContainText('Common Knowledge');

  const $logout = page.locator('#navbar-logout')
  await $logout.click()

  const $login = page.locator("#navbar-login");
  await expect($login).toBeVisible()
})
