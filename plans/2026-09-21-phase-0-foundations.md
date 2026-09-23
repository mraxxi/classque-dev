# Phase 0 — Foundations

## Goal
A running, verified skeleton; nothing user-facing beyond the shell.
- Scaffold the project (Vite, React, TypeScript, Hono Worker, Tailwind, React Router, TanStack Query, Vitest).
- Setup i18n infrastructure (`en.json`, `id.json`, label layer, `check:i18n` script using TS compiler API).
- Create migration `0001` (`accounts`, `users`, `memberships`, `workplaces`).
- Implement Identity (`getIdentity`, dev bypass, first-login provisioning, `/api/v1/me`, `requireAccess`).
- Build the App Shell (bottom navigation, placeholder screens for Today/Week/Groups/Plans) and Settings screen.
- Define Subject Pack schema, registry, and the `generic` and `english` packs (data only).
- Implement shared utilities (`id.ts`, date helpers, error formats) and tests.

## Requirement IDs in scope
- **DM-001**: Every tenant table has `account_id` and children match parents.
- **DM-002**: IDs are ULID `TEXT`, generated in the Worker.
- **DM-003**: Timestamps `created_at` / `updated_at` are UTC ISO-8601 `TEXT`.
- **DM-004**: Session date/time are local wall-clock plus IANA `tz` (noted for future schema usage).
- **DM-005**: Archive vs delete: Workplace uses `archived_at` (never hard-deleted).
- **DM-006**: Enumerations enforced by `CHECK` constraints and mirrored as Zod enums.
- **DM-007**: Future-readiness fields (`role`, `visibility`) set to single MVP values (`teacher`, `private`).
- **IDN-001**: `getIdentity(request)` is the only function that reads authentication material.
- **IDN-002**: Verify Cloudflare Access JWT in production (`Cf-Access-Jwt-Assertion`).
- **IDN-003**: Local development bypass using `DEV_USER_EMAIL` in `.dev.vars` when `ENVIRONMENT === 'development'`.
- **IDN-004**: First-login provisioning (creates user, account, membership, default independent workplace in one batch).
- **IDN-005**: Invite-only via Cloudflare Access allow-list (auto-provision on first request).
- **IDN-006**: `requireAccess(identity, resourceAccountId)` tenant safety check (returns 404 on mismatch).
- **IDN-007**: Return `enabled_modules` in `GET /api/v1/me` for UI toggles.
- **SET-001**: Settings screen (Language, Timezone, Week start, Group label).
- **SET-002**: Change language applies live and persists via `PATCH /api/v1/me`.
- **SET-003**: Timezone picker using `Intl.supportedValuesOf('timeZone')`.
- **SET-004**: Changing timezone doesn't alter existing sessions; show `settings.timezone.notice`.
- **SET-005**: Module toggles (Plans, Notes, Assessments, Progress Levels) hide/show UI.
- **SET-006**: More screen lists Notes, Workplaces, Settings, About.
- **PK-001**: Packs are TS data objects registered in `src/shared/packs/registry.ts`.
- **PK-002**: Pack labels are translation keys in `en.json` and `id.json`.
- **PK-003**: Packs have integer versions.
- **PK-004**: New groups default to `generic` pack.
- **PK-005**: Changing pack restricted (enforced later in UI, noted for schema).
- **PK-006**: `progressScale: null` hides progress UI.
- **PK-007**: Test validates registered packs against Zod schema and uniqueness.

