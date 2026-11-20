import { chromium, expect } from '@playwright/test';

const baseUrl = process.env.STORYBOOK_URL || 'http://127.0.0.1:6106';
const browser = await chromium.launch({ channel: 'chrome' });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const insightsHookErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error' && message.text().includes('Expected static flag was missing')) {
      insightsHookErrors.push(message.text());
    }
  });
  await page.goto(`${baseUrl}/iframe.html?id=apps-rules-rulesapp--populated-workspace&viewMode=story`);
  await page.getByRole('button', { name: 'Add rule', exact: true }).click();
  await expect(page.getByText('Create rule', { exact: true })).toBeVisible();
  await page.goto(`${baseUrl}/iframe.html?id=apps-tracing-tracingapp--mcp-operations&viewMode=story`);
  await expect(page.getByText('Trace timeline', { exact: true })).toBeVisible();
  await expect(page.getByText('3 steps', { exact: true })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Tool call', exact: true })).toBeVisible();
  await expect(page.getByText('lookup_inventory').first()).toBeVisible();
  await expect(page.getByText('linen-shirt', { exact: true })).toBeVisible();
  await page.goto(`${baseUrl}/iframe.html?id=apps-tracing-tracingapp--large-trace&viewMode=story`);
  await expect(page.getByText('Trace timeline', { exact: true })).toBeVisible();
  await expect(page.getByText('75 steps', { exact: true })).toBeVisible();
  await page.goto(
    `${baseUrl}/iframe.html?id=apps-workspace-workspace--large-operations-with-trace&viewMode=story`
  );
  const workspaceOperations = page.locator('ul.overflow-y-auto.flex-grow').first();
  await expect(workspaceOperations.locator(':scope > li')).toHaveCount(101);
  await workspaceOperations.locator('li').filter({ hasText: '/v1/checkouts' }).first().click();
  const workspaceTraceLink = page.getByRole('link', { name: /View trace/ });
  await expect(workspaceTraceLink).toHaveAttribute(
    'href',
    '#traces/trace-checkout-batch-01/op-volume-001'
  );
  await workspaceTraceLink.click();
  await expect(page.getByText('Trace timeline', { exact: true })).toBeVisible();
  await expect(page.getByText('Trace trace-checkout-batch-01', { exact: true })).toBeVisible();
  await expect(page.getByText('1 step', { exact: true })).toBeVisible();
  await page.goto(`${baseUrl}/iframe.html?id=apps-inspectr-inspectrembeddedapp--fully-themed&viewMode=story`);
  await expect(page.getByRole('tab', { name: 'History', exact: true })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Settings', exact: true })).toBeVisible();
  const embeddedTheme = await page.locator('.inspectr-embedded-root').evaluate((root) => {
    const style = getComputedStyle(root);
    return {
      background: style.getPropertyValue('--inspectr-surface-background').trim(),
      muted: style.getPropertyValue('--inspectr-surface-muted').trim(),
      border: style.getPropertyValue('--inspectr-border-subtle').trim(),
      primaryText: style.getPropertyValue('--inspectr-text-primary').trim(),
      secondaryText: style.getPropertyValue('--inspectr-text-secondary').trim(),
      accent: style.getPropertyValue('--inspectr-accent-primary').trim(),
      accentContrast: style.getPropertyValue('--inspectr-accent-primary-contrast').trim()
    };
  });
  expect(embeddedTheme).toEqual({
    background: '#111827',
    muted: '#1f2937',
    border: '#374151',
    primaryText: '#f9fafb',
    secondaryText: '#cbd5e1',
    accent: '#7c3aed',
    accentContrast: '#ffffff'
  });
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
  const workspaceWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(workspaceWidth).toBeLessThanOrEqual(390);
  await expect(page.getByText('Disconnected', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reconnect' })).toBeVisible();

  await page.goto(`${baseUrl}/iframe.html?id=apps-workspace-workspace--empty&viewMode=story`);
  await expect(page.getByText('No operations', { exact: true })).toBeVisible();

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${baseUrl}/iframe.html?id=apps-workspace-workspace--default&viewMode=story`);
  await page.getByRole('button', { name: 'Insights', exact: true }).click();
  await expect(page.getByText('Insights Explorer', { exact: true })).toBeVisible();
  await expect(page.getByText('Total 1842', { exact: true })).toBeVisible();
  await expect(page.getByText('/v1/checkouts', { exact: true }).first()).toBeVisible();
  expect(insightsHookErrors).toHaveLength(0);
  await page.getByRole('button', { name: 'Statistics', exact: true }).click();
  await expect(page.getByText('Top Slowest Endpoints (P95)', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Usage', exact: true }).click();
  await expect(page.getByText('Usage Overview', { exact: true })).toBeVisible();
  await expect(
    page.getByText('Error loading metrics: client.service.getMetrics is not a function')
  ).toHaveCount(0);
  await expect(page.getByText('1842', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Rules', exact: true }).click();
  await expect(page.getByText('Escalate high-value card payments', { exact: true })).toBeVisible();
  await expect(page.getByText('Loading rules…', { exact: true })).toHaveCount(0);
  await expect(page.getByText(/env:\s*production/i)).toBeVisible();

  await page.goto(`${baseUrl}/iframe.html?id=apps-workspace-workspace--default&viewMode=story`);
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByRole('button', { name: 'Mock', exact: true }).click();
  await expect(page.getByText('https://api.acme.test/openapi.json', { exact: true })).toBeVisible();
  await expect(page.getByText('Loading mock info…', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'MCP Server', exact: true }).click();
  await expect(page.getByText('http://localhost:4005/mcp', { exact: true })).toBeVisible();
  await expect(page.getByText('MCP server settings are unavailable.', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Authentication Guard', exact: true }).click();
  await expect(page.getByText('Enabled', { exact: true })).toBeVisible();

  await page.goto(`${baseUrl}/iframe.html?id=apps-settings-authenticationguard--enabled&viewMode=story`);
  await expect(page.getByText('Enabled', { exact: true })).toBeVisible();
  await page.goto(`${baseUrl}/iframe.html?id=apps-settings-authenticationguard--disabled&viewMode=story`);
  await expect(page.getByText('Disabled', { exact: true })).toBeVisible();
  await page.goto(`${baseUrl}/iframe.html?id=apps-settings-authenticationguard--fetch-error&viewMode=story`);
  await expect(page.getByText('Authentication service unavailable', { exact: true })).toBeVisible();
  console.log(
    'Rules, tracing high volume and MCP, Workspace high volume and trace, embedded theme, request detail, Workspace Insights, usage, statistics, and settings checks passed'
  );
} finally {
  await browser.close();
}
