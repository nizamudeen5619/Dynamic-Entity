import { test, expect } from '@playwright/test';

test.describe('Dynamic Entity RBAC E2E', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log(`[BROWSER] ${msg.text()}`));
    await page.goto('/');
  });

  test('Admin should see real salary and be able to edit', async ({ page }) => {
    // Select Admin role
    await page.click('button:has-text("Admin")');
    
    // Wait for table to load and show data (seed has 20 clients)
    // We wait for the loading indicator to disappear first
    await expect(page.locator('text=Loading…')).not.toBeVisible({ timeout: 15000 });
    await expect(page.locator('tr.ngx-table__row')).toHaveCount(20, { timeout: 10000 });
    
    // Check table for real salary (index 4)
    const salaryCell = page.locator('tr.ngx-table__row').first().locator('td').nth(4);
    await expect(salaryCell).not.toHaveText('XXXXXXXXX');
    
    // Click row to open form
    await page.locator('tr.ngx-table__row').first().click();
    
    // Check form field
    const salaryInput = page.locator('input[id="salary"]');
    await expect(salaryInput).toBeVisible();
    await expect(salaryInput).not.toHaveValue('XXXXXXXXX');
    
    // Edit field
    await salaryInput.fill('60000');
    await page.click('button:has-text("Submit")');
    
    // Verify update in table
    await expect(salaryCell).toHaveText('60000');
  });

  test('IT Support should see masked salary', async ({ page }) => {
    // Select IT Support role
    await page.click('button:has-text("IT Support")');
    
    // Wait for table
    await expect(page.locator('text=Loading…')).not.toBeVisible({ timeout: 15000 });
    await expect(page.locator('tr.ngx-table__row')).toHaveCount(20, { timeout: 10000 });
    
    // Check table for masked salary
    const salaryCell = page.locator('tr.ngx-table__row').first().locator('td').nth(4);
    await expect(salaryCell).toHaveText('XXXXXXXXX');
    
    // Click row to open form
    await page.locator('tr.ngx-table__row').first().click();
    
    // Check form field - should be masked and readonly
    const salaryInput = page.locator('input[id="salary"]');
    await expect(salaryInput).toHaveValue('XXXXXXXXX');
    await expect(salaryInput).toBeDisabled();
  });

  test('Viewer should be readonly', async ({ page }) => {
    // Select Viewer role
    await page.click('button:has-text("Viewer")');
    
    // Wait for table
    await expect(page.locator('text=Loading…')).not.toBeVisible({ timeout: 15000 });
    await expect(page.locator('tr.ngx-table__row')).toHaveCount(20, { timeout: 10000 });
    
    // Click row
    await page.locator('tr.ngx-table__row').first().click();
    
    // Submit button should not be present or should be disabled
    const submitBtn = page.locator('button:has-text("Submit")');
    await expect(submitBtn).not.toBeVisible();
  });
});
