import { memo, useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  KanbanSquare,
  NotebookPen,
  Plus,
  Search,
  CalendarDays,
  UserRound,
  Tag,
  Moon,
  Sun
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const TASKS_STORAGE_KEY = "kanban.board.v1";
const NOTES_STORAGE_KEY = "kanban.notes.v1";
const VIEW_STORAGE_KEY = "kanban.view.v1";
const THEME_STORAGE_KEY = "kanban.theme.v1";

const STATUSES = [
  { id: "backlog", label: "Backlog" },
  { id: "in-progress", label: "In Progress" },
  { id: "review", label: "Review" },
  { id: "done", label: "Done" }
];

const priorityClass = {
  low: "bg-emerald-700/90 text-white border-emerald-800",
  medium: "bg-amber-600 text-white border-amber-700",
  high: "bg-orange-700 text-white border-orange-800",
  urgent: "bg-red-700 text-white border-red-800"
};

const blankForm = {
  title: "",
  description: "",
  priority: "medium",
  status: "backlog",
  assignee: "",
  dueDate: "",
  tags: ""
};

function seedTasks() {
  const now = Date.now();
  return [
    {
      id: crypto.randomUUID(),
      title: "Define project scope",
      description: "Capture business goals, constraints, and MVP boundaries.",
      status: "backlog",
      priority: "high",
      assignee: "Product Team",
      dueDate: "",
      tags: ["planning", "mvp"],
      createdAt: now - 10000
    },
    {
      id: crypto.randomUUID(),
      title: "Design board wireframes",
      description: "Prepare desktop and mobile layout plus interactions.",
      status: "in-progress",
      priority: "medium",
      assignee: "Design",
      dueDate: "",
      tags: ["ux", "ui"],
      createdAt: now - 9000
    },
    {
      id: crypto.randomUUID(),
      title: "Review API integration",
      description: "Validate endpoints and failure handling before release.",
      status: "review",
      priority: "urgent",
      assignee: "Backend",
      dueDate: "",
      tags: ["api", "qa"],
      createdAt: now - 8000
    }
  ];
}

function loadTasks() {
  try {
    const raw = localStorage.getItem(TASKS_STORAGE_KEY);
    if (!raw) return seedTasks();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : seedTasks();
  } catch {
    return seedTasks();
  }
}

function loadNotes() {
  return localStorage.getItem(NOTES_STORAGE_KEY) || "";
}

function loadView() {
  const value = localStorage.getItem(VIEW_STORAGE_KEY);
  return value === "notes" ? "notes" : "board";
}

function loadTheme() {
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function formatDueDate(value) {
  if (!value) return "No due date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No due date";
  return `Due ${date.toLocaleDateString()}`;
}

const TaskItem = memo(function TaskItem({ task, onEdit, onDelete, onDragStart }) {
  return (
    <Card draggable onDragStart={(event) => onDragStart(event, task.id)} className="border-border/90 bg-card">
      <CardHeader className="space-y-2 pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm leading-snug">{task.title}</CardTitle>
          <Badge className={cn("uppercase", priorityClass[task.priority])}>{task.priority}</Badge>
        </div>
        {task.description && (
          <CardDescription className="line-clamp-3 text-xs leading-relaxed">
            {task.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
          <Badge className="gap-1 border-border/80 bg-secondary text-secondary-foreground">
            <CalendarDays className="h-3.5 w-3.5" />
            {formatDueDate(task.dueDate)}
          </Badge>
          {task.assignee && (
            <Badge className="gap-1 border-border/80 bg-secondary text-secondary-foreground">
              <UserRound className="h-3.5 w-3.5" />
              {task.assignee}
            </Badge>
          )}
          {task.tags.map((tag) => (
            <Badge key={`${task.id}-${tag}`} className="gap-1 border-border/80 bg-secondary text-secondary-foreground">
              <Tag className="h-3.5 w-3.5" />
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(task)}>
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(task.id)}
          >
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

function App() {
  const [tasks, setTasks] = useState(loadTasks);
  const [notes, setNotes] = useState(loadNotes);
  const [view, setView] = useState(loadView);
  const [theme, setTheme] = useState(loadTheme);
  const [searchText, setSearchText] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [dragOverStatus, setDragOverStatus] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [formValues, setFormValues] = useState(blankForm);
  const deferredSearchText = useDeferredValue(searchText);

  useEffect(() => {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      localStorage.setItem(NOTES_STORAGE_KEY, notes);
    }, 250);
    return () => window.clearTimeout(handle);
  }, [notes]);

  useEffect(() => {
    localStorage.setItem(VIEW_STORAGE_KEY, view);
  }, [view]);

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  const groupedTasks = useMemo(() => {
    const query = deferredSearchText.trim().toLowerCase();
    const filtered = tasks
      .filter((task) => {
        if (priorityFilter === "all") return true;
        return task.priority === priorityFilter;
      })
      .filter((task) => {
        if (!query) return true;
        const text = [task.title, task.description, task.assignee, task.tags.join(" ")]
          .join(" ")
          .toLowerCase();
        return text.includes(query);
      })
      .sort((a, b) => b.createdAt - a.createdAt);

    const initial = {
      backlog: [],
      "in-progress": [],
      review: [],
      done: []
    };

    for (const task of filtered) {
      initial[task.status].push(task);
    }

    return initial;
  }, [tasks, deferredSearchText, priorityFilter]);

  const openCreateDialog = useCallback(() => {
    setEditingTaskId(null);
    setFormValues(blankForm);
    setDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((task) => {
    setEditingTaskId(task.id);
    setFormValues({
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      assignee: task.assignee,
      dueDate: task.dueDate,
      tags: task.tags.join(", ")
    });
    setDialogOpen(true);
  }, []);

  function handleFieldChange(event) {
    const { name, value } = event.target;
    setFormValues((current) => ({ ...current, [name]: value }));
  }

  function handleSaveTask(event) {
    event.preventDefault();
    const title = formValues.title.trim();
    if (!title) return;

    const parsedTags = formValues.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const payload = {
      title,
      description: formValues.description.trim(),
      priority: formValues.priority,
      status: formValues.status,
      assignee: formValues.assignee.trim(),
      dueDate: formValues.dueDate,
      tags: parsedTags
    };

    if (editingTaskId) {
      setTasks((current) =>
        current.map((task) => (task.id === editingTaskId ? { ...task, ...payload } : task))
      );
    } else {
      setTasks((current) => [
        {
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          ...payload
        },
        ...current
      ]);
    }

    setDialogOpen(false);
  }

  const handleDeleteTask = useCallback((taskId) => {
    setTasks((current) => current.filter((task) => task.id !== taskId));
  }, []);

  const handleDrop = useCallback((status, event) => {
    event.preventDefault();
    const taskId = event.dataTransfer.getData("text/task-id");
    if (!taskId) return;

    setTasks((current) =>
      current.map((task) => (task.id === taskId ? { ...task, status } : task))
    );
    setDragOverStatus("");
  }, []);

  const handleTaskDragStart = useCallback((event, taskId) => {
    event.dataTransfer.setData("text/task-id", taskId);
    event.dataTransfer.effectAllowed = "move";
  }, []);

  return (
    <main className="mx-auto w-[min(1320px,94vw)] py-8">
      <header className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Task Tracking</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Kanban Board</h1>
        </div>

        <div className="flex w-full max-w-[320px] items-center gap-2">
          <Tabs value={view} onValueChange={setView} className="flex-1">
            <TabsList className="w-full">
              <TabsTrigger value="board" className="gap-2">
                <KanbanSquare className="h-4 w-4" />
                Kanban
              </TabsTrigger>
              <TabsTrigger value="notes" className="gap-2">
                <NotebookPen className="h-4 w-4" />
                Notes
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            variant="outline"
            size="icon"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      {view === "board" && (
        <section className="mb-4 grid grid-cols-1 gap-3 rounded-xl border bg-card/85 p-3 shadow-sm sm:grid-cols-[1.4fr_180px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              type="search"
              placeholder="Search by title, assignee, tags..."
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />
          </div>

          <select
            className="h-10 rounded-md border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
          >
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>

          <Button className="gap-2" onClick={openCreateDialog}>
            <Plus className="h-4 w-4" />
            Add Task
          </Button>
        </section>
      )}

      {view === "board" && (
        <section className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-4">
          {STATUSES.map((column) => {
            const columnTasks = groupedTasks[column.id] ?? [];
            return (
              <Card
                key={column.id}
                className={cn(
                  "min-h-[420px] border-border/70 bg-card/75",
                  dragOverStatus === column.id && "border-primary/60 bg-primary/5"
                )}
                onDragEnter={() => setDragOverStatus((current) => (current === column.id ? current : column.id))}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={() => setDragOverStatus("")}
                onDrop={(event) => handleDrop(column.id, event)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{column.label}</CardTitle>
                    <Badge className="border-muted-foreground/30 bg-muted text-muted-foreground">
                      {columnTasks.length}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-2">
                  {columnTasks.length === 0 && (
                    <div className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
                      No tasks match this view.
                    </div>
                  )}

                  {columnTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onEdit={openEditDialog}
                      onDelete={handleDeleteTask}
                      onDragStart={handleTaskDragStart}
                    />
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </section>
      )}

      {view === "notes" && (
        <Card className="border-border/70 bg-card/80">
          <CardHeader>
            <CardTitle className="text-xl">Project Notes</CardTitle>
            <CardDescription>
              Use this space for ideas, meeting notes, and quick checklists.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              className="min-h-[62vh] leading-relaxed"
              placeholder="Write your project notes here..."
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTaskId ? "Edit Task" : "Add Task"}</DialogTitle>
            <DialogDescription>
              Track status, ownership, and delivery details in one place.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveTask} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="space-y-1 sm:col-span-2">
              <span className="text-xs text-muted-foreground">Title</span>
              <Input
                name="title"
                required
                maxLength={80}
                value={formValues.title}
                onChange={handleFieldChange}
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Assignee</span>
              <Input
                name="assignee"
                maxLength={40}
                value={formValues.assignee}
                onChange={handleFieldChange}
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Due Date</span>
              <Input
                type="date"
                name="dueDate"
                value={formValues.dueDate}
                onChange={handleFieldChange}
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Priority</span>
              <select
                name="priority"
                className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={formValues.priority}
                onChange={handleFieldChange}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Status</span>
              <select
                name="status"
                className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={formValues.status}
                onChange={handleFieldChange}
              >
                <option value="backlog">Backlog</option>
                <option value="in-progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
            </label>

            <label className="space-y-1 sm:col-span-2">
              <span className="text-xs text-muted-foreground">Tags (comma separated)</span>
              <Input
                name="tags"
                placeholder="frontend, urgent, customer"
                value={formValues.tags}
                onChange={handleFieldChange}
              />
            </label>

            <label className="space-y-1 sm:col-span-2">
              <span className="text-xs text-muted-foreground">Description</span>
              <Textarea
                name="description"
                rows={4}
                maxLength={600}
                value={formValues.description}
                onChange={handleFieldChange}
              />
            </label>

            <DialogFooter className="sm:col-span-2">
              {editingTaskId ? (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    handleDeleteTask(editingTaskId);
                    setDialogOpen(false);
                  }}
                >
                  Delete
                </Button>
              ) : (
                <span />
              )}
              <Button type="submit">Save Task</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}

export default App;
