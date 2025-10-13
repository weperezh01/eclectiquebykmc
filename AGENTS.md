# Repository Guidelines

## Project Structure & Module Organization
- `app/` Remix app (TypeScript): `routes/`, `components/`, `content/`, `styles/`, `shared/`, `types/`.
- `app/routes/` uses Spanish slugs and Remix naming: `_index.tsx`, `$param` (e.g., `guias.$slug.tsx`).
- `public/` static assets (images, favicon). Reference with `/images/...`.
- `backend/` Express API for auth (optional locally). Dev port: 8020.
- Config: `vite.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `tsconfig.json`.

## Build, Test, and Development Commands
- Frontend dev: `npm run dev` (Vite on http://localhost:5177).
- Build: `npm run build` → outputs to `build/`; Prod start: `npm run start`.
- Lint & types: `npm run lint`, `npm run typecheck`.
- Watch (rebuild + serve): `npm run watch`.
- Backend (optional): `cd backend && npm run dev` or `./start-backend-docker.sh`.
- Smoke tests: `./test-auth-system.sh` and `./test-api-connectivity.sh` (requires backend).

## Coding Style & Naming Conventions
- TypeScript, React function components; 2‑space indent; no unused vars.
- Components PascalCase (`Hero.tsx`), variables/functions camelCase, constants UPPER_SNAKE_CASE.
- Routes in Spanish; follow Remix file conventions (`login._index.tsx`, `tienda.$slug.tsx`).
- Styling with TailwindCSS utility classes; avoid inline styles; assets in `public/images/`.
- Run `npm run lint` before pushing.

## Testing Guidelines
- No unit test framework yet; rely on `typecheck`, `lint`, and manual flows.
- Verify pages at `http://localhost:5177` and API with the provided shell scripts.
- If adding tests, prefer Vitest for units and Playwright for e2e. Name files `*.test.ts` near sources.

## Commit & Pull Request Guidelines
- Use Conventional Commits: `feat(scope): summary`, `fix(scope): summary`, `chore: …`.
- PRs must include: clear description, linked issue, screenshots for UI changes, test steps/results, and noted env changes.

## Security & Configuration Tips
- Copy `.env.example` → `.env`; never commit real secrets. Use `AFFILIATE_*` vars as needed.
- Backend secrets live in `backend/.env` locally; do not commit sensitive values.
