# KanbanBoard

A lightweight, modern Kanban board for tracking projects and day-to-day tasks.

## Features

- Four workflow stages: `Backlog`, `In Progress`, `Review`, `Done`
- Create, edit, and delete tasks
- Drag-and-drop tasks between columns
- Task fields:
  - Title
  - Description
  - Priority (`Low`, `Medium`, `High`, `Urgent`)
  - Assignee
  - Due date
  - Tags
- Search by title/description/tags/assignee
- Priority filter
- Per-column task counts
- Local persistence using `localStorage`
- Responsive layout for desktop and mobile

## Project Structure

```text
.
|- index.html
|- styles.css
|- app.js
`- README.md
```

## Run Locally

1. Clone the repository.
2. Open `index.html` directly in your browser.

No build tools or dependencies are required.

## Usage

1. Click **Add Task** to create a task.
2. Drag task cards between columns to update status.
3. Use **Search tasks** and **Priority** filter to focus work.
4. Click **Edit** to update a task or **Delete** to remove it.

## Notes

- Data is stored in your browser (`localStorage`), so tasks persist across refreshes on the same machine/browser profile.
