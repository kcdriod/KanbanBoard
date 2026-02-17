# LifeFlowPlanner Collaboration and Deployment Strategy

## 1. Objective
Convert LifeFlowPlanner from single-user local storage to a secure, multi-user collaborative app with:
- user login
- workspace sharing and roles
- real-time updates
- reliable deployment for teammates

## 2. Current State
- Frontend-only React + Electron app
- Data stored in `localStorage`
- No backend, no identity, no authorization
- No shared state between users/devices

## 3. Target State
- Hosted web app with authentication
- Postgres-backed persistence
- Team workspaces with invite flow
- Role-based access (`owner`, `editor`, `viewer`)
- Real-time task/notes sync
- Optional Electron wrapper pointing to same backend

## 4. Recommended Stack (MVP)
- Backend platform: Supabase
- Auth: Supabase Auth (email/password + magic link, optional Google)
- Database: Supabase Postgres
- Real-time: Supabase Realtime subscriptions
- File storage (optional later): Supabase Storage
- Hosting: Vercel or Netlify (web app)

## 5. High-Level Architecture
1. Client (React app)
- UI + state management
- Supabase JS client for auth, CRUD, realtime

2. Backend (Supabase)
- Auth for identity/session
- Postgres for normalized project/task/note data
- RLS policies for workspace-level security

3. Deployment
- Frontend deployed to Vercel/Netlify
- Environment variables for Supabase URL/key

## 6. Data Model (MVP)
Use UUID primary keys and `created_at`, `updated_at` timestamps on all tables.

### 6.1 Tables
1. `profiles`
- `id` (uuid, PK, references auth user id)
- `email` (text)
- `display_name` (text)

2. `workspaces`
- `id` (uuid, PK)
- `name` (text)
- `description` (text)
- `created_by` (uuid)

3. `workspace_members`
- `workspace_id` (uuid, FK)
- `user_id` (uuid, FK)
- `role` (enum: `owner`, `editor`, `viewer`)
- unique (`workspace_id`, `user_id`)

4. `projects`
- `id` (uuid, PK)
- `workspace_id` (uuid, FK)
- `name` (text)
- `description` (text)
- `created_by` (uuid)

5. `tasks`
- `id` (uuid, PK)
- `project_id` (uuid, FK)
- `title` (text)
- `description` (text)
- `status` (enum: `backlog`, `in-progress`, `review`, `done`)
- `priority` (enum: `low`, `medium`, `high`, `urgent`)
- `card_type` (enum: `classic`, `focus`, `progress`, `checklist`)
- `card_meta` (jsonb)
- `assignee` (text)
- `due_date` (date)
- `tags` (text[])
- `position` (numeric or bigint for ordering)

6. `notes`
- `id` (uuid, PK)
- `project_id` (uuid, FK)
- `title` (text)
- `content` (text)
- `tags` (text[])
- `pinned` (boolean)

7. `workspace_invites`
- `id` (uuid, PK)
- `workspace_id` (uuid, FK)
- `email` (text)
- `role` (enum)
- `token` (text, unique)
- `invited_by` (uuid)
- `expires_at` (timestamp)
- `accepted_at` (timestamp nullable)

## 7. Authorization and Security (RLS)
Enable RLS on every collaborative table.

### 7.1 Policy Rules
1. Workspace visibility
- user can read workspace if they are in `workspace_members`

2. Workspace mutations
- `owner` can update/delete workspace and manage members/invites

3. Projects/tasks/notes
- `viewer`: read only
- `editor` and `owner`: create/update/delete

4. Invites
- `owner` can create/revoke invites
- invited user can accept invite only for their email/token

### 7.2 Security Checklist
- never trust role from client
- role checks enforced in RLS, not only UI
- keep service role key out of frontend
- validate invite token expiration

## 8. Authentication Plan
1. Add auth screens
- login
- signup
- magic link (optional in MVP)
- reset password

2. Session handling
- initialize session at app boot
- handle auth state changes
- redirect unauthenticated users to login

3. User bootstrap
- on first login, create `profiles` row if missing

## 9. Collaboration Features Plan
### 9.1 Sharing Flow
1. Owner opens workspace settings
2. Sends invite by email with role
3. Teammate receives link
4. Teammate signs in
5. Invite token accepted, row inserted into `workspace_members`

