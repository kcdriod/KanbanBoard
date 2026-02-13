# KanbanBoard

Kanban + Notes tracker built with React, Tailwind CSS, and `shadcn/ui`.

## Stack

- React + Vite
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

Build for production:

```bash
npm run build
```
