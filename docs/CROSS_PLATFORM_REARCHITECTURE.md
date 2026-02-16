# Cross-Platform Rearchitecture Plan

## 1. Goal
Support one product across:
- Web
- iOS
- Android
- Windows
- macOS

without duplicating business logic or UI behavior.

## 2. Current Constraints
- App logic is concentrated in `src/App.jsx`
- Data is mostly local-first (`localStorage`)
- Desktop uses Electron packaging
- Mobile packaging is not fully integrated yet

## 3. Target Architecture
Use one shared React codebase with platform shells and clear layers.

### 3.1 Layers
1. `Presentation` (React screens/components)
2. `Domain` (types, validation, business rules)
3. `Data` (repositories, sync, cache, API clients)
4. `Platform` (file system, notifications, deep links, secure storage)

### 3.2 Repo Shape (Incremental)
```text
src/
  app/                  # app bootstrap, providers, routing
  features/
    projects/
    board/
    notes/
    auth/
    members/
  domain/
    models/
    services/
    policies/
  data/
    repositories/
    supabase/
    local-cache/
    sync/
  platform/
    contracts.ts
    web/
    electron/
    capacitor/
  ui/
    components/
    layouts/
    tokens/
```

## 4. Platform Strategy

### 4.1 Web
- Keep Vite React app as primary target
- Add PWA support for installable web app and better offline behavior

### 4.2 iOS + Android
- Use Capacitor as native shell around the same web build
- Use Capacitor plugins for native capabilities when needed

### 4.3 Windows + macOS
- Keep Electron for now to avoid a risky desktop rewrite
- Optional Phase 2: evaluate Tauri migration for smaller footprint

## 5. Data and Collaboration Architecture

### 5.1 Backend
- Supabase Auth + Postgres + Realtime
- RLS as the main permission boundary

### 5.2 Local Cache + Sync
- Replace direct `localStorage` writes with repository interfaces
- Add local cache adapter:
  - web: IndexedDB
  - mobile/desktop: SQLite (later phase)
- Sync model:
  - optimistic updates in UI
  - background push/pull
  - conflict resolution by `updated_at` + deterministic merge rules

## 6. Critical Design Decisions

1. Never call Supabase directly from UI components.
2. All reads/writes go through `repositories`.
3. Platform-specific APIs only via `platform/contracts.ts`.
4. Feature state scoped by module (`board`, `notes`, `projects`) not one giant app state.
5. Shared task schema must support dynamic sections (already started).

## 7. Migration Plan (No Big Bang Rewrite)

### Phase 0: Stabilize Foundation (1-2 days)
- Extract shared types and constants from `App.jsx`
- Add repository interfaces for `projects/tasks/notes`
- Keep current UI unchanged

### Phase 1: Split Feature Modules (3-5 days)
- Break `App.jsx` into:
  - `features/board`
  - `features/notes`
  - `features/projects`
- Move dialogs and handlers into feature modules

### Phase 2: Auth + Cloud Persistence (4-7 days)
- Integrate Supabase auth gate
- Move CRUD from local state to repository-backed data access
- Keep local import path from existing `localStorage`

### Phase 3: Realtime Collaboration (2-4 days)
- Subscribe to tasks/notes/project changes
- Add optimistic updates + reconciliation
- Add member roles in UI guards

### Phase 4: Mobile Productization (3-6 days)
- Finalize Capacitor setup
- Add deep link handling + secure token storage
- Validate keyboard, touch, safe-area behavior

### Phase 5: Desktop Hardening (2-4 days)
- Improve Electron update/distribution pipeline
- Add auto-updates and signed builds
- Performance profiling for large boards

## 8. CI/CD Matrix

### Web
- Deploy previews on each PR
- Production deploy from `main`

### Desktop
- Existing GitHub Actions build for win/mac
- Add signing secrets and release channel tags

### Mobile
- Build pipelines:
  - Android (Gradle)
  - iOS (Xcode/Fastlane on macOS runner)

## 9. Testing Strategy
- Unit: domain services, mapping, policy guards
- Integration: repository + Supabase flows
- E2E (Playwright):
  - board operations
  - section management
  - collaboration scenarios
- Device checks:
  - iOS Safari/WebView
  - Android Chrome/WebView
  - Windows + macOS desktop wrappers

## 10. Immediate Tasks to Start This Week
1. Create `src/domain`, `src/data`, `src/platform`, `src/features` folders.
2. Introduce `TaskRepository`, `ProjectRepository`, `NoteRepository` interfaces.
3. Move dynamic section logic from `App.jsx` into `features/board`.
4. Add Supabase client module and environment wiring.
5. Add a lightweight app router and split board/notes screens.

## 11. Definition of Done for Rearchitecture
- Same features available on web, iOS, Android, Windows, macOS
- One shared feature code path for board/notes/projects
- Auth + sharing + realtime enabled
- Platform wrappers only handle host capabilities
- No critical logic left in monolithic `App.jsx`
