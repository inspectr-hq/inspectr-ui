import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const [baselineDir, candidateDir, diffDir] = process.argv.slice(2);
if (!baselineDir || !candidateDir || !diffDir) {
  throw new Error('Usage: node tests/visual/compare.mjs BASELINE CANDIDATE DIFFS');
}
await mkdir(diffDir, { recursive: true });
const names = (await readdir(baselineDir)).filter((name) => name.endsWith('.png')).sort();
if (!names.length) throw new Error('No baseline screenshots found');
let failures = 0;
for (const name of names) {
  const reference = PNG.sync.read(await readFile(path.join(baselineDir, name)));
  let actual;
  try {
    actual = PNG.sync.read(await readFile(path.join(candidateDir, name)));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    console.error(`${name}: missing candidate`);
    failures++;
    continue;
  }
  if (reference.width !== actual.width || reference.height !== actual.height) {
    console.error(`${name}: dimensions differ (${reference.width}x${reference.height} vs ${actual.width}x${actual.height})`);
    failures++;
    continue;
  }
  const diff = new PNG({ width: reference.width, height: reference.height });
  const pixels = pixelmatch(reference.data, actual.data, diff.data, reference.width, reference.height, { threshold: 0.1 });
  if (pixels / (reference.width * reference.height) > 0.001) {
    failures++;
    await writeFile(path.join(diffDir, name), PNG.sync.write(diff));
    console.error(`${name}: ${pixels} pixels differ`);
  }
}
console.log(`Compared ${names.length} screenshots; ${failures} exceeded the threshold or were missing`);
if (failures) process.exitCode = 1;
