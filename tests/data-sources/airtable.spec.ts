import { expect, test } from "@playwright/test";
import { login } from "@/tests/helpers";

const credentials = {
  newTestDataSource: {
    baseId: "appkJI8gbKihsbBwa",
    tableId: "tblSy67uoOyoeUb50",
    apiKey: "pat1AxWhtg0np1phT.33579a289dc935b711dd8979a724dbb1cc0db61e2041ead230fbeeeedfdab3c4"
  }
}

test("add airtable source", async ({ page }) => {
  await page.goto("/");
  await login(page);

  const $dataSourcesLink = page.locator('nav [href="/data-sources"]');
  await $dataSourcesLink.click();
  await expect(page).toHaveURL(/\/data-sources$/);

  const $addNewLink = page.locator('[href="/data-sources/new"]');
  await $addNewLink.click();
  await expect(page).toHaveURL(/\/data-sources\/new$/);

  await page.fill('#data-source-name input', "New Test Airtable Source");
  await page.click("#data-source-type button")
  
  const $airtableOption = page.locator('[role="option"]', { hasText: "Airtable" })
  await $airtableOption.click()

  await page.fill('#airtable-base-id input', credentials.newTestDataSource.baseId)
  await page.fill('#airtable-table-id input', credentials.newTestDataSource.tableId)
  await page.fill('#airtable-api-key input', credentials.newTestDataSource.apiKey)

  const $submitButton = page.locator("#data-source-submit")
  expect($submitButton).toBeEnabled()
  await $submitButton.click()

  await expect(page).toHaveURL(/\/data-sources\/[a-f0-9-]{36}\/config$/);
});