### 9.2 Member Management
- list members
- change role (owner only)
- remove member (owner only)
- transfer ownership (phase 2)

## 10. Realtime Plan
Subscribe to:
- `tasks` for active project
- `notes` for active project
- optional `projects` for workspace changes

Behavior:
- optimistic UI for local changes
- reconcile with server payload on realtime event
- de-duplicate updates by record id + updated timestamp

## 11. Frontend Refactor Plan
Introduce a data access layer and separate storage concerns.

### 11.1 Suggested Modules
- `src/lib/supabaseClient.js`
- `src/lib/auth.js`
- `src/lib/workspaceApi.js`
- `src/lib/projectApi.js`
- `src/lib/taskApi.js`
- `src/lib/notesApi.js`
- `src/lib/realtime.js`

### 11.2 App Changes
1. Replace `localStorage` loaders/savers with Supabase queries
2. Add auth gate before main workspace UI
3. Load workspace list for current user
4. Persist task and notes actions to backend
5. Keep existing UI and interactions; only replace data source first

## 12. Migration Strategy (Local to Cloud)
### 12.1 Initial Migration
1. On first authenticated session:
- detect local workspace data
- show "Import local data" prompt
- import into a newly created workspace/project structure

2. Prevent duplicate imports:
- store `local_import_completed` flag per user

### 12.2 Rollback Safety
- keep local data read-only backup for one release cycle
- add export JSON fallback action

## 13. Deployment Plan
### 13.1 Environments
1. `dev`
- Supabase project: development
- preview deployments enabled

2. `prod`
- separate Supabase project
- controlled migration process

### 13.2 Frontend Hosting
- Vercel recommended for fast preview/branch deployments
- required env vars:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

### 13.3 Electron
- keep optional
- point Electron renderer to same web build/backend

## 14. Testing Strategy
### 14.1 Unit
- auth state helpers
- role guard utilities
- task/note mapping and normalization

### 14.2 Integration
- CRUD with Supabase tables
- invite accept flow
- role permission enforcement

### 14.3 E2E (Playwright/Cypress)
- signup/login
- create workspace/project/task
- invite collaborator
- collaborator edits task and owner sees realtime update

## 15. Observability and Operations
- client error logging (Sentry optional)
- audit table (phase 2) for critical actions:
  - member role changed
  - member removed
  - workspace deleted
- daily database backups (Supabase managed)

## 16. Delivery Roadmap
### Phase 0: Preparation (0.5-1 day)
- create Supabase project
- configure env variables
- scaffold data layer modules

### Phase 1: Auth + Profiles (1-2 days)
- login/signup/logout
- auth guard
- profile row bootstrap

### Phase 2: Core Schema + CRUD (2-4 days)
- create tables + RLS
- wire projects/tasks/notes CRUD
- replace localStorage persistence

### Phase 3: Workspace Sharing (2-3 days)
- invite table + token flow
- member roles and management UI
- role-based UI restrictions

### Phase 4: Realtime Collaboration (1-2 days)
- subscriptions for tasks/notes
- optimistic updates + reconciliation

### Phase 5: Import + Rollout (1-2 days)
- local data import wizard
- staged release to team
- gather feedback and fix regressions

## 17. Definition of Done
- teammates can create accounts and log in
- owner can invite teammates and assign role
- invited teammate can access shared workspace
- tasks and notes sync across users in near real-time
- unauthorized actions blocked by RLS
- app deployed and usable by team via URL
- local-to-cloud import works once and is idempotent

## 18. Risks and Mitigations
1. RLS misconfiguration
- mitigation: integration tests for each role/action matrix

2. Realtime race conditions
- mitigation: use `updated_at` conflict resolution and server truth

3. Migration friction
- mitigation: explicit import prompt + backup export path

4. Scope creep
- mitigation: ship MVP first, defer advanced features

## 19. Phase 2 Enhancements (After MVP)
- comments on tasks
- activity feed/audit log UI
- file attachments
- mentions and notifications
- offline-first cache with sync queue
- SSO for organizations

## 20. Immediate Next Steps
1. Create Supabase project and obtain URL/anon key
2. Create SQL schema and RLS policies
3. Implement auth pages and session guard
4. Replace one domain first (`projects`) to validate pattern
5. Continue with tasks/notes and then sharing
