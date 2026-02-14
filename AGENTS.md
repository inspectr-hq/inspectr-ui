# inspectr-ui

## Required Reading (MANDATORY)

Before any work, open and read: **../.agents/AI_RULES.md**

Failure to read is a violation. If file not found, stop and ask.

## Planning

For non-trivial tasks: create/update PLAN.md using ../.agents/PLAN_TEMPLATE.md

## Skills & Commands

Skills at `.codex/skills/`:
- **`frontend-react`** - **Read this for React work.** 
- `plan-first` - Planning workflow for complex tasks
- `code-review` - For code review

Commands: `/plan`, `/test`, `/lint`, `/release`

---

# Repository Guidelines

## Project Structure & Module Organization
- `src/`: React source. Key folders: `components/` (PascalCase components), `hooks/` (`useX` hooks), `utils/` (helpers), `styles/` (Tailwind/global CSS), `assets/` (images/icons). Library entry: `src/index.jsx`.
- `stories/`: Storybook stories (`*.stories.jsx`).
- `.storybook/`: Storybook config (`main.ts`, `preview.ts`).
- `dist/`: Build output (ESM/UMD bundles and `style.css`). Do not edit manually.
- Root config: `vite.config.js`, `.prettierrc`, `tsconfig.json`, `index.html` (local playground).

## Build, Test, and Development Commands
- `npm run dev`: Start Vite dev server for local playground.
- `npm run build`: Build library to `dist/` (ESM + UMD) with externals for React.
- `npm run watch`: Rebuild on changes (library mode).
- `npm run storybook`: Run Storybook at `http://localhost:6006`.
- `npm run build-storybook`: Generate static Storybook site.
- `npm run format`: Format `src/**` with Prettier.
- `npm test`: Placeholder (no unit test runner configured).
- `npm run release`: Build and publish via `np` (maintainers, `main` branch).

## Coding Style & Naming Conventions
- Prettier enforced: 2 spaces, semicolons, single quotes, width 100, no trailing commas.
- Components: PascalCase file and export (e.g., `RequestList.jsx` exports `RequestList`).
- Hooks: `useCamelCase` (e.g., `useLocalStorage.jsx`).
- Utilities: lowerCamelCase filenames (e.g., `formatXml.js`).
- Stories: `ComponentName.stories.jsx` in `stories/`.
- Keep React and ReactDOM as peer deps; avoid importing from `react-dom/server` in library code.

## Testing Guidelines
- Primary verification is via Storybook. Add/maintain stories for new or changed components, exercising props with controls.
- No unit test framework configured; if adding one, co-locate tests next to components or under `__tests__` and wire `npm test` accordingly.
- Validate builds: `npm run build` must succeed; visually verify in Storybook.

## Commit & Pull Request Guidelines
- Use Conventional Commits: `feat:`, `fix:`, `chore:`, etc.; include scope when helpful (e.g., `feat(components): ...`).
- Reference issues/PRs (e.g., `(#42)`) and keep messages imperative.
- PRs must include: clear description, linked issue, before/after screenshots or a short GIF for UI, updated stories, and any doc changes.
- Run `npm run format` and ensure `build` and `storybook` run locally before requesting review.

## Security & Configuration Tips
- Externals: React and ReactDOM are externalized in `vite.config.js`—do not bundle them.
- CSS: Tailwind is used; prefer utility classes and keep any global additions in `src/styles/global.css`.
