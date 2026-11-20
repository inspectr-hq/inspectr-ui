# Visual regression checks

These scripts capture Storybook stories in Chrome and compare them with an earlier capture. By default they capture full-page screenshots at desktop (1440 by 900) and mobile (390 by 844) widths in light and dark color schemes, fix the browser clock and timezone, and disable animations. Google Chrome must be installed.

1. On the original version, run `npm run build-storybook` and serve `storybook-static` at `http://127.0.0.1:6106`, for example with `python3 -m http.server 6106 --bind 127.0.0.1 --directory storybook-static`.
2. Run `npm run visual:capture -- /tmp/inspectr-baseline`.
3. Build and serve the changed version on the same address, then run `npm run visual:capture -- /tmp/inspectr-candidate`.
4. Run `npm run visual:compare -- /tmp/inspectr-baseline /tmp/inspectr-candidate /tmp/inspectr-diffs`. It reports missing images, changed dimensions, and images with more than 0.1% differing pixels, saving diff images for matching dimensions. Inspect differences before accepting them.
5. Run `npm run visual:interactions` against each build to check the rules editor, a request detail interaction, and Tremor badge contrast.

Use the same Chrome version, operating system, viewport, and story data for both captures. `STORYBOOK_URL` changes the server URL; `STORY_FILTER` is a regular expression matching story IDs. `THEME=light` or `THEME=dark` captures one theme. Set `VIEWPORT_WIDTH` and/or `VIEWPORT_HEIGHT` to capture one custom viewport. The default matrix is 1440 by 900 and 390 by 844.

These checks do not cover every interaction. In particular, some stories use live API requests or placeholder callbacks, so a clean screenshot run does not prove populated screens or tab behavior work. Supply stable fixtures or perform a separate check against a running backend for those flows. Captures are written to the chosen directory, not committed automatically.
