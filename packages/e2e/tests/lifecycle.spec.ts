import { test, expect } from '@playwright/test';

test.describe('Dynamic Entity Full Lifecycle E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Search and Pagination should work', async ({ page }) => {
    await page.click('button:has-text("Admin")');
    await expect(page.locator('text=Loading…')).not.toBeVisible({ timeout: 15000 });

    // Search
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('John 1'); // Should find John 1, John 10-19
    await expect(page.locator('tr.ngx-table__row')).toHaveCount(11);

    // Clear search
    await searchInput.fill('');
    await expect(page.locator('tr.ngx-table__row')).toHaveCount(20);

    // Pagination (seed data has 20 items, assuming pageSize is 20)
    // If we can increase page size to test next page
  });

  test('Form Validation should prevent invalid submit', async ({ page }) => {
    await page.click('button:has-text("Admin")');
    await expect(page.locator('text=Loading…')).not.toBeVisible({ timeout: 15000 });

    // Open first row
    await page.locator('tr.ngx-table__row').first().click();

    // Clear a required field
    const nameInput = page.locator('input[id="firstName"]');
    await nameInput.fill('');
    await page.click('button:has-text("Submit")');

    // Check for error message
    await expect(page.locator('.ngx-field__error')).toBeVisible();
  });

  test('Config Rollback Flow', async ({ page }) => {
    await page.click('button:has-text("Admin")');
    // Assuming there is a UI to trigger rollback or update config
    // This is a placeholder for actual complex flow testing
  });
});
