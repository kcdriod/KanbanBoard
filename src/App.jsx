import { memo, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import {
  Bold,
  Code2,
  Copy,
  FilePlus2,
  Heading1,
  KanbanSquare,
  Link2,
  List,
  ListOrdered,
  Pin,
  PinOff,
  NotebookPen,
  Plus,
  Quote,
  Search,
  Settings2,
  CalendarDays,
  UserRound,
  Tag,
  Trash2,
  Moon,
  Sun,
  ExternalLink
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const TASKS_STORAGE_KEY = "kanban.board.v1";
const NOTES_STORAGE_KEY = "kanban.notes.v1";
const WORKSPACE_STORAGE_KEY = "kanban.workspace.v1";
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

const TASK_CARD_TYPE_OPTIONS = [
  { id: "basic", label: "Basic" },
  { id: "checklist", label: "Checklist" },
  { id: "deadline", label: "Deadline" },
  { id: "recurring", label: "Recurring" },
  { id: "priority", label: "Priority Matrix" }
];

const STATUS_CARD_TYPE = {
  backlog: "priority",
  "in-progress": "deadline",
  review: "checklist",
  done: "checklist"
};

const STATUS_PROGRESS = {
  backlog: 20,
  "in-progress": 55,
  review: 80,
  done: 100
};

const MotionCard = motion.create(Card);
const easeOut = [0.22, 1, 0.36, 1];
const springLayout = { type: "spring", stiffness: 500, damping: 36, mass: 0.7 };

const blankForm = {
  title: "",
  description: "",
  priority: "medium",
  status: "backlog",
  cardType: "basic",
  checklistText: "",
  deadlineNote: "",
  recurrenceRule: "weekly",
  matrixAction: "do",
  assignee: "",
  dueDate: "",
  tags: ""
};

const blankProjectForm = {
  name: "",
  description: "",
  type: "personal",
  useTemplate: true
};

const PROJECT_TYPE_OPTIONS = [
  { id: "personal", label: "Personal" },
  { id: "home", label: "Home" },
  { id: "work", label: "Work" },
  { id: "learning", label: "Learning" },
  { id: "custom", label: "Custom" }
];

const RESOURCE_KIND_LABEL = {
  youtube: "YouTube",
  material: "Material",
  link: "Link"
};

const PROJECT_TEMPLATES = {
  personal: {
    description: "Personal goals, routines, appointments, and errands.",
    tasks: [
      {
        title: "Book a haircut appointment",
        description: "Find a nearby salon and reserve a convenient time slot.",
        status: "backlog",
        priority: "medium",
        cardType: "checklist",
        tags: ["self-care", "appointment"]
      },
      {
        title: "Weekly fitness plan",
        description: "Plan 3 sessions and prepare gear in advance.",
        status: "in-progress",
        priority: "medium",
        cardType: "recurring",
        tags: ["health", "routine"]
      }
    ],
    noteContent:
      "# Personal Planner\n\n## This week\n- Appointments\n- Priorities\n- Follow-ups\n\n## Notes\n- Keep quick reminders here.\n",
    resources: []
  },
  home: {
    description: "Home projects, repairs, purchases, and maintenance.",
    tasks: [
      {
        title: "Kitchen shelf repair",
        description: "Measure, buy brackets, and schedule installation.",
        status: "backlog",
        priority: "high",
        cardType: "deadline",
        tags: ["repair", "home"]
      },
      {
        title: "Organize storage materials",
        description: "Sort tools, labels, and unused items.",
        status: "review",
        priority: "low",
        cardType: "basic",
        tags: ["storage", "materials"]
      }
    ],
    noteContent:
      "# Home Plan\n\n## Ongoing\n- Maintenance schedule\n- Materials to buy\n\n## Budget\n- Keep cost notes and receipts.\n",
    resources: [
      {
        title: "Home Depot Materials List",
        url: "https://www.homedepot.com/",
        kind: "material",
        description: "Quick access for supplies and prices."
      }
    ]
  },
  work: {
    description: "Projects, deadlines, and team deliverables.",
    tasks: [
      {
        title: "Define monthly goals",
        description: "Set priority outcomes and owners.",
        status: "backlog",
        priority: "high",
        cardType: "priority",
        tags: ["planning", "goals"]
      },
      {
        title: "Share weekly status update",
        description: "Publish highlights, blockers, and next actions.",
        status: "in-progress",
        priority: "medium",
        cardType: "recurring",
        tags: ["team", "update"]
      }
    ],
    noteContent:
      "# Work Planner\n\n## Priorities\n- Top outcomes this week\n\n## Risks\n- Dependencies and blockers\n",
    resources: []
  },
  learning: {
    description: "Courses, tutorials, references, and practice tasks.",
    tasks: [
      {
        title: "Watch one tutorial and take notes",
        description: "Capture key ideas and next practice step.",
        status: "backlog",
        priority: "medium",
        cardType: "checklist",
        tags: ["tutorial", "study"]
      },
      {
        title: "Practice project checkpoint",
        description: "Build a small milestone based on what you learned.",
        status: "in-progress",
        priority: "high",
        cardType: "deadline",
        tags: ["practice", "project"]
      }
    ],
    noteContent:
      "# Learning Hub\n\n## Topics\n- Concepts to review\n- Practice goals\n\n## Reflection\n- What worked and what to revisit.\n",
    resources: [
      {
        title: "YouTube Learning Playlist",
        url: "https://www.youtube.com/",
        kind: "youtube",
        description: "Save tutorials and walkthroughs."
      }
    ]
  },
  custom: {
    description: "",
    tasks: [],
    noteContent:
      "# Plan Notes\n\n## Highlights\n- Keep important updates here\n\n## Next Steps\n- [ ] Add your first actions\n",
    resources: []
  }
};

function createNote(overrides = {}) {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title: "Untitled note",
    content: "",
    tags: [],
    linkPreviews: [],
    pinned: false,
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

function buildInitialNotesState(projectName = "Plan") {
  const starter = createNote({
    title: `${projectName} Notes`,
    content:
      `# ${projectName} Notes\n\n## Highlights\n- Capture updates and ideas\n- Track blockers and decisions\n\n## Next Actions\n- [ ] Add top priorities\n- [ ] Add follow-up notes\n`
  });

  return {
    notes: [starter],
    activeNoteId: starter.id
  };
}

function resolveProjectType(value) {
  return PROJECT_TYPE_OPTIONS.some((option) => option.id === value) ? value : "custom";
}

function detectResourceKind(url) {
  const normalized = String(url || "").toLowerCase();
  if (normalized.includes("youtube.com") || normalized.includes("youtu.be")) return "youtube";
  if (
    normalized.includes("drive.google.com") ||
    normalized.includes("dropbox.com") ||
    normalized.includes("docs.google.com") ||
    normalized.includes("notion.so")
  ) {
    return "material";
  }
  return "link";
}

function extractYouTubeVideoId(url) {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return parsed.pathname.slice(1);
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (parsed.pathname === "/watch") return parsed.searchParams.get("v") || "";
      const match = parsed.pathname.match(/^\/(embed|shorts)\/([^/?#]+)/);
      return match?.[2] || "";
    }
  } catch {
    return "";
  }
  return "";
}

function fallbackThumbnailForUrl(url, kind) {
  if (!url) return "";
  if (kind === "youtube") {
    const videoId = extractYouTubeVideoId(url);
    if (videoId) return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  }
  return `https://image.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url`;
}

async function resolveResourceMetadata(url, explicitKind = "auto") {
  const normalizedUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  const detectedKind = explicitKind === "auto" ? detectResourceKind(normalizedUrl) : explicitKind;
  const fallbackThumb = fallbackThumbnailForUrl(normalizedUrl, detectedKind);

  if (detectedKind === "youtube") {
    const videoId = extractYouTubeVideoId(normalizedUrl);
    return {
      kind: "youtube",
      thumbnail: videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : fallbackThumb,
      title: "",
      description: ""
    };
  }

  try {
    const response = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(normalizedUrl)}`);
    const payload = await response.json();
    const data = payload?.data || {};
    return {
      kind: detectedKind,
      thumbnail: data?.image?.url || data?.logo?.url || fallbackThumb,
      title: typeof data?.title === "string" ? data.title : "",
      description: typeof data?.description === "string" ? data.description : ""
    };
  } catch {
    return {
      kind: detectedKind,
      thumbnail: fallbackThumb,
      title: "",
      description: ""
    };
  }
}

function normalizeResource(resource, index = 0) {
  const rawUrl = typeof resource?.url === "string" ? resource.url.trim() : "";
  const url =
    rawUrl && !/^https?:\/\//i.test(rawUrl)
      ? `https://${rawUrl}`
      : rawUrl;
  const detectedKind = detectResourceKind(url);
  const kind = ["youtube", "material", "link"].includes(resource?.kind) ? resource.kind : detectedKind;

  return {
    id: typeof resource?.id === "string" && resource.id ? resource.id : crypto.randomUUID(),
    title:
      typeof resource?.title === "string" && resource.title.trim()
        ? resource.title.trim()
        : `Resource ${index + 1}`,
    url,
    kind,
    thumbnail:
      typeof resource?.thumbnail === "string" && resource.thumbnail.trim()
        ? resource.thumbnail.trim()
        : fallbackThumbnailForUrl(url, kind),
    description: typeof resource?.description === "string" ? resource.description : "",
    createdAt: Number.isFinite(resource?.createdAt) ? resource.createdAt : Date.now() - index
  };
}

function normalizeResources(source) {
  if (!Array.isArray(source)) return [];
  return source
    .filter(Boolean)
    .map((resource, index) => normalizeResource(resource, index))
    .filter((resource) => resource.url);
}

function getTemplateForProjectType(type) {
  return PROJECT_TEMPLATES[resolveProjectType(type)] ?? PROJECT_TEMPLATES.custom;
}

function createStarterNoteState(name, type) {
  const template = getTemplateForProjectType(type);
  const starter = createNote({
    title: `${name} Notes`,
    content: template.noteContent || `# ${name}\n\nStart writing your notes here.\n`
  });
  return { notes: [starter], activeNoteId: starter.id };
}

function seedTasks() {
  const now = Date.now();
  return [
    {
      id: crypto.randomUUID(),
      title: "Book haircut appointment",
      description: "Shortlist nearby salons and reserve a time.",
      status: "backlog",
      priority: "medium",
      cardType: "checklist",
      cardMeta: {
        deadlineNote: "",
        recurrenceRule: "weekly",
        matrixAction: "do",
        checklistItems: [
          { id: crypto.randomUUID(), label: "Check availability", done: true },
          { id: crypto.randomUUID(), label: "Confirm appointment time", done: false }
        ]
      },
      assignee: "",
      dueDate: "",
      tags: ["personal", "appointment"],
      createdAt: now - 10000
    },
    {
      id: crypto.randomUUID(),
      title: "Plan home shelf repair",
      description: "Measure wall space and buy required materials.",
      status: "in-progress",
      priority: "high",
      cardType: "deadline",
      cardMeta: {
        deadlineNote: "Weekend target",
        recurrenceRule: "none",
        matrixAction: "schedule",
        checklistItems: [
          { id: crypto.randomUUID(), label: "Measure wall", done: true },
          { id: crypto.randomUUID(), label: "Buy materials", done: false },
          { id: crypto.randomUUID(), label: "Install shelf", done: false }
        ]
      },
      assignee: "",
      dueDate: "",
      tags: ["home", "repair"],
      createdAt: now - 9000
    },
    {
      id: crypto.randomUUID(),
      title: "Save tutorial resources",
      description: "Collect useful videos and notes for learning.",
      status: "review",
      priority: "medium",
      cardType: "priority",
      cardMeta: {
        deadlineNote: "",
        recurrenceRule: "weekly",
        matrixAction: "do",
        checklistItems: [
          { id: crypto.randomUUID(), label: "YouTube tutorial", done: true },
          { id: crypto.randomUUID(), label: "Material checklist", done: true },
          { id: crypto.randomUUID(), label: "Practice notes", done: false }
        ]
      },
      assignee: "",
      dueDate: "",
      tags: ["learning", "tutorial"],
      createdAt: now - 8000
    }
  ];
}

function resolveTaskCardType(cardType, status, index = 0) {
  if (TASK_CARD_TYPE_OPTIONS.some((option) => option.id === cardType)) return cardType;
  return STATUS_CARD_TYPE[status] ?? TASK_CARD_TYPE_OPTIONS[index % TASK_CARD_TYPE_OPTIONS.length].id;
}

function clampProgress(value, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function parseChecklistText(text) {
  if (typeof text !== "string") return [];
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      let label = line;
      let done = false;

      if (/^\[(x|X)\]\s*/.test(label)) {
        done = true;
        label = label.replace(/^\[(x|X)\]\s*/, "");
      } else if (/^\[\s\]\s*/.test(label)) {
        label = label.replace(/^\[\s\]\s*/, "");
      } else if (/^x\s+/i.test(label)) {
        done = true;
        label = label.replace(/^x\s+/i, "");
      }

      return { id: crypto.randomUUID(), label: label.trim(), done };
    })
    .filter((item) => item.label);
}

function checklistTextFromItems(items = []) {
  return items
    .map((item) => `${item.done ? "[x]" : "[ ]"} ${item.label}`)
    .join("\n");
}

function normalizeCardMeta(source, status, tags = []) {
  const rawItems = Array.isArray(source?.checklistItems)
    ? source.checklistItems
    : parseChecklistText(typeof source?.checklistText === "string" ? source.checklistText : "");

  const checklistItems =
    rawItems.length > 0
      ? rawItems
          .map((item) => {
            if (typeof item === "string") {
              return { id: crypto.randomUUID(), label: item.trim(), done: false };
            }
            const label = typeof item?.label === "string" ? item.label.trim() : "";
            if (!label) return null;
            return {
              id: typeof item?.id === "string" && item.id ? item.id : crypto.randomUUID(),
              label,
              done: Boolean(item?.done)
            };
          })
          .filter(Boolean)
      : tags.slice(0, 3).map((tag) => ({ id: crypto.randomUUID(), label: tag, done: false }));

  const matrixAction = ["do", "schedule", "delegate", "drop"].includes(source?.matrixAction)
    ? source.matrixAction
    : "do";
  const recurrenceRule = ["none", "daily", "weekly", "monthly"].includes(source?.recurrenceRule)
    ? source.recurrenceRule
    : "none";

  return {
    deadlineNote:
      typeof source?.deadlineNote === "string"
        ? source.deadlineNote
        : typeof source?.progressMilestone === "string"
          ? source.progressMilestone
          : "",
    recurrenceRule,
    matrixAction,
    checklistItems
  };
}

function normalizeTask(task, index) {
  const fallbackStatus = "backlog";
  const fallbackPriority = "medium";
  const now = Date.now();
  const normalizedStatus = STATUSES.some((status) => status.id === task?.status) ? task.status : fallbackStatus;
  const tags = Array.isArray(task?.tags) ? task.tags.map((tag) => String(tag).trim()).filter(Boolean) : [];

  return {
    id: typeof task?.id === "string" && task.id ? task.id : crypto.randomUUID(),
    title:
      typeof task?.title === "string" && task.title.trim() ? task.title.trim() : `Item ${index + 1}`,
    description: typeof task?.description === "string" ? task.description : "",
    status: normalizedStatus,
    priority: Object.hasOwn(priorityClass, task?.priority) ? task.priority : fallbackPriority,
    cardType: resolveTaskCardType(task?.cardType, normalizedStatus, index),
    cardMeta: normalizeCardMeta(task?.cardMeta, normalizedStatus, tags),
    assignee: typeof task?.assignee === "string" ? task.assignee : "",
    dueDate: typeof task?.dueDate === "string" ? task.dueDate : "",
    tags,
    createdAt: Number.isFinite(task?.createdAt) ? task.createdAt : now - index
  };
}

function normalizeTasks(source, fallback = []) {
  if (!Array.isArray(source)) return fallback;
  return source.filter(Boolean).map((task, index) => normalizeTask(task, index));
}

function normalizeNotesState(source, projectName = "Plan") {
  const fallback = buildInitialNotesState(projectName);

  if (source == null) return fallback;

  if (typeof source === "string") {
    const migrated = createNote({
      title: `${projectName} Notes`,
      content: source
    });
    return { notes: [migrated], activeNoteId: migrated.id };
  }

  if (Array.isArray(source)) {
    const migratedArray = source
      .filter(Boolean)
      .map((note, index) =>
        createNote({
          title:
            typeof note?.title === "string" && note.title.trim() ? note.title.trim() : `Note ${index + 1}`,
          content: typeof note?.content === "string" ? note.content : "",
          tags: Array.isArray(note?.tags) ? note.tags.map((tag) => String(tag).trim()).filter(Boolean) : [],
          linkPreviews: normalizeResources(note?.linkPreviews ?? note?.resources ?? []),
          pinned: Boolean(note?.pinned),
          createdAt: Number.isFinite(note?.createdAt) ? note.createdAt : Date.now() - index,
          updatedAt: Number.isFinite(note?.updatedAt) ? note.updatedAt : Date.now() - index
        })
      );
    if (migratedArray.length === 0) return fallback;
    return { notes: migratedArray, activeNoteId: migratedArray[0].id };
  }

  if (typeof source === "object" && Array.isArray(source.notes)) {
    const migratedNotes = source.notes
      .filter(Boolean)
      .map((note, index) =>
        createNote({
          id: typeof note?.id === "string" && note.id ? note.id : crypto.randomUUID(),
          title:
            typeof note?.title === "string" && note.title.trim() ? note.title.trim() : `Note ${index + 1}`,
          content: typeof note?.content === "string" ? note.content : "",
          tags: Array.isArray(note?.tags) ? note.tags.map((tag) => String(tag).trim()).filter(Boolean) : [],
          linkPreviews: normalizeResources(note?.linkPreviews ?? note?.resources ?? []),
          pinned: Boolean(note?.pinned),
          createdAt: Number.isFinite(note?.createdAt) ? note.createdAt : Date.now() - index,
          updatedAt: Number.isFinite(note?.updatedAt) ? note.updatedAt : Date.now() - index
        })
      );

    if (migratedNotes.length === 0) return fallback;

    const hasActiveId = migratedNotes.some((note) => note.id === source.activeNoteId);
    return {
      notes: migratedNotes,
      activeNoteId: hasActiveId ? source.activeNoteId : migratedNotes[0].id
    };
  }

  return fallback;
}

function createProject(overrides = {}) {
  const now = Date.now();
  const name = typeof overrides.name === "string" && overrides.name.trim() ? overrides.name.trim() : "Untitled Plan";
  const description = typeof overrides.description === "string" ? overrides.description : "";
  const type = resolveProjectType(overrides.type);

  return {
    id: typeof overrides.id === "string" && overrides.id ? overrides.id : crypto.randomUUID(),
    name,
    description,
    type,
    tasks: normalizeTasks(overrides.tasks),
    notesState: normalizeNotesState(overrides.notesState, name),
    resources: normalizeResources(overrides.resources),
    createdAt: Number.isFinite(overrides.createdAt) ? overrides.createdAt : now,
    updatedAt: Number.isFinite(overrides.updatedAt) ? overrides.updatedAt : now
  };
}

function buildFallbackWorkspace() {
  let legacyTasks = seedTasks();
  let legacyNotesState = buildInitialNotesState("My Planner");
  try {
    const rawTasks = localStorage.getItem(TASKS_STORAGE_KEY);
    if (rawTasks) {
      const parsedTasks = JSON.parse(rawTasks);
      legacyTasks = normalizeTasks(parsedTasks, seedTasks());
    }
  } catch {
    legacyTasks = seedTasks();
  }

  try {
    const rawNotes = localStorage.getItem(NOTES_STORAGE_KEY);
    if (rawNotes) {
      const parsedNotes = JSON.parse(rawNotes);
      legacyNotesState = normalizeNotesState(parsedNotes, "My Planner");
    }
  } catch {
    legacyNotesState = buildInitialNotesState("My Planner");
  }

  const legacyProject = createProject({
    name: "My Planner",
    type: "custom",
    description: "Migrated from your existing board.",
    tasks: legacyTasks,
    notesState: legacyNotesState,
    resources: []
  });

  return {
    projects: [legacyProject],
    activeProjectId: legacyProject.id
  };
}

function loadWorkspace() {
  const fallback = buildFallbackWorkspace();

  try {
    const raw = localStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.projects)) return fallback;

    const projects = parsed.projects
      .filter(Boolean)
      .map((project, index) =>
        createProject({
          ...project,
          name:
            typeof project?.name === "string" && project.name.trim() ? project.name.trim() : `Project ${index + 1}`,
          description: typeof project?.description === "string" ? project.description : ""
        })
      );

    if (projects.length === 0) return fallback;

    const hasActiveId = projects.some((project) => project.id === parsed.activeProjectId);
    return {
      projects,
      activeProjectId: hasActiveId ? parsed.activeProjectId : projects[0].id
    };
  } catch {
    return fallback;
  }
}

function loadView() {
  const value = localStorage.getItem(VIEW_STORAGE_KEY);
  if (value === "notes") return value;
  return "board";
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

function formatLastSaved(value) {
  return value.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function formatNoteTimestamp(value) {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function estimateReadingTime(wordCount) {
  if (wordCount <= 0) return "0 min read";
  const minutes = Math.max(1, Math.round(wordCount / 200));
  return `${minutes} min read`;
}

function extractUrlsFromText(text) {
  if (!text) return [];
  const matches = text.match(/https?:\/\/[^\s)]+/g) || [];
  return [...new Set(matches.map((url) => url.trim().replace(/[.,;!?]+$/, "")))];
}

const TaskItem = memo(function TaskItem({
  task,
  index,
  isDragging,
  onEdit,
  onDelete,
  onDragStart,
  onDragEnd
}) {
  const delay = Math.min(index * 0.03, 0.15);
  const cardTypeLabel =
    TASK_CARD_TYPE_OPTIONS.find((option) => option.id === task.cardType)?.label ?? "Basic";
  const deadlineNote = task.cardMeta.deadlineNote || "No extra deadline note.";
  const recurrenceRule = task.cardMeta.recurrenceRule || "none";
  const matrixAction = task.cardMeta.matrixAction || "do";
  const checklistItems =
    task.cardMeta.checklistItems.length > 0
      ? task.cardMeta.checklistItems
      : [
          { id: `${task.id}-plan`, label: "Plan", done: false },
          { id: `${task.id}-build`, label: "Build", done: false },
          { id: `${task.id}-review`, label: "Review", done: false }
        ];
  const doneCount = checklistItems.filter((item) => task.status === "done" || item.done).length;
  const checklistPercent = checklistItems.length > 0 ? Math.round((doneCount / checklistItems.length) * 100) : 0;
  const checklistVisibleItems = checklistItems.slice(0, 4);

  const cardTypeClass = {
    basic: "task-card-classic",
    deadline: "task-card-progress",
    recurring: "task-card-focus",
    priority: "task-card-checklist",
    checklist: "task-card-checklist"
  };

  return (
    <MotionCard
      draggable
      aria-grabbed={isDragging}
      onDragStart={(event) => onDragStart(event, task.id)}
      onDragEnd={onDragEnd}
      layout
      layoutId={`task-${task.id}`}
      initial={false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        layout: springLayout,
        default: { duration: 0.18, ease: easeOut, delay }
      }}
      whileHover={
        isDragging
          ? undefined
          : { y: -2, boxShadow: "0 14px 24px -14px rgba(16, 24, 40, 0.62)" }
      }
      whileTap={{ scale: 0.995 }}
      className={cn(
        "kanban-task border-border/80 bg-background/82",
        cardTypeClass[task.cardType] ?? cardTypeClass.classic,
        isDragging && "is-dragging border-primary/50"
      )}
    >
      <CardHeader className="space-y-2 pb-2">
        <div className="flex items-center justify-between gap-2">
          <Badge className="border-border/70 bg-background/75 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            {cardTypeLabel}
          </Badge>
          <Badge className={cn("uppercase", priorityClass[task.priority])}>{task.priority}</Badge>
        </div>
        <CardTitle className="text-sm leading-snug">{task.title}</CardTitle>
        {task.description && (
          <CardDescription className="line-clamp-3 text-xs leading-relaxed">
            {task.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {task.cardType === "deadline" && (
          <div className="space-y-1 rounded-md border border-primary/30 bg-primary/10 px-2.5 py-2 text-[11px]">
            <p className="font-semibold text-primary">Target: {formatDueDate(task.dueDate)}</p>
            <p className="text-muted-foreground">{deadlineNote}</p>
          </div>
        )}

        {task.cardType === "recurring" && (
          <div className="space-y-1 rounded-md border border-border/70 bg-background/45 px-2.5 py-2">
            <p className="text-[11px] font-semibold text-primary">Repeats: {recurrenceRule}</p>
            <p className="line-clamp-1 text-[11px] text-muted-foreground">Use this for routines and recurring chores.</p>
          </div>
        )}

        {task.cardType === "priority" && (
          <div className="space-y-1 rounded-md border border-border/70 bg-background/45 px-2.5 py-2">
            <p className="text-[11px] font-semibold text-primary">Eisenhower action: {matrixAction}</p>
            <p className="line-clamp-1 text-[11px] text-muted-foreground">
              {matrixAction === "do"
                ? "Urgent and important."
                : matrixAction === "schedule"
                  ? "Important, but not urgent."
                  : matrixAction === "delegate"
                    ? "Urgent, but can be delegated."
                    : "Neither urgent nor important."}
            </p>
          </div>
        )}

        {task.cardType === "checklist" && (
          <div className="space-y-2 rounded-md border border-border/70 bg-background/45 px-2.5 py-2">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Checklist</span>
              <span>{doneCount}/{checklistItems.length} done</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${checklistPercent}%` }}
              />
            </div>
            {checklistVisibleItems.map((item) => {
              const isDone = task.status === "done" || item.done;
              return (
                <div key={item.id} className="flex items-center gap-2 rounded-sm px-1 py-0.5 text-xs">
                  <span
                    className={cn(
                      "inline-flex h-4 w-4 items-center justify-center rounded-[4px] border text-[10px] font-semibold",
                      isDone
                        ? "border-primary/70 bg-primary/20 text-primary"
                        : "border-border/80 bg-background text-muted-foreground"
                    )}
                  >
                    {isDone ? "x" : ""}
                  </span>
                  <span className={cn("line-clamp-1", isDone && "text-muted-foreground line-through")}>
                    {item.label}
                  </span>
                </div>
              );
            })}
            {checklistItems.length > checklistVisibleItems.length && (
              <p className="text-[11px] text-muted-foreground">
                +{checklistItems.length - checklistVisibleItems.length} more
              </p>
            )}
          </div>
        )}

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
    </MotionCard>
  );
});

function App() {
  const [workspace, setWorkspace] = useState(loadWorkspace);
  const [view, setView] = useState(loadView);
  const [theme, setTheme] = useState(loadTheme);
  const [searchText, setSearchText] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [noteSearchText, setNoteSearchText] = useState("");
  const [dragOverStatus, setDragOverStatus] = useState("");
  const [draggedTaskId, setDraggedTaskId] = useState("");
  const [dropPulseStatus, setDropPulseStatus] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(() => new Date());

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [formValues, setFormValues] = useState(blankForm);
  const [checklistDraft, setChecklistDraft] = useState([]);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [projectDialogMode, setProjectDialogMode] = useState("create");
  const [projectFormValues, setProjectFormValues] = useState(blankProjectForm);
  const notesEditorRef = useRef(null);
  const deferredSearchText = useDeferredValue(searchText);

  const activeProject = useMemo(() => {
    if (workspace.projects.length === 0) return null;
    return (
      workspace.projects.find((project) => project.id === workspace.activeProjectId) ?? workspace.projects[0]
    );
  }, [workspace]);

  const tasks = activeProject?.tasks ?? [];
  const notesState = activeProject?.notesState ?? { notes: [], activeNoteId: "" };
  const totalNoteLinks = useMemo(
    () =>
      notesState.notes.reduce((total, note) => total + ((Array.isArray(note.linkPreviews) ? note.linkPreviews.length : 0)), 0),
    [notesState.notes]
  );

  useEffect(() => {
    localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(workspace));
  }, [workspace]);

  useEffect(() => {
    if (!activeProject) return;
    setIsSavingNotes(true);
    const handle = window.setTimeout(() => {
      setIsSavingNotes(false);
      setLastSavedAt(new Date());
    }, 240);
    return () => window.clearTimeout(handle);
  }, [notesState, activeProject]);

  useEffect(() => {
    localStorage.setItem(VIEW_STORAGE_KEY, view);
  }, [view]);

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    if (!dropPulseStatus) return;
    const timeout = window.setTimeout(() => setDropPulseStatus(""), 320);
    return () => window.clearTimeout(timeout);
  }, [dropPulseStatus]);

  const patchActiveProject = useCallback((updater) => {
    setWorkspace((current) => {
      if (current.projects.length === 0) return current;

      const fallbackId = current.projects[0].id;
      const activeId = current.projects.some((project) => project.id === current.activeProjectId)
        ? current.activeProjectId
        : fallbackId;

      return {
        ...current,
        activeProjectId: activeId,
        projects: current.projects.map((project) => {
          if (project.id !== activeId) return project;
          const nextProject = updater(project) ?? project;
          return {
            ...nextProject,
            updatedAt: Date.now()
          };
        })
      };
    });
  }, []);

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

  const activeNote = useMemo(
    () => notesState.notes.find((note) => note.id === notesState.activeNoteId) ?? null,
    [notesState]
  );

  const filteredNotes = useMemo(() => {
    const query = noteSearchText.trim().toLowerCase();
    return [...notesState.notes]
      .filter((note) => {
        if (!query) return true;
        const haystack = [note.title, note.content, note.tags.join(" ")].join(" ").toLowerCase();
        return haystack.includes(query);
      })
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return b.updatedAt - a.updatedAt;
      });
  }, [notesState.notes, noteSearchText]);

  const noteMetrics = useMemo(() => {
    if (!activeNote) return { words: 0, characters: 0, readTime: "0 min read" };
    const content = activeNote.content;
    const words = (content.trim().match(/\b[\w'-]+\b/g) || []).length;
    return {
      words,
      characters: content.length,
      readTime: estimateReadingTime(words)
    };
  }, [activeNote]);

  const activeNotePreviews = useMemo(() => {
    if (!activeNote) return [];
    const query = noteSearchText.trim().toLowerCase();
    const list = Array.isArray(activeNote.linkPreviews) ? activeNote.linkPreviews : [];
    return list.filter((item) => {
      if (!query) return true;
      const haystack = [item.title, item.url, item.description].join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }, [activeNote, noteSearchText]);

  const openCreateProjectDialog = useCallback(() => {
    setProjectDialogMode("create");
    setProjectFormValues(blankProjectForm);
    setProjectDialogOpen(true);
  }, []);

  const openEditProjectDialog = useCallback(() => {
    if (!activeProject) return;
    setProjectDialogMode("edit");
    setProjectFormValues({
      name: activeProject.name,
      description: activeProject.description,
      type: activeProject.type ?? "custom",
      useTemplate: false
    });
    setProjectDialogOpen(true);
  }, [activeProject]);

  const openCreateDialog = useCallback(() => {
    setEditingTaskId(null);
    setFormValues(blankForm);
    setChecklistDraft([]);
    setDialogOpen(true);
  }, []);

  const openCreateDialogForStatus = useCallback((status) => {
    const nextCardType = resolveTaskCardType("", status);
    const nextChecklistText =
      nextCardType === "checklist"
        ? "[ ] Plan steps\n[ ] Complete action\n[ ] Review result"
        : "";
    setEditingTaskId(null);
    setFormValues({
      ...blankForm,
      status,
      cardType: nextCardType,
      checklistText: nextChecklistText,
      recurrenceRule: nextCardType === "recurring" ? "weekly" : "none",
      matrixAction: nextCardType === "priority" ? "do" : "schedule"
    });
    setChecklistDraft(parseChecklistText(nextChecklistText));
    setDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((task) => {
    const nextChecklistText = checklistTextFromItems(task.cardMeta.checklistItems);
    setEditingTaskId(task.id);
    setFormValues({
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      cardType: task.cardType,
      checklistText: nextChecklistText,
      deadlineNote: task.cardMeta.deadlineNote ?? "",
      recurrenceRule: task.cardMeta.recurrenceRule ?? "none",
      matrixAction: task.cardMeta.matrixAction ?? "do",
      assignee: task.assignee,
      dueDate: task.dueDate,
      tags: task.tags.join(", ")
    });
    setChecklistDraft(
      (task.cardMeta.checklistItems ?? []).map((item) => ({
        id: item.id || crypto.randomUUID(),
        label: item.label ?? "",
        done: Boolean(item.done)
      }))
    );
    setDialogOpen(true);
  }, []);

  const handleProjectFieldChange = useCallback((event) => {
    const { name, value, type, checked } = event.target;
    setProjectFormValues((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }, []);

  const handleSaveProject = useCallback(
    (event) => {
      event.preventDefault();
      const name = projectFormValues.name.trim();
      if (!name) return;
      const chosenType = resolveProjectType(projectFormValues.type);
      const template = getTemplateForProjectType(chosenType);
      const fallbackDescription = projectFormValues.useTemplate ? template.description : "";
      const description = projectFormValues.description.trim() || fallbackDescription;

      if (projectDialogMode === "create") {
        const tasks = projectFormValues.useTemplate ? normalizeTasks(template.tasks) : [];
        const notesState = projectFormValues.useTemplate
          ? createStarterNoteState(name, chosenType)
          : buildInitialNotesState(name);
        const resources = projectFormValues.useTemplate ? normalizeResources(template.resources) : [];

        const nextProject = createProject({
          name,
          description,
          type: chosenType,
          tasks,
          notesState,
          resources
        });

        setWorkspace((current) => ({
          projects: [nextProject, ...current.projects],
          activeProjectId: nextProject.id
        }));
      } else {
        patchActiveProject((project) => ({
          ...project,
          name,
          description,
          type: chosenType
        }));
      }

      setProjectDialogOpen(false);
    },
    [patchActiveProject, projectDialogMode, projectFormValues]
  );

  const handleDeleteActiveProject = useCallback(() => {
    if (!activeProject) return;

    const confirmed = window.confirm(
      `Delete plan "${activeProject.name}" and all its items, notes, and resources? This cannot be undone.`
    );
    if (!confirmed) return;

    setWorkspace((current) => {
      const remaining = current.projects.filter((project) => project.id !== activeProject.id);

      if (remaining.length === 0) {
        const fallbackProject = createProject({
          name: "New Plan",
          description: "",
          type: "custom",
          tasks: [],
          notesState: buildInitialNotesState("New Plan"),
          resources: []
        });
        return {
          projects: [fallbackProject],
          activeProjectId: fallbackProject.id
        };
      }

      const nextActiveId =
        current.activeProjectId === activeProject.id ? remaining[0].id : current.activeProjectId;

      return {
        projects: remaining,
        activeProjectId: remaining.some((project) => project.id === nextActiveId)
          ? nextActiveId
          : remaining[0].id
      };
    });
  }, [activeProject]);

  const handleSelectProject = useCallback((projectId) => {
    setWorkspace((current) => {
      if (!projectId || current.activeProjectId === projectId) return current;
      return { ...current, activeProjectId: projectId };
    });
  }, []);

  const addLinkPreviewToActiveNote = useCallback(
    async (urlInput) => {
      const rawUrl = String(urlInput || "").trim();
      if (!rawUrl || !activeNote) return;
      const normalizedUrl = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
      const meta = await resolveResourceMetadata(normalizedUrl, "auto");
      const nextPreview = normalizeResource({
        title: meta.title || normalizedUrl,
        url: normalizedUrl,
        kind: meta.kind,
        thumbnail: meta.thumbnail,
        description: meta.description
      });

      patchActiveProject((project) => {
        const activeId = project.notesState.activeNoteId;
        return {
          ...project,
          notesState: {
            ...project.notesState,
            notes: project.notesState.notes.map((note) => {
              if (note.id !== activeId) return note;
              const existing = Array.isArray(note.linkPreviews) ? note.linkPreviews : [];
              if (existing.some((preview) => preview.url === normalizedUrl)) return note;
              return {
                ...note,
                linkPreviews: [...existing, nextPreview],
                updatedAt: Date.now()
              };
            })
          }
        };
      });
    },
    [activeNote, patchActiveProject]
  );

  const removeLinkPreviewFromActiveNote = useCallback(
    (previewId) => {
      patchActiveProject((project) => {
        const activeId = project.notesState.activeNoteId;
        return {
          ...project,
          notesState: {
            ...project.notesState,
            notes: project.notesState.notes.map((note) => {
              if (note.id !== activeId) return note;
              return {
                ...note,
                linkPreviews: (note.linkPreviews ?? []).filter((preview) => preview.id !== previewId),
                updatedAt: Date.now()
              };
            })
          }
        };
      });
    },
    [patchActiveProject]
  );

  useEffect(() => {
    if (!activeNote) return;
    const urls = extractUrlsFromText(activeNote.content);
    const existing = new Set((activeNote.linkPreviews ?? []).map((preview) => preview.url));
    const missing = urls.filter((url) => !existing.has(url));
    if (missing.length === 0) return;

    let cancelled = false;
    const handle = window.setTimeout(async () => {
      for (const url of missing.slice(0, 3)) {
        if (cancelled) return;
        await addLinkPreviewToActiveNote(url);
      }
    }, 260);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [activeNote, addLinkPreviewToActiveNote]);

  const updateActiveNote = useCallback((updates) => {
    patchActiveProject((project) => {
      const activeId = project.notesState.activeNoteId;
      if (!activeId) return project;

      return {
        ...project,
        notesState: {
          ...project.notesState,
          notes: project.notesState.notes.map((note) =>
            note.id === activeId
              ? {
                  ...note,
                  ...updates,
                  updatedAt: Date.now()
                }
              : note
          )
        }
      };
    });
  }, [patchActiveProject]);

  const selectNote = useCallback((noteId) => {
    patchActiveProject((project) => ({
      ...project,
      notesState: {
        ...project.notesState,
        activeNoteId: noteId
      }
    }));
  }, [patchActiveProject]);

  const createNewNote = useCallback(() => {
    const next = createNote({
      title: `${activeProject?.name ?? "Plan"} Note`
    });
    patchActiveProject((project) => ({
      ...project,
      notesState: {
        notes: [next, ...project.notesState.notes],
        activeNoteId: next.id
      }
    }));
  }, [activeProject, patchActiveProject]);

  const duplicateActiveNote = useCallback(() => {
    if (!activeNote) return;
    const copy = createNote({
      title: `${activeNote.title} (Copy)`,
      content: activeNote.content,
      tags: [...activeNote.tags],
      pinned: false
    });
    patchActiveProject((project) => ({
      ...project,
      notesState: {
        notes: [copy, ...project.notesState.notes],
        activeNoteId: copy.id
      }
    }));
  }, [activeNote, patchActiveProject]);

  const deleteActiveNote = useCallback(() => {
    if (!activeNote) return;
    const confirmed = window.confirm(`Delete "${activeNote.title}"? This cannot be undone.`);
    if (!confirmed) return;

    patchActiveProject((project) => {
      const remaining = project.notesState.notes.filter(
        (note) => note.id !== project.notesState.activeNoteId
      );
      if (remaining.length === 0) {
        const next = createNote({
          title: `${project.name} Notes`
        });
        return {
          ...project,
          notesState: { notes: [next], activeNoteId: next.id }
        };
      }
      return {
        ...project,
        notesState: { notes: remaining, activeNoteId: remaining[0].id }
      };
    });
  }, [activeNote, patchActiveProject]);

  const togglePinned = useCallback(() => {
    if (!activeNote) return;
    updateActiveNote({ pinned: !activeNote.pinned });
  }, [activeNote, updateActiveNote]);

  const insertMarkdown = useCallback(
    (before, after = "", placeholder = "text") => {
      if (!activeNote) return;
      const textarea = notesEditorRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = activeNote.content.slice(start, end);
      const content = selected || placeholder;
      const nextValue =
        activeNote.content.slice(0, start) + before + content + after + activeNote.content.slice(end);

      updateActiveNote({ content: nextValue });

      window.requestAnimationFrame(() => {
        textarea.focus();
        const cursorStart = start + before.length;
        const cursorEnd = cursorStart + content.length;
        textarea.setSelectionRange(cursorStart, cursorEnd);
      });
    },
    [activeNote, updateActiveNote]
  );

  function handleFieldChange(event) {
    const { name, value } = event.target;
    setFormValues((current) => {
      if (name === "cardType") {
        const next = { ...current, [name]: value };
        if (value === "checklist" && !current.checklistText.trim() && current.tags.trim()) {
          const generatedChecklistText = current.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
            .map((tag) => `[ ] ${tag}`)
            .join("\n");
          next.checklistText = generatedChecklistText;
          setChecklistDraft(parseChecklistText(generatedChecklistText));
        } else if (value === "checklist" && checklistDraft.length === 0 && current.checklistText.trim()) {
          setChecklistDraft(parseChecklistText(current.checklistText));
        } else if (value !== "checklist") {
          next.checklistText = checklistTextFromItems(checklistDraft);
        }
        if (value === "recurring") next.recurrenceRule = current.recurrenceRule || "weekly";
        if (value === "priority") next.matrixAction = current.matrixAction || "do";
        if (value === "deadline" && !current.dueDate) next.dueDate = "";
        return next;
      }

      return { ...current, [name]: value };
    });
  }

  const checklistFormItems = formValues.cardType === "checklist" ? checklistDraft : [];

  const setChecklistFormItems = useCallback((items) => {
    setChecklistDraft(items);
  }, []);

  const handleChecklistItemChange = useCallback((index, updates) => {
    const nextItems = checklistFormItems.map((item, itemIndex) =>
      itemIndex === index ? { ...item, ...updates } : item
    );
    setChecklistFormItems(nextItems);
  }, [checklistFormItems, setChecklistFormItems]);

  const addChecklistFormItem = useCallback(() => {
    setChecklistFormItems([
      ...checklistFormItems,
      { id: crypto.randomUUID(), label: "New checklist item", done: false }
    ]);
  }, [checklistFormItems, setChecklistFormItems]);

  const removeChecklistFormItem = useCallback((index) => {
    const nextItems = checklistFormItems.filter((_, itemIndex) => itemIndex !== index);
    setChecklistFormItems(nextItems);
  }, [checklistFormItems, setChecklistFormItems]);

  function handleSaveTask(event) {
    event.preventDefault();
    const title = formValues.title.trim();
    if (!title) return;

    const parsedTags = formValues.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    const normalizedStatus = formValues.status;
    const normalizedCardType = resolveTaskCardType(formValues.cardType, normalizedStatus);
    const checklistItems =
      normalizedCardType === "checklist"
        ? checklistDraft
            .map((item) => ({
              id: item.id || crypto.randomUUID(),
              label: String(item.label || "").trim(),
              done: Boolean(item.done)
            }))
            .filter((item) => item.label)
        : parseChecklistText(formValues.checklistText);

    const payload = {
      title,
      description: formValues.description.trim(),
      priority: formValues.priority,
      status: normalizedStatus,
      cardType: normalizedCardType,
      cardMeta: {
        deadlineNote: formValues.deadlineNote.trim(),
        recurrenceRule: formValues.recurrenceRule,
        matrixAction: formValues.matrixAction,
        checklistItems:
          checklistItems.length > 0
            ? checklistItems
            : parsedTags.slice(0, 3).map((tag) => ({ id: crypto.randomUUID(), label: tag, done: false }))
      },
      assignee: formValues.assignee.trim(),
      dueDate: formValues.dueDate,
      tags: parsedTags
    };

    if (editingTaskId) {
      patchActiveProject((project) => ({
        ...project,
        tasks: project.tasks.map((task) => (task.id === editingTaskId ? { ...task, ...payload } : task))
      }));
    } else {
      patchActiveProject((project) => ({
        ...project,
        tasks: [
          {
            id: crypto.randomUUID(),
            createdAt: Date.now(),
            ...payload
          },
          ...project.tasks
        ]
      }));
    }

    setDialogOpen(false);
  }

  const handleDeleteTask = useCallback((taskId) => {
    patchActiveProject((project) => ({
      ...project,
      tasks: project.tasks.filter((task) => task.id !== taskId)
    }));
  }, [patchActiveProject]);

  const handleDrop = useCallback((status, event) => {
    event.preventDefault();
    const taskId = event.dataTransfer.getData("text/task-id");
    if (!taskId) return;

    patchActiveProject((project) => ({
      ...project,
      tasks: project.tasks.map((task) => (task.id === taskId ? { ...task, status } : task))
    }));
    setDraggedTaskId("");
    setDragOverStatus("");
    setDropPulseStatus(status);
  }, [patchActiveProject]);

  const handleTaskDragStart = useCallback((event, taskId) => {
    event.dataTransfer.setData("text/task-id", taskId);
    event.dataTransfer.effectAllowed = "move";
    setDraggedTaskId(taskId);
  }, []);

  const handleTaskDragEnd = useCallback(() => {
    setDraggedTaskId("");
    setDragOverStatus("");
  }, []);

  return (
    <main className="workspace-shell mx-auto w-[min(1560px,98vw)] py-4">
      <div className="workspace-layout grid grid-cols-1 gap-3 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="workspace-sidebar flex flex-col rounded-2xl border border-border/70 bg-card/85 p-3 shadow-sm lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)]">
          <div className="flex items-center gap-2 rounded-xl border border-border/65 bg-background/70 px-2.5 py-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <KanbanSquare className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">LifeFlow Planner</p>
              <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Any Plan, Any Goal</p>
            </div>
          </div>

          <Button className="mt-3 h-11 justify-start gap-2 rounded-xl" onClick={openCreateProjectDialog}>
            <Plus className="h-4 w-4" />
            New Plan
          </Button>

          <div className="mt-4">
            <p className="text-[11px] uppercase tracking-[0.13em] text-muted-foreground">Plans</p>
            <div className="mt-2 space-y-1.5 overflow-y-auto pr-1 lg:max-h-[42vh]">
              {workspace.projects.map((project) => {
                const isActive = project.id === activeProject?.id;
                return (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => handleSelectProject(project.id)}
                    className={cn(
                      "workspace-project-item w-full rounded-xl border border-border/65 bg-background/55 px-2.5 py-2 text-left transition",
                      isActive && "is-active border-primary/45 bg-primary/12"
                    )}
                  >
                    <p className="line-clamp-1 text-sm font-semibold">{project.name}</p>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span>{project.tasks.length} {project.tasks.length === 1 ? "item" : "items"}</span>
                      <span className="h-1 w-1 rounded-full bg-muted-foreground/60" />
                      <span>{PROJECT_TYPE_OPTIONS.find((option) => option.id === project.type)?.label ?? "Custom"}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4">
            <p className="text-[11px] uppercase tracking-[0.13em] text-muted-foreground">Views</p>
            <div className="mt-2 space-y-1">
              <button
                type="button"
                onClick={() => setView("board")}
                className={cn(
                  "workspace-view-switch flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm",
                  view === "board"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <KanbanSquare className="h-4 w-4" />
                Kanban
              </button>
              <button
                type="button"
                onClick={() => setView("notes")}
                className={cn(
                  "workspace-view-switch flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm",
                  view === "notes"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <NotebookPen className="h-4 w-4" />
                Notes
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="h-9 gap-1" onClick={openEditProjectDialog}>
              <Settings2 className="h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={handleDeleteActiveProject}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>

          <div className="mt-4 rounded-xl border border-dashed border-border/70 bg-background/50 p-3 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">Quick Tip</p>
            Use templates to start fast, and save links in Notes for tutorials and material lists.
          </div>
        </aside>

        <section className="workspace-main min-w-0">
          <header className="workspace-topbar mb-3 rounded-2xl border border-border/70 bg-card/82 px-4 py-3 shadow-sm">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Active Plan</p>
                <h1 className="mt-1 line-clamp-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                  {activeProject?.name ?? "LifeFlow Planner"}
                </h1>
                <p className="mt-1 line-clamp-2 max-w-3xl text-sm text-muted-foreground">
                  {activeProject?.description || "Add a short plan summary so goals stay clear and simple."}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Badge className="border-border/70 bg-secondary text-secondary-foreground">
                    {tasks.length} {tasks.length === 1 ? "Item" : "Items"}
                  </Badge>
                  <Badge className="border-border/70 bg-secondary text-secondary-foreground">
                    {tasks.filter((task) => task.status === "done").length} Done
                  </Badge>
                  <Badge className="border-border/70 bg-secondary text-secondary-foreground">
                    {notesState.notes.length} {notesState.notes.length === 1 ? "Note" : "Notes"}
                  </Badge>
                  <Badge className="border-border/70 bg-secondary text-secondary-foreground">
                    {totalNoteLinks} {totalNoteLinks === 1 ? "Link" : "Links"}
                  </Badge>
                </div>
              </div>

              <div className="flex w-full flex-wrap items-center justify-end gap-2 xl:w-auto xl:max-w-[720px]">
                <div className="relative min-w-[220px] flex-1 xl:w-[320px] xl:flex-none">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="h-9 pl-9"
                    type="search"
                    placeholder={view === "board" ? "Search items..." : "Search notes..."}
                    value={view === "board" ? searchText : noteSearchText}
                    onChange={(event) => {
                      if (view === "board") setSearchText(event.target.value);
                      else setNoteSearchText(event.target.value);
                    }}
                  />
                </div>
                {view === "board" && (
                  <>
                    <select
                      className="h-9 rounded-md border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={priorityFilter}
                      onChange={(event) => setPriorityFilter(event.target.value)}
                    >
                      <option value="all">All Priorities</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                    <Button className="h-9 gap-1.5" onClick={openCreateDialog}>
                      <Plus className="h-4 w-4" />
                      Add Item
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                  onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
                >
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </header>

      <AnimatePresence mode="wait" initial={false}>
        {view === "board" ? (
          <motion.div
            key="board"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: easeOut }}
            className="space-y-0"
          >
            <LayoutGroup id="kanban-layout">
              <motion.section layout className="kanban-board grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-4">
                {STATUSES.map((column, columnIndex) => {
                  const columnTasks = groupedTasks[column.id] ?? [];
                  return (
                    <MotionCard
                      key={column.id}
                      layout
                      initial={{ opacity: 0, y: 12, scale: 0.995 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{
                        layout: springLayout,
                        default: { duration: 0.25, ease: easeOut, delay: columnIndex * 0.05 }
                      }}
                      className={cn(
                        "workspace-column kanban-column min-h-[520px] border-border/70 bg-card/74",
                        dragOverStatus === column.id && "kanban-drop-active border-primary/60 bg-primary/5",
                        dropPulseStatus === column.id && "kanban-drop-pulse"
                      )}
                      onDragEnter={() =>
                        setDragOverStatus((current) => (current === column.id ? current : column.id))
                      }
                      onDragOver={(event) => event.preventDefault()}
                      onDragLeave={() => setDragOverStatus("")}
                      onDrop={(event) => handleDrop(column.id, event)}
                    >
                      <CardHeader className="border-b border-border/60 pb-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                            <CardTitle className="text-sm uppercase tracking-[0.1em]">{column.label}</CardTitle>
                          </div>
                          <Badge className="border-border/70 bg-muted text-muted-foreground">
                            {columnTasks.length}
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-2 pt-3">
                        {columnTasks.length === 0 && (
                          <div className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
                            No items match this view.
                          </div>
                        )}

                        <AnimatePresence initial={false} mode="sync">
                          {columnTasks.map((task, taskIndex) => (
                            <TaskItem
                              key={task.id}
                              task={task}
                              index={taskIndex}
                              isDragging={draggedTaskId === task.id}
                              onEdit={openEditDialog}
                              onDelete={handleDeleteTask}
                              onDragStart={handleTaskDragStart}
                              onDragEnd={handleTaskDragEnd}
                            />
                          ))}
                        </AnimatePresence>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="mt-1 w-full justify-center gap-1 border border-dashed border-border/70 text-xs text-muted-foreground hover:border-primary/45 hover:text-foreground"
                          onClick={() => openCreateDialogForStatus(column.id)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add Item
                        </Button>
                      </CardContent>
                    </MotionCard>
                  );
                })}
              </motion.section>
            </LayoutGroup>
          </motion.div>
        ) : (
          <motion.div
            key="notes"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: easeOut }}
          >
            <section className="grid grid-cols-1 gap-3 lg:grid-cols-[300px_1fr]">
              <Card className="border-border/70 bg-card/85">
                <CardHeader className="space-y-3 pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Notes</CardTitle>
                    <Button size="sm" className="gap-1.5" onClick={createNewNote}>
                      <FilePlus2 className="h-4 w-4" />
                      New
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {filteredNotes.map((note) => (
                    <button
                      key={note.id}
                      type="button"
                      onClick={() => selectNote(note.id)}
                      className={cn(
                        "w-full rounded-lg border px-3 py-2 text-left transition",
                        notesState.activeNoteId === note.id
                          ? "border-primary/55 bg-primary/10"
                          : "border-border/70 bg-card hover:bg-accent/45"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="line-clamp-1 text-sm font-medium">{note.title}</p>
                        {note.pinned && <Pin className="mt-0.5 h-3.5 w-3.5 text-primary" />}
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {note.content || "No content yet"}
                      </p>
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        Updated {formatNoteTimestamp(note.updatedAt)}
                      </p>
                    </button>
                  ))}

                  {filteredNotes.length === 0 && (
                    <div className="rounded-md border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                      No notes match your search.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-card/80">
                <CardHeader className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-xl">Notes</CardTitle>
                    <Badge className="border-muted-foreground/30 bg-muted text-muted-foreground">
                      {isSavingNotes ? "Saving..." : `Saved ${formatLastSaved(lastSavedAt)}`}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1.2fr_1fr_auto]">
                    <Input
                      value={activeNote?.title ?? ""}
                      onChange={(event) => updateActiveNote({ title: event.target.value || "Untitled note" })}
                      placeholder="Note title"
                    />
                    <Input
                      value={activeNote?.tags.join(", ") ?? ""}
                      onChange={(event) =>
                        updateActiveNote({
                          tags: event.target.value
                            .split(",")
                            .map((tag) => tag.trim())
                            .filter(Boolean)
                        })
                      }
                      placeholder="tags, home, learning"
                    />
                    <div className="flex items-center gap-1">
                      <Button type="button" variant="outline" size="icon" onClick={togglePinned} aria-label="Pin note">
                        {activeNote?.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                      </Button>
                      <Button type="button" variant="outline" size="icon" onClick={duplicateActiveNote} aria-label="Duplicate note">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="outline" size="icon" onClick={deleteActiveNote} aria-label="Delete note">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1">
                    <Button type="button" size="sm" variant="outline" className="h-8 px-2" onClick={() => insertMarkdown("**", "**", "bold text")}>
                      <Bold className="h-4 w-4" />
                    </Button>
                    <Button type="button" size="sm" variant="outline" className="h-8 px-2" onClick={() => insertMarkdown("# ", "", "Heading")}>
                      <Heading1 className="h-4 w-4" />
                    </Button>
                    <Button type="button" size="sm" variant="outline" className="h-8 px-2" onClick={() => insertMarkdown("- ", "", "List item")}>
                      <List className="h-4 w-4" />
                    </Button>
                    <Button type="button" size="sm" variant="outline" className="h-8 px-2" onClick={() => insertMarkdown("1. ", "", "First item")}>
                      <ListOrdered className="h-4 w-4" />
                    </Button>
                    <Button type="button" size="sm" variant="outline" className="h-8 px-2" onClick={() => insertMarkdown("> ", "", "Quote")}>
                      <Quote className="h-4 w-4" />
                    </Button>
                    <Button type="button" size="sm" variant="outline" className="h-8 px-2" onClick={() => insertMarkdown("`", "`", "code")}>
                      <Code2 className="h-4 w-4" />
                    </Button>
                    <Button type="button" size="sm" variant="outline" className="h-8 px-2" onClick={() => insertMarkdown("[", "](https://example.com)", "link")}>
                      <Link2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <Textarea
                    ref={notesEditorRef}
                    className="min-h-[42vh] leading-relaxed"
                    placeholder="Write your note... Paste any URL to auto-generate a link card preview."
                    value={activeNote?.content ?? ""}
                    onPaste={(event) => {
                      const pastedText = event.clipboardData?.getData("text") || "";
                      const urls = extractUrlsFromText(pastedText);
                      if (urls.length > 0) {
                        window.setTimeout(() => {
                          urls.slice(0, 3).forEach((url) => {
                            addLinkPreviewToActiveNote(url);
                          });
                        }, 0);
                      }
                    }}
                    onChange={(event) => updateActiveNote({ content: event.target.value })}
                  />

                  <div className="rounded-md border border-border/70 bg-background/45 px-3 py-2 text-xs text-muted-foreground">
                    <div className="flex flex-wrap items-center gap-3">
                      <span>{noteMetrics.words} words</span>
                      <span>{noteMetrics.characters} characters</span>
                      <span>{noteMetrics.readTime}</span>
                    </div>
                  </div>

                  {activeNotePreviews.length > 0 && (
                    <div className="space-y-1.5">
                      {activeNotePreviews.map((preview) => (
                        <div
                          key={preview.id}
                          className="flex items-center gap-2 rounded-md border border-border/70 bg-background/55 px-2 py-2"
                        >
                          <img
                            src={preview.thumbnail || fallbackThumbnailForUrl(preview.url, preview.kind)}
                            alt={preview.title}
                            className="h-10 w-14 flex-none rounded object-cover"
                            loading="lazy"
                          />
                          <button
                            type="button"
                            className="min-w-0 flex-1 text-left"
                            onClick={() => window.open(preview.url, "_blank", "noopener,noreferrer")}
                          >
                            <p className="line-clamp-1 text-xs font-medium">{preview.title}</p>
                            <p className="line-clamp-1 text-[11px] text-muted-foreground">{preview.url}</p>
                          </button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-[11px] text-destructive hover:text-destructive"
                            onClick={() => removeLinkPreviewFromActiveNote(preview.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
        </section>
      </div>

      <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{projectDialogMode === "create" ? "Create Plan" : "Edit Plan"}</DialogTitle>
            <DialogDescription>
              Organize separate items, notes, and resources by plan.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveProject} className="mt-4 space-y-3">
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Plan Name</span>
              <Input
                name="name"
                required
                maxLength={80}
                value={projectFormValues.name}
                onChange={handleProjectFieldChange}
                placeholder="Home Renovation"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Plan Type</span>
              <select
                name="type"
                className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={projectFormValues.type}
                onChange={handleProjectFieldChange}
              >
                {PROJECT_TYPE_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            {projectDialogMode === "create" && (
              <label className="flex items-center gap-2 rounded-md border border-border/70 bg-background/50 px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  name="useTemplate"
                  checked={projectFormValues.useTemplate}
                  onChange={handleProjectFieldChange}
                />
                Start with a template (starter items, notes, and resources)
              </label>
            )}

            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Description</span>
              <Textarea
                name="description"
                rows={4}
                maxLength={400}
                value={projectFormValues.description}
                onChange={handleProjectFieldChange}
                placeholder="Goals, budget, reminders, and context for this plan."
              />
            </label>

            <DialogFooter>
              <Button type="submit">{projectDialogMode === "create" ? "Create Plan" : "Save Changes"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTaskId ? "Edit Item" : "Add Item"}</DialogTitle>
            <DialogDescription>
              Track status, context, and details in one place.
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
              <span className="text-xs text-muted-foreground">Person / Place</span>
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

            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Card Type</span>
              <select
                name="cardType"
                className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={formValues.cardType}
                onChange={handleFieldChange}
              >
                {TASK_CARD_TYPE_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            {formValues.cardType === "deadline" && (
              <label className="space-y-1 sm:col-span-2">
                <span className="text-xs text-muted-foreground">Deadline Note</span>
                <Input
                  name="deadlineNote"
                  maxLength={120}
                  value={formValues.deadlineNote}
                  onChange={handleFieldChange}
                  placeholder="Why this date matters"
                />
              </label>
            )}

            {formValues.cardType === "recurring" && (
              <label className="space-y-1 sm:col-span-2">
                <span className="text-xs text-muted-foreground">Repeat</span>
                <select
                  name="recurrenceRule"
                  className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={formValues.recurrenceRule}
                  onChange={handleFieldChange}
                >
                  <option value="none">None</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </label>
            )}

            {formValues.cardType === "priority" && (
              <label className="space-y-1 sm:col-span-2">
                <span className="text-xs text-muted-foreground">Priority Matrix Action</span>
                <select
                  name="matrixAction"
                  className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={formValues.matrixAction}
                  onChange={handleFieldChange}
                >
                  <option value="do">Do</option>
                  <option value="schedule">Schedule</option>
                  <option value="delegate">Delegate</option>
                  <option value="drop">Drop</option>
                </select>
              </label>
            )}

            {formValues.cardType === "checklist" && (
              <div className="space-y-2 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Checklist</span>
                  <Button type="button" size="sm" variant="outline" className="h-7 px-2" onClick={addChecklistFormItem}>
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Add Step
                  </Button>
                </div>
                <div className="space-y-1.5 rounded-md border border-border/70 bg-background/45 p-2">
                  {checklistFormItems.map((item, index) => (
                    <div key={item.id || `${index}-${item.label}`} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-primary"
                        checked={item.done}
                        onChange={(event) =>
                          handleChecklistItemChange(index, { done: event.target.checked })
                        }
                      />
                      <Input
                        value={item.label}
                        maxLength={160}
                        onChange={(event) =>
                          handleChecklistItemChange(index, { label: event.target.value })
                        }
                        placeholder={`Step ${index + 1}`}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 text-destructive hover:text-destructive"
                        onClick={() => removeChecklistFormItem(index)}
                        aria-label={`Remove step ${index + 1}`}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  {checklistFormItems.length === 0 && (
                    <div className="rounded border border-dashed border-border/70 px-2 py-2 text-xs text-muted-foreground">
                      No steps yet. Click Add Step to build a checklist.
                    </div>
                  )}
                </div>
              </div>
            )}

            <label className="space-y-1 sm:col-span-2">
              <span className="text-xs text-muted-foreground">Tags (comma separated)</span>
              <Input
                name="tags"
                placeholder="home, urgent, tutorial"
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
              <Button type="submit">Save Item</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}

export default App;
