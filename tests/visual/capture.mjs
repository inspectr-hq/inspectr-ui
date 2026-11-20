import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const output = process.argv[2];
if (!output) throw new Error('Provide an output directory');
const baseUrl = process.env.STORYBOOK_URL || 'http://127.0.0.1:6106';
const viewport = {
  width: Number(process.env.VIEWPORT_WIDTH || 1440),
  height: Number(process.env.VIEWPORT_HEIGHT || 900)
};
if (!Number.isInteger(viewport.width) || !Number.isInteger(viewport.height) || viewport.width < 1 || viewport.height < 1) {
  throw new Error('Viewport dimensions must be positive integers');
}
const index = JSON.parse(await readFile('storybook-static/index.json', 'utf8'));
const ids = Object.values(index.entries)
  .filter((entry) => entry.type === 'story' && (!process.env.STORY_FILTER || new RegExp(process.env.STORY_FILTER).test(entry.id)))
  .map((entry) => entry.id);
const browser = await chromium.launch({ channel: 'chrome', headless: true });
await mkdir(output, { recursive: true });
const errors = [];
for (const theme of process.env.THEME ? [process.env.THEME] : ['light', 'dark']) {
  const context = await browser.newContext({ viewport, colorScheme: theme, reducedMotion: 'reduce', timezoneId: 'UTC' });
  const page = await context.newPage();
  await page.clock.setFixedTime(new Date('2026-01-15T12:00:00Z'));
  for (const id of ids) {
    await page.goto(`${baseUrl}/iframe.html?id=${id}&viewMode=story`, { waitUntil: 'networkidle', timeout: 20000 }).catch((error) => errors.push(`${id}: ${error.message}`));
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);
    const error = (await page.locator('#storybook-error-message').allTextContents()).join('');
    if (error) errors.push(`${id}: ${error}`);
    await page.screenshot({ path: path.join(output, `${id}-${theme}.png`), animations: 'disabled', fullPage: true });
    console.log(`${theme} ${id}`);
  }
  await context.close();
}
await browser.close();
await writeFile(path.join(output, `errors-${process.env.THEME || 'all'}.json`), JSON.stringify(errors, null, 2));
console.log(`${ids.length} stories, ${errors.length} errors`);
if (errors.length) process.exitCode = 1;
