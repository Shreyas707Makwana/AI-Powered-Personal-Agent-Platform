# UI/UX Manual Testing Guide

This guide helps you verify the frontend UI overhaul without touching backend logic or APIs.

## Prereqs
- Node 18+
- Backend and DB running as usual (no schema/API changes required)

## Start frontend
```bash
npm install
npm run dev
```
Open http://localhost:3000

## Landing page `/`
- Hero renders with minimal dark theme (no heavy neon glows).
- Metrics strip shows 4 cards.
- Features and Testimonials sections visible.
- Footer visible.
- Clicking Login or Try Demo sends you to `/login`.

## Auth redirect
- If logged in, hitting `/` redirects to `/app`.
- If logged out, `/app` should redirect to `/login`.

## App page `/app`
- Header: user email, Analytics link, SIGN_OUT button.
- Mobile menu (≤1024px width):
  - Toggle menu button works.
  - Upload and Archive open slide-in drawers.
  - Weather Tool and News Tool open their modals inside Chat via the global event bus.
- Desktop layout (≥1024px width):
  - Left column shows `ToolsCard`, `Upload`, and `DocumentsList` stacked.
  - Right column shows `Chat`.

## Tools & Modals
- Weather and News buttons in `ToolsCard` open the same modals.
- Mobile menu tool shortcuts also open these modals.
- Modals stack correctly on top of drawers and content.

## Analytics `/analytics`
- KPI cards render with demo values.
- Sparkline and bar chart render.
- Export CSV downloads `analytics_export.csv` with demo rows.
- "Back to App" returns to `/app`.

## Theme & accessibility
- Cards, buttons, inputs have subtle borders and shadows (no neon glow).
- Focus rings visible with keyboard navigation.
- Prefers-reduced-motion reduces animated backgrounds.
- Contrast check: text remains readable on surfaces.

## Known notes
- ESLint may warn about `<img>` usage in Chat; not a blocker.
- No backend/API contract changes were made.

## Files of interest
- `src/app/globals.css` — minimal dark theme overrides.
- `src/app/page.tsx` — landing page with metrics strip.
- `src/app/analytics/page.tsx` — analytics demo page with CSV export.
- `src/app/app/page.tsx` — main app with responsive layout & mobile tool shortcuts.
- `src/lib/toolBus.ts` — global event bus for opening tool modals.

## Quick smoke checklist
- [ ] `/` renders hero + metrics + features + testimonials + footer
- [ ] `/app` loads with authenticated user
- [ ] Mobile menu toggles; drawers open/close
- [ ] Tools open from sidebar and mobile menu
- [ ] `/analytics` renders; CSV export works
- [ ] Subtle theme everywhere; no bright glows
