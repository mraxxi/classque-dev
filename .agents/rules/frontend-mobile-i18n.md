---
trigger: always_on
description: Frontend, responsive UX, i18n and terminology rules for ClassQue
---

# Rule: Frontend, responsive UX and i18n

Applies to everything under `src/web/` and `src/shared/i18n/`.

## Responsive UX & Layout
- Target: portable, typically battery-powered devices with device tiering: **laptop > tablet > phone**. Primary design target and default responsive breakpoint is laptop-class viewports in landscape orientation (e.g. 1280×800, 1024×768); tablet (e.g. 768×1024) and phone (e.g. 360×800) are fully supported secondary tiers adapting cleanly.
- Navigation: viewport-conditional. Laptop-class viewports use a sidebar or top navigation; phone-tier viewports use bottom navigation (**Today · Week · Groups · Plans · More**). The Today screen is the home screen; every frequent action is at most two clicks/taps from it.
- Touch & ergonomics: minimum touch/tap target 44×44 px across all device tiers (supporting touch laptops, tablets, and phones). Body text at least 16 px (prevents unwanted mobile zoom on input focus).
- Minimize typing: defaults, toggles, pickers, bulk paste for learner names, numeric keypad for scores (`inputmode="decimal"`).
- Every screen implements loading, empty and error states. Empty states explain the next action.
- No hover-only interactions (all controls must be operable by touch or keyboard). No horizontal page scroll; wide data tables or matrices scroll within their own container.
- Battery & resource consciousness: lightweight DOM, minimal re-renders, zero polling, efficient CSS. Performance is framed around battery and device longevity during long school days, not merely small screens.
- Accessibility: every input has a label, visible focus, sufficient contrast, status conveyed by text or icon, not color alone (attendance and session status especially).

## State and networking
- Server state through TanStack Query with sensible `staleTime`. No polling, no refetch-on-interval. Refetch on window focus is allowed only for the Today view.
- Forms with data entry (attendance, scores, plans, notes) keep an unsaved **draft** in `localStorage` keyed by entity and clear it after a successful save. Show a visible \"Not saved yet\" state and a retry action when a save fails. There is no offline sync queue in the MVP.
- The PWA caches the app shell only. Do not cache API responses in the service worker.

## i18n
- All user-visible text is a key in `src/shared/i18n/en.json` and `id.json`. Key format: `module.screen.element`, lowercase dotted (e.g. `attendance.status.present`). Keys must exist in both languages.
- Sentences use placeholders (`"{count} learners present"`), never concatenation. Use i18next plural support even though Indonesian has no plural forms.
- Dates, times and numbers are formatted with `Intl` using the user's locale and timezone at display time only.
- Layouts must tolerate 40% longer text. No text baked into images or icons.
- Entity labels that the owner allows to vary (Group → \"Class\"/\"Group\") go through the label layer `useLabel('group')`, never a hardcoded word. See `docs/01-glossary.md`.
- Subject Pack labels are translation keys under `pack.<packId>.*` and follow the same rules.
- Run `npm run check:i18n` after any UI change.

## Components and style
- Tailwind utility classes; a small in-house component set in `src/web/components/`. No UI kit dependency. Icons from `lucide-react`.
- One component per file, named exports, props typed. No business logic in components: call hooks/services and shared pure functions.
