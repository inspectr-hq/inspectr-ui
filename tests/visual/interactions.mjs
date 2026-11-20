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
  console.log('Rules creation and request detail interactions passed');
} finally {
  await browser.close();
}
