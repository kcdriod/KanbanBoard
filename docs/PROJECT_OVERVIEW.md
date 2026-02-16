# Project Overview: LifeFlow Planner

## 1. Product Summary

LifeFlow Planner is a cross-platform planning app for personal and professional use cases.  
It combines:

- Kanban-style item management
- Note-taking with inline link previews
- Multi-plan (workspace) organization

Core positioning: one planner for day-to-day life tasks (example: haircut, home maintenance) and structured project execution.

## 2. Target Users

- Individual planners (personal life, errands, routines)
- Home/project organizers (repairs, purchases, upkeep)
- Work planners (goals, updates, recurring workflows)
- Learners (tutorial-driven notes, reference links)

## 3. Primary UX Surfaces

### A. Kanban View

- 4 fixed stages: `Backlog`, `In Progress`, `Review`, `Done`
- Drag-and-drop item movement across stages
- Quick filter/search controls
- Create/edit/delete items from modal form

### B. Notes View

- Left panel: note list (pin, timestamps, quick selection)
- Right panel: note editor with formatting shortcuts
- Auto-saving notes
- Inline link extraction and compact preview cards (thumbnail + title + URL + remove)

### C. Plan Management

- Multiple plans
- Plan type presets: `Personal`, `Home`, `Work`, `Learning`, `Custom`
- Optional template-based plan creation

## 4. Current Item Card Types

The app currently supports these card types:

- `Basic`
- `Checklist`
- `Deadline`
- `Recurring`
- `Priority Matrix`

Rationale: reduced complexity from previous advanced card variants and aligned to practical planning patterns.

## 5. Notes + Link Preview Behavior

- Pasting URLs into note content triggers automatic preview generation
- YouTube links use YouTube thumbnail strategy
- Generic web links attempt metadata + thumbnail resolution
- Previews are shown in a compact/minimal style under the editor

## 6. Data + Persistence

Client-side persistence via `localStorage`:

- Workspace/plans
- Items and item metadata
- Notes and note link previews
- Active view and theme preference

No backend is currently required for base functionality.

## 7. Visual Direction (Current)

- Warm, editorial palette with gradient accents
- Light/dark theme support
- Motion/interaction via Framer Motion
- Dense-but-readable board cards with contextual metadata badges

## 8. Technical Stack

- React + Vite
- Tailwind CSS + shadcn/ui primitives
- Electron desktop shell
- Electron Builder for packaging

Key app files:

- Main UI: `src/App.jsx`
- Styling: `src/index.css`
- Desktop shell: `electron/main.cjs`, `electron/preload.cjs`

## 9. Platform and Distribution Status

### Desktop (active)

- macOS and Windows packaging configured
- CI workflow present for desktop builds:
  - `.github/workflows/desktop-build.yml`

### Mobile (planned)

- Documented migration path via Capacitor (Android/iOS)
- See:
  - `docs/PACKAGING_AND_MOBILE.md`

## 10. UX Issues to Review with UI/UX Team

1. Navigation clarity between planning and note workflows.
2. Card density on Kanban columns (mobile and laptop widths).
3. Form usability in Add/Edit Item modal for each card type.
4. Link preview hierarchy in notes (noise vs value balance).
5. Information architecture for plan-level stats and quick actions.
6. Brand consistency: naming, icon/logo application across app shell and packaged builds.

## 11. Suggested Next UX Deliverables

1. End-to-end user flow map (Plan creation → Item tracking → Note capture).
2. Wireframe pass for:
   - Board
   - Item modal
   - Notes editor + link preview interactions
3. Design tokens spec (spacing, typography scale, status colors, card semantics).
4. Usability test script for personal/home/work scenarios.
5. Priority UI backlog with quick wins vs structural redesign items.

---

Prepared for UI/UX handoff conversation.  
Project root: `/Users/vijayadurganarayanavarapu/Desktop/KanbanBoard`
