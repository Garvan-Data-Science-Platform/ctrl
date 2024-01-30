import { expect, test } from '@playwright/test';

test('GET /workspaces', async ({ page }) => {
  await page.goto('./workspaces');

  await expect(page).toHaveScreenshot();
});

