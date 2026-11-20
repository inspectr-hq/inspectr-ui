import { chromium, expect } from '@playwright/test';

const baseUrl = process.env.STORYBOOK_URL || 'http://127.0.0.1:6106';
const browser = await chromium.launch({ channel: 'chrome' });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${baseUrl}/iframe.html?id=apps-rules-rulesapp--populated-workspace&viewMode=story`);
  await page.getByRole('button', { name: 'Add rule', exact: true }).click();
  await expect(page.getByText('Create rule', { exact: true })).toBeVisible();
  await page.goto(`${baseUrl}/iframe.html?id=components-operations-requestdetailspanel--default-panel&viewMode=story`);
  await page.getByRole('button', { name: 'Query Parameters (1)' }).click();
  await expect(page.getByText('search', { exact: true })).toBeVisible();
  await page.goto(`${baseUrl}/iframe.html?id=components-mcp-toolcard--tools-list-with-output-schema&viewMode=story`);
  const badgePixel = await page.getByText('Read-only', { exact: true }).first().evaluate((label) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, 1, 1);
    ctx.fillStyle = getComputedStyle(label.parentElement).backgroundColor;
    ctx.fillRect(0, 0, 1, 1);
    return Array.from(ctx.getImageData(0, 0, 1, 1).data);
  });
  expect(badgePixel).toEqual([235, 242, 254, 255]);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/iframe.html?id=apps-workspace-workspace--default&viewMode=story`);
  await expect(page.getByRole('button', { name: 'Insights' })).toBeVisible();
  const workspaceText = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
  expect(workspaceText).toContain('201 POST /v1/checkouts');
  const workspaceWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(workspaceWidth).toBeLessThanOrEqual(390);
  await expect(page.getByText('Disconnected', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reconnect' })).toBeVisible();

  await page.goto(`${baseUrl}/iframe.html?id=apps-workspace-workspace--empty&viewMode=story`);
  await expect(page.getByText('No operations', { exact: true })).toBeVisible();

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${baseUrl}/iframe.html?id=apps-workspace-workspace--default&viewMode=story`);
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByRole('button', { name: 'Authentication Guard', exact: true }).click();
  await expect(page.getByText('Enabled', { exact: true })).toBeVisible();

  await page.goto(`${baseUrl}/iframe.html?id=apps-settings-authenticationguard--enabled&viewMode=story`);
  await expect(page.getByText('Enabled', { exact: true })).toBeVisible();
  await page.goto(`${baseUrl}/iframe.html?id=apps-settings-authenticationguard--disabled&viewMode=story`);
  await expect(page.getByText('Disabled', { exact: true })).toBeVisible();
  await page.goto(`${baseUrl}/iframe.html?id=apps-settings-authenticationguard--fetch-error&viewMode=story`);
  await expect(page.getByText('Authentication service unavailable', { exact: true })).toBeVisible();
  console.log('Rules, request detail, workspace, and authentication settings checks passed');
} finally {
  await browser.close();
}
