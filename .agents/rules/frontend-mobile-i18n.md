---
trigger: always_on
---

---
trigger: always_on
description: Frontend, mobile UX, i18n and terminology rules for ClassQue
---

# Rule: Frontend, mobile UX and i18n

Applies to everything under `src/web/` and `src/shared/i18n/`.

## Mobile UX
- Design at 360 px first, verify at 360×800 and 768×1024. Minimum tap target 44×44 px. Body text at least 16 px (prevents mobile zoom on input focus).
- Navigation: bottom bar with **Today · Week · Groups · Plans · More**. The Today screen is the home screen; every frequent action is at most two taps from it.
- Minimize typing: defaults, toggles, pickers, bulk paste for learner names, numeric keypad for scores (`inputmode="decimal"`).
- Every screen implements loading, empty and error states. Empty states explain the next action.
- No hover-only interactions. No horizontal page scroll; wide tables scroll inside their own container.
- Accessibility: every input has a label, visible focus, sufficient contrast, status conveyed by text or icon, not color alone (attendance and session status especially).

## State and networking
- Server state through TanStack Query with sensible `staleTime`. No polling, no refetch-on-interval. Refetch on window focus is allowed only for the Today view.
- Forms with data entry (attendance, scores, plans, notes) keep an unsaved **draft** in `localStorage` keyed by entity and clear it after a successful save. Show a visible "Not saved yet" state and a retry action when a save fails. There is no offline sync queue in the MVP.
- The PWA caches the app shell only. Do not cache API responses in the service worker.

## i18n
- All user-visible text is a key in `src/shared/i18n/en.json` and `id.json`. Key format: `module.screen.element`, lowercase dotted (e.g. `attendance.status.present`). Keys must exist in both languages.
- Sentences use placeholders (`"{count} learners present"`), never concatenation. Use i18next plural support even though Indonesian has no plural forms.
- Dates, times and numbers are formatted with `Intl` using the user's locale and timezone at display time only.
- Layouts must tolerate 40% longer text. No text baked into images or icons.
- Entity labels that the owner allows to vary (Group → "Class"/"Group") go through the label layer `useLabel('group')`, never a hardcoded word. See `docs/01-glossary.md`.
- Subject Pack labels are translation keys under `pack.<packId>.*` and follow the same rules.
- Run `npm run check:i18n` after any UI change.

## Components and style
- Tailwind utility classes; a small in-house component set in `src/web/components/`. No UI kit dependency. Icons from `lucide-react`.
- One component per file, named exports, props typed. No business logic in components: call hooks/services and shared pure functions.