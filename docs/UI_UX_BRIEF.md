# LifeFlowPlanner UI/UX Brief

## 1. Project Summary
LifeFlowPlanner is a desktop-first productivity app for managing tasks and notes across multiple projects.

- Platform: Web + Electron desktop app
- Stack: React, Vite, Tailwind CSS, shadcn/ui, Framer Motion
- Data: Local persistence with `localStorage` (no backend yet)

## 2. Product Goal
Help users run project work in one place:

- Track tasks in a 4-column Kanban workflow
- Capture and organize markdown notes
- Switch between separate project workspaces

## 3. Target Users
- Solo builders and small teams
- Project leads managing multiple parallel workstreams
- Users who need both task tracking and note-taking in one app

## 4. Core Features
- Multi-project workspace
- Project switching and project CRUD
- Kanban board with columns:
  - Backlog
  - In Progress
  - Review
  - Done
- Task CRUD:
  - title
  - description
  - priority (`low`, `medium`, `high`, `urgent`)
  - assignee
  - due date
  - tags
- Drag-and-drop tasks between columns
- Search + priority filter
- Notes workspace:
  - markdown editor
  - live preview
  - split/edit/preview modes
  - note pin/duplicate/delete
  - import/export markdown
- Light/dark mode toggle

## 5. Current Information Architecture
- Header:
  - active project title and description
  - view switch (`Kanban` / `Notes`)
  - theme toggle
- Project switcher section:
  - project cards
  - create/edit/delete actions
- Main content:
  - Kanban board view OR Notes view

## 6. UX Problems To Solve
- Improve visual hierarchy and polish across the app
- Make project context and switching clearer
- Reduce cognitive load in task creation/edit flows
- Improve scanability of task cards and notes list
- Keep interactions fast and clear on both desktop and mobile widths

## 7. Design Direction (Requested)
- Feel professional and modern, but not generic
- Strong typography and clearer spacing rhythm
- Better visual grouping and section contrast
- Purposeful motion (subtle, meaningful transitions)
- High readability in both light and dark themes

## 8. Functional Constraints
- Must keep all existing features and workflows
- Must support desktop and mobile responsive layouts
- Must remain implementable with current stack:
  - React
  - Tailwind CSS
  - shadcn/ui components
- No backend assumptions (local-first UX)

## 9. Accessibility Requirements
- Clear keyboard focus states
- Good color contrast in both themes
- Large enough click/tap targets
- Avoid motion-heavy patterns that harm usability
- Respect reduced motion preference

## 10. Desired UI/UX AI Deliverables
- High-level redesign concept
- Desktop + mobile screen layouts for:
  - dashboard header/project context
  - project switcher
  - Kanban board
  - task dialog
  - notes workspace
- Component-level design tokens:
  - color
  - spacing
  - typography scale
  - radius/shadow system
- Interaction specs for key states:
  - hover
  - active
  - drag/drop
  - empty states
  - loading/saving indicators

## 11. Success Criteria
- Faster visual scanning of projects/tasks/notes
- Less friction when switching projects and editing items
- Better perceived quality and clarity
- Preserved or improved usability on small screens

## 12. Optional Prompt For UI/UX AI
Design a modern, high-clarity productivity UI for a multi-project Kanban + Notes app called LifeFlowPlanner. Keep all existing functionality. Create desktop and mobile layouts with a strong but practical visual identity, clear hierarchy, fast scanning, accessible contrast, and purposeful motion. Include a refined project switcher, improved task cards/dialog, and an efficient notes editing experience with markdown preview. Provide a component system and design tokens that can be implemented in React + Tailwind + shadcn/ui.
