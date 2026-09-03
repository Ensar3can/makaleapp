import { expect, test } from '@playwright/test';

test('homepage renders the platform title', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Article Intelligence Platform' })).toBeVisible();
});