## Files to create/change
- Configuration: `package.json`, `tsconfig.json`, `vite.config.ts`, `tailwind.config.js`, `wrangler.jsonc`, `eslint.config.js`, `public/_headers` (for CSP/Security headers).
- Scripts: `scripts/check-i18n.ts` (using TypeScript compiler API).
- Migrations: `migrations/0001_initial_schema.sql`
- Shared: `src/shared/id.ts`, `src/shared/date.ts`, `src/shared/errors.ts`, `src/shared/schemas/identity.ts`
- Subject Packs: `src/shared/packs/types.ts`, `src/shared/packs/generic.ts`, `src/shared/packs/english.ts`, `src/shared/packs/registry.ts`, `src/shared/packs/validator.test.ts`
- i18n: `src/shared/i18n/en.json`, `src/shared/i18n/id.json`
- Worker App: `src/worker/index.ts`
- Worker Libs: `src/worker/lib/jwks.ts` (for IDN-002 caching in module memory).
- Worker Middleware: `src/worker/middleware/identity.ts`, `src/worker/middleware/csrf.ts` (for CSRF same-origin checks on mutating requests).
- Worker Routes: `src/worker/routes/me.ts`
- Worker Services: `src/worker/services/identity.ts` (calls repository for D1 interactions).
- Worker Repositories: `src/worker/repositories/identity.repo.ts` (executes the D1 batch for provisioning).
- Web App: `src/web/main.tsx`, `src/web/App.tsx`, `src/web/router.tsx`
- Web UI: `src/web/components/` (Navigation, Layout, Inputs)
- Web Hooks: `src/web/hooks/useIdentity.ts`, `src/web/hooks/useSettings.ts`, `src/web/hooks/useLabel.ts`
- Web Features: `src/web/features/settings/SettingsScreen.tsx`, `src/web/features/more/MoreScreen.tsx`, `src/web/features/home/PlaceholderScreens.tsx`

## Migrations
- `migrations/0001_initial_schema.sql` will include `accounts`, `users`, `memberships`, and `workplaces` as specified in `docs/ddl_ref.md`.

## Workplaces scope note
- Scope is strictly limited to creating the `workplaces` table in migration 0001 and the minimal internal logic required for IDN-004 (creating the default `independent` Workplace on first login via `identity.repo.ts`).
- **Deferred to v0.1**: WPL-002 through WPL-008 (Workplace switcher, adding/renaming/archiving, grading settings), any `/api/v1/workplaces*` endpoints, and Workplace UI beyond the Settings/More screen placeholder link.

## Tests
- Vitest unit tests for `src/shared/` (id generator, pack validation, date helpers).
- Route/integration tests for the Hono worker (`/api/v1/health` and `/api/v1/me`) covering tenant isolation (IDN-006), development bypass (IDN-003), and first-login provisioning using `@cloudflare/vitest-pool-workers`.
- Verification of PWA shell installability and updates.
- **PWA + Cloudflare Access test**: Verify that `navigateFallbackDenylist` correctly covers `/api/` and `/cdn-cgi/` so Access login redirects are not swallowed by the Service Worker.
- Run `npm run check:i18n` for missing keys and English hardcoded text.
- Manual UI testing at 360x800 and 768x1024 for responsive shell and settings.

## Platform API doc links
- Cloudflare Workers: https://developers.cloudflare.com/workers/
- Cloudflare D1: https://developers.cloudflare.com/d1/
- Cloudflare Access JWT validation: https://developers.cloudflare.com/cloudflare-one/identity/authorization-cookie/validating-json/
- Vite Config: https://vitejs.dev/config/
- React Router v6: https://reactrouter.com/en/main
- TanStack Query v5: https://tanstack.com/query/latest/docs/react/overview
- Hono v4: https://hono.dev/
- Tailwind CSS: https://tailwindcss.com/docs/installation
- i18next / react-i18next: https://react.i18next.com/

## Risks
- **Test Setup**: `@cloudflare/vitest-pool-workers` compatibility with Vite in a single folder. If incompatible, the fallback testing strategy will be to test Worker routes using Wrangler's `unstable_dev` API or mocking D1 bindings entirely for unit tests.
- **PWA + Access**: PWA caching the authentication flow or Access redirect paths. Needs careful configuration of `navigateFallbackDenylist` in Vite PWA plugin. May need a local throwaway spike before actual implementation.
- **Race conditions**: First-login provisioning (IDN-004) hitting race conditions if the UI makes concurrent requests on initial load. Frontend must block on a single `/api/v1/me` fetch.

## Assumptions made
- Existing code in `src/`, `migrations/`, and config files is scaffolding to be completely replaced.
- SPA fallback will be handled by Workers with Static Assets (`not_found_handling: "single-page-application"`).

## Open questions
- **Q-010**: IDN-002 (Cloudflare Access JWT validation) relies on D-008, which is marked "Proposed". Does this block Phase 0? I will implement the JWT validation code as specified, but testing it locally will rely on the `DEV_USER_EMAIL` bypass unless we have a real JWT/JWKS setup.
