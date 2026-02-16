# KanbanBoard

Kanban + Notes tracker built with React, Tailwind CSS, and `shadcn/ui`.

## Stack

- React + Vite
- Electron (`electron-builder`) for desktop packaging
- Tailwind CSS
- `shadcn/ui` component primitives (`Button`, `Dialog`, `Input`, `Textarea`, `Tabs`, `Card`, `Badge`)

## Features

- Segmented `Kanban / Notes` toggle using shadcn tabs
- Light/Dark mode toggle with saved preference
- Four workflow stages: `Backlog`, `In Progress`, `Review`, `Done`
- Task create, edit, delete
- Drag-and-drop tasks between columns
- Task details: title, description, priority, assignee, due date, tags
- Search + priority filtering
- Per-column task count
- Notes workspace with autosave
- Local persistence (`localStorage`) for tasks, notes, and active view

## Run Locally

```bash
npm install
npm run dev
```

Build web assets:

```bash
npm run build
```

Run desktop app from built assets:

```bash
npm run build
npm run start
```

Package desktop app:

```bash
npm run build:desktop
```

Platform-specific packaging:

```bash
npm run build:win
npm run build:mac
npm run build:linux
```

Packaged installers/artifacts are generated in `release/`.

## CI Desktop Builds

GitHub Actions workflow included:

- `.github/workflows/desktop-build.yml`

Build targets:

- macOS DMG (`build:mac`)
- Windows EXE / NSIS (`build:win`)

Runs on:

- Push to `main`
- Manual trigger

Release behavior:

- `release-please` handles auto versioning and changelog generation.
- On normal pushes, it opens/updates a Release PR.
- When that Release PR is merged, it creates a GitHub Release + tag.
- Then this workflow builds Windows/macOS installers and uploads them to that Release page for public download.
- If a run shows "Build Desktop Installers: skipped", no new release was created in that run. Use manual run with `force_build=true` to build anyway.

Version bump rules (Conventional Commits):

- `fix:` => patch
- `feat:` => minor
- `!` or `BREAKING CHANGE:` => major

## Future Android / iOS

For mobile packaging, keep the current React/Vite renderer and add Capacitor native shells.

Useful scripts (after installing Capacitor packages):

- `npm run mobile:init`
- `npm run mobile:add:android`
- `npm run mobile:add:ios`
- `npm run mobile:sync`
- `npm run mobile:open:android`
- `npm run mobile:open:ios`

Details:

- `docs/PACKAGING_AND_MOBILE.md`
- `docs/CROSS_PLATFORM_REARCHITECTURE.md`
- `docs/GITHUB_RELEASE_INSTRUCTIONS.md`
