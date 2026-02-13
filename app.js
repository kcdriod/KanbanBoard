const STORAGE_KEY = "kanban.board.v1";

const STATUSES = [
  { id: "backlog", label: "Backlog" },
  { id: "in-progress", label: "In Progress" },
  { id: "review", label: "Review" },
  { id: "done", label: "Done" }
];

const appState = {
  tasks: loadTasks(),
  filters: {
    search: "",
    priority: "all"
  },
  editingTaskId: null
};

const taskDialog = document.getElementById("taskDialog");
const taskForm = document.getElementById("taskForm");
const dialogTitle = document.getElementById("dialogTitle");
const deleteTaskBtn = document.getElementById("deleteTaskBtn");

initialize();

function initialize() {
  document.getElementById("addTaskBtn").addEventListener("click", openCreateDialog);
  document.getElementById("closeDialogBtn").addEventListener("click", () => taskDialog.close());

  document.getElementById("searchInput").addEventListener("input", (event) => {
    appState.filters.search = event.target.value.trim().toLowerCase();
    renderBoard();
  });

  document.getElementById("priorityFilter").addEventListener("change", (event) => {
    appState.filters.priority = event.target.value;
    renderBoard();
  });

  taskForm.addEventListener("submit", handleSaveTask);
  deleteTaskBtn.addEventListener("click", handleDeleteFromDialog);

  setupDragAndDrop();
  renderBoard();
}

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedTasks();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : seedTasks();
  } catch {
    return seedTasks();
  }
}

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
      description: "Prepare desktop + mobile layout and interactions.",
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
      description: "Validate endpoints and error handling before release.",
      status: "review",
      priority: "urgent",
      assignee: "Backend",
      dueDate: "",
      tags: ["api", "qa"],
      createdAt: now - 8000
    }
  ];
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState.tasks));
}

function renderBoard() {
  for (const status of STATUSES) {
    const listEl = document.getElementById(`list-${status.id}`);
    const tasks = filteredTasksByStatus(status.id);

    listEl.innerHTML = "";
    document.getElementById(`count-${status.id}`).textContent = String(tasks.length);

    if (tasks.length === 0) {
      listEl.appendChild(createEmptyState());
      continue;
    }

    for (const task of tasks) {
      listEl.appendChild(createTaskCard(task));
    }
  }
}

function filteredTasksByStatus(statusId) {
  return appState.tasks
    .filter((task) => task.status === statusId)
    .filter((task) => {
      if (appState.filters.priority === "all") return true;
      return task.priority === appState.filters.priority;
    })
    .filter((task) => {
      if (!appState.filters.search) return true;
      const haystack = [
        task.title,
        task.description,
        task.assignee,
        task.tags.join(" ")
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(appState.filters.search);
    })
    .sort((a, b) => b.createdAt - a.createdAt);
}

function createEmptyState() {
  const empty = document.createElement("p");
  empty.className = "empty-state";
  empty.textContent = "No tasks match this view.";
  return empty;
}

function createTaskCard(task) {
  const card = document.createElement("article");
  card.className = "task-card";
  card.draggable = true;
  card.dataset.taskId = task.id;

  card.addEventListener("dragstart", (event) => {
    event.dataTransfer.setData("text/plain", task.id);
    event.dataTransfer.effectAllowed = "move";
  });

  const description = task.description
    ? `<p class="task-desc">${escapeHtml(task.description)}</p>`
    : "";

  const dueDate = task.dueDate ? formatDueDate(task.dueDate) : "No due date";

  card.innerHTML = `
    <header>
      <h3 class="task-title">${escapeHtml(task.title)}</h3>
      <span class="priority-chip priority-${task.priority}">${task.priority}</span>
    </header>
    ${description}
    <div class="task-meta">
      ${task.assignee ? `<span class="meta-chip">@${escapeHtml(task.assignee)}</span>` : ""}
      <span class="meta-chip">${dueDate}</span>
      ${task.tags.map((tag) => `<span class="meta-chip">#${escapeHtml(tag)}</span>`).join("")}
    </div>
    <div class="task-actions">
      <button class="task-action edit" type="button">Edit</button>
      <button class="task-action delete" type="button">Delete</button>
    </div>
  `;

  card.querySelector(".edit").addEventListener("click", () => openEditDialog(task.id));
  card.querySelector(".delete").addEventListener("click", () => deleteTask(task.id));

  return card;
}

function formatDueDate(dateText) {
  const parsed = new Date(dateText);
  if (Number.isNaN(parsed.getTime())) return "No due date";
  return `Due ${parsed.toLocaleDateString()}`;
}

function openCreateDialog() {
  appState.editingTaskId = null;
  dialogTitle.textContent = "Add Task";
  deleteTaskBtn.classList.add("hidden");

  taskForm.reset();
  taskForm.elements.status.value = "backlog";
  taskForm.elements.priority.value = "medium";
  taskDialog.showModal();
}

function openEditDialog(taskId) {
  const task = appState.tasks.find((entry) => entry.id === taskId);
  if (!task) return;

  appState.editingTaskId = taskId;
  dialogTitle.textContent = "Edit Task";
  deleteTaskBtn.classList.remove("hidden");

  taskForm.elements.title.value = task.title;
  taskForm.elements.description.value = task.description;
  taskForm.elements.priority.value = task.priority;
  taskForm.elements.status.value = task.status;
  taskForm.elements.assignee.value = task.assignee;
  taskForm.elements.dueDate.value = task.dueDate;
  taskForm.elements.tags.value = task.tags.join(", ");
  taskDialog.showModal();
}

function handleSaveTask(event) {
  event.preventDefault();
  const data = new FormData(taskForm);
  const parsedTags = String(data.get("tags"))
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  const nextTask = {
    title: String(data.get("title")).trim(),
    description: String(data.get("description")).trim(),
    priority: String(data.get("priority")),
    status: String(data.get("status")),
    assignee: String(data.get("assignee")).trim(),
    dueDate: String(data.get("dueDate")),
    tags: parsedTags
  };

  if (!nextTask.title) return;

  if (appState.editingTaskId) {
    const index = appState.tasks.findIndex((task) => task.id === appState.editingTaskId);
    if (index >= 0) {
      appState.tasks[index] = {
        ...appState.tasks[index],
        ...nextTask
      };
    }
  } else {
    appState.tasks.push({
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      ...nextTask
    });
  }

  saveTasks();
  taskDialog.close();
  renderBoard();
}

function handleDeleteFromDialog() {
  if (!appState.editingTaskId) return;
  deleteTask(appState.editingTaskId);
  taskDialog.close();
}

function deleteTask(taskId) {
  appState.tasks = appState.tasks.filter((task) => task.id !== taskId);
  saveTasks();
  renderBoard();
}

function setupDragAndDrop() {
  const columns = document.querySelectorAll(".column");
  columns.forEach((column) => {
    column.addEventListener("dragover", (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      column.classList.add("drag-over");
    });

    column.addEventListener("dragleave", () => {
      column.classList.remove("drag-over");
    });

    column.addEventListener("drop", (event) => {
      event.preventDefault();
      column.classList.remove("drag-over");

      const taskId = event.dataTransfer.getData("text/plain");
      const newStatus = column.dataset.status;
      if (!taskId || !newStatus) return;

      const task = appState.tasks.find((entry) => entry.id === taskId);
      if (!task) return;

      task.status = newStatus;
      saveTasks();
      renderBoard();
    });
  });
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
