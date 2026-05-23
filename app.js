const storageKey = "todo-list-pro-tasks";
const themeKey = "todo-list-pro-theme";
const reminderKey = "todo-list-pro-reminders";
const reminderIntervalKey = "todo-list-pro-reminder-interval";

const state = {
  tasks: JSON.parse(localStorage.getItem(storageKey) || "[]"),
  filter: "all",
  overview: "daily",
  remindersEnabled: localStorage.getItem(reminderKey) === "true",
  reminderInterval: Number(localStorage.getItem(reminderIntervalKey) || 30)
};

let reminderTimer = null;
let taskReminderTimer = null;
let toastTimer = null;

const els = {
  body: document.body,
  themeToggle: document.getElementById("themeToggle"),
  themeText: document.getElementById("themeText"),
  taskForm: document.getElementById("taskForm"),
  taskInput: document.getElementById("taskInput"),
  taskReminder: document.getElementById("taskReminder"),
  taskList: document.getElementById("taskList"),
  emptyState: document.getElementById("emptyState"),
  clearCompleted: document.getElementById("clearCompleted"),
  filterButtons: document.querySelectorAll(".filter-btn"),
  totalTasks: document.getElementById("totalTasks"),
  completedTasks: document.getElementById("completedTasks"),
  pendingTasks: document.getElementById("pendingTasks"),
  streakDays: document.getElementById("streakDays"),
  completionRate: document.getElementById("completionRate"),
  donutPercent: document.getElementById("donutPercent"),
  donut: document.getElementById("completionDonut"),
  overviewChart: document.getElementById("overviewChart"),
  overviewRange: document.getElementById("overviewRange"),
  reminderStatus: document.getElementById("reminderStatus"),
  reminderInterval: document.getElementById("reminderInterval"),
  reminderToggle: document.getElementById("reminderToggle"),
  notifyNow: document.getElementById("notifyNow"),
  toast: document.getElementById("toast")
};

const savedTheme = localStorage.getItem(themeKey) || "light";
document.documentElement.dataset.theme = savedTheme;
setThemeText(savedTheme);

function saveTasks() {
  localStorage.setItem(storageKey, JSON.stringify(state.tasks));
}

function createTask(title, reminderAt) {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title,
    completed: false,
    createdAt: new Date().toISOString(),
    completedAt: null,
    reminderAt,
    reminderSent: false
  };
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatReminder(value) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function getFilteredTasks() {
  const sortedTasks = [...state.tasks].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  if (state.filter === "active") {
    return sortedTasks.filter(task => !task.completed);
  }
  if (state.filter === "completed") {
    return sortedTasks.filter(task => task.completed);
  }
  return sortedTasks;
}

function getPendingTasks() {
  return state.tasks.filter(task => !task.completed);
}

function renderTasks() {
  const tasks = getFilteredTasks();
  els.taskList.innerHTML = "";
  els.emptyState.style.display = tasks.length ? "none" : "block";

  tasks.forEach(task => {
    const item = document.createElement("li");
    item.className = `task-item${task.completed ? " completed" : ""}`;
    item.dataset.id = task.id;

    const checked = task.completed ? "checked" : "";
    const meta = task.completed && task.completedAt
      ? `Completed ${formatDate(task.completedAt)}`
      : `Created ${formatDate(task.createdAt)}`;
    const reminder = task.reminderAt
      ? `<div class="task-reminder">Reminder ${formatReminder(task.reminderAt)}</div>`
      : "";

    item.innerHTML = `
      <input class="task-check" type="checkbox" ${checked} aria-label="Mark task complete">
      <div>
        <div class="task-title">${escapeHtml(task.title)}</div>
        <div class="task-meta">${meta}</div>
        ${reminder}
      </div>
      <div class="task-actions">
        <button class="icon-btn edit-btn" type="button" title="Edit task" aria-label="Edit task">Edit</button>
        <button class="icon-btn danger delete-btn" type="button" title="Delete task" aria-label="Delete task">Del</button>
      </div>
    `;

    els.taskList.appendChild(item);
  });
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

function renderStats() {
  const total = state.tasks.length;
  const completed = state.tasks.filter(task => task.completed).length;
  const pending = total - completed;
  const percent = total ? Math.round((completed / total) * 100) : 0;

  els.totalTasks.textContent = total;
  els.completedTasks.textContent = completed;
  els.pendingTasks.textContent = pending;
  els.completionRate.textContent = `${percent}%`;
  els.donutPercent.textContent = `${percent}%`;
  els.streakDays.textContent = getCompletionStreak();

  drawDonut(percent);
  drawOverview();
  updateReminderUi();
}

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function drawDonut(percent) {
  const canvas = els.donut;
  const ctx = canvas.getContext("2d");
  const center = canvas.width / 2;
  const radius = 82;
  const lineWidth = 24;
  const start = -Math.PI / 2;
  const end = start + (Math.PI * 2 * percent) / 100;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.strokeStyle = cssVar("--line");
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.strokeStyle = percent === 100 ? cssVar("--accent") : cssVar("--primary");
  ctx.arc(center, center, radius, start, end);
  ctx.stroke();
}

function drawOverview() {
  const canvas = els.overviewChart;
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.max(320, Math.floor(rect.width * dpr));
  canvas.height = Math.floor(180 * dpr);
  ctx.scale(dpr, dpr);

  const width = canvas.width / dpr;
  const height = canvas.height / dpr;
  const data = getOverviewData(state.overview);
  const max = Math.max(1, ...data.map(item => item.count));
  const barGap = 9;
  const chartTop = 18;
  const chartBottom = 34;
  const chartHeight = height - chartTop - chartBottom;
  const barWidth = Math.max(14, (width - barGap * (data.length - 1)) / data.length);

  ctx.clearRect(0, 0, width, height);
  ctx.font = "700 11px Inter, sans-serif";
  ctx.textAlign = "center";

  data.forEach((item, index) => {
    const x = index * (barWidth + barGap);
    const barHeight = Math.max(4, (item.count / max) * chartHeight);
    const y = chartTop + chartHeight - barHeight;

    ctx.fillStyle = cssVar("--surface-soft");
    roundRect(ctx, x, chartTop, barWidth, chartHeight, 7);
    ctx.fill();

    ctx.fillStyle = item.count ? cssVar("--primary") : cssVar("--line");
    roundRect(ctx, x, y, barWidth, barHeight, 7);
    ctx.fill();

    ctx.fillStyle = cssVar("--muted");
    ctx.fillText(item.label, x + barWidth / 2, height - 12);

    if (item.count) {
      ctx.fillStyle = cssVar("--text");
      ctx.fillText(item.count, x + barWidth / 2, Math.max(12, y - 6));
    }
  });
}

function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function getOverviewData(range) {
  if (range === "weekly") {
    return Array.from({ length: 8 }, (_, index) => {
      const start = startOfWeek(addDays(new Date(), (index - 7) * 7));
      const end = addDays(start, 7);
      return {
        label: index === 7 ? "Now" : `${index + 1}`,
        count: countCompletedBetween(start, end)
      };
    });
  }

  if (range === "monthly") {
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - index), 1);
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
      return {
        label: start.toLocaleString(undefined, { month: "short" }),
        count: countCompletedBetween(start, end)
      };
    });
  }

  return Array.from({ length: 7 }, (_, index) => {
    const day = startOfDay(addDays(new Date(), index - 6));
    return {
      label: day.toLocaleString(undefined, { weekday: "short" }).slice(0, 3),
      count: countCompletedBetween(day, addDays(day, 1))
    };
  });
}

function countCompletedBetween(start, end) {
  return state.tasks.filter(task => {
    if (!task.completedAt) return false;
    const completed = new Date(task.completedAt);
    return completed >= start && completed < end;
  }).length;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeek(date) {
  const day = startOfDay(date);
  const offset = (day.getDay() + 6) % 7;
  return addDays(day, -offset);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getCompletionStreak() {
  const completedDays = new Set(
    state.tasks
      .filter(task => task.completedAt)
      .map(task => startOfDay(new Date(task.completedAt)).toDateString())
  );

  let streak = 0;
  let cursor = startOfDay(new Date());

  while (completedDays.has(cursor.toDateString())) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

function render() {
  renderTasks();
  renderStats();
}

function toIsoFromDateTimeLocal(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function updateReminderUi() {
  const pendingCount = getPendingTasks().length;
  const intervalText = `${state.reminderInterval} min`;

  els.reminderInterval.value = String(state.reminderInterval);
  els.reminderToggle.classList.toggle("active", state.remindersEnabled);
  els.reminderToggle.textContent = state.remindersEnabled ? "Disable reminders" : "Enable reminders";

  if (state.remindersEnabled) {
    els.reminderStatus.textContent = pendingCount
      ? `On. You will be reminded every ${intervalText} about ${pendingCount} pending task${pendingCount === 1 ? "" : "s"}.`
      : "On. No pending tasks right now.";
  } else {
    els.reminderStatus.textContent = pendingCount
      ? `Off. ${pendingCount} pending task${pendingCount === 1 ? "" : "s"} waiting.`
      : "Reminders are off.";
  }
}

function startReminderTimer() {
  window.clearInterval(reminderTimer);
  reminderTimer = null;

  if (!state.remindersEnabled) {
    updateReminderUi();
    return;
  }

  reminderTimer = window.setInterval(() => {
    sendPendingReminder(false);
    sendDueTaskReminders();
  }, state.reminderInterval * 60 * 1000);

  updateReminderUi();
}

async function enableReminders() {
  await requestNotificationPermission();

  state.remindersEnabled = true;
  localStorage.setItem(reminderKey, "true");
  startReminderTimer();
  sendPendingReminder(true);
}

async function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    await Notification.requestPermission();
  }
}

function disableReminders() {
  state.remindersEnabled = false;
  localStorage.setItem(reminderKey, "false");
  startReminderTimer();
  showToast("Pending task reminders are off.");
}

function sendPendingReminder(isManual) {
  const pendingTasks = getPendingTasks();

  if (!pendingTasks.length) {
    if (isManual) {
      showToast("All caught up. No pending tasks right now.");
    }
    return;
  }

  const title = `${pendingTasks.length} pending task${pendingTasks.length === 1 ? "" : "s"}`;
  const preview = pendingTasks.slice(0, 3).map(task => task.title).join(", ");
  const extra = pendingTasks.length > 3 ? ` and ${pendingTasks.length - 3} more` : "";
  const message = `${preview}${extra}`;

  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, {
      body: message,
      tag: "todo-list-pending-reminder"
    });
  } else {
    showToast(`${title}: ${message}`);
  }
}

function sendDueTaskReminders() {
  const now = Date.now();
  const dueTasks = state.tasks.filter(task => {
    if (task.completed || task.reminderSent || !task.reminderAt) return false;
    return new Date(task.reminderAt).getTime() <= now;
  });

  if (!dueTasks.length) return;

  dueTasks.forEach(task => {
    notifyTaskReminder(task);
    task.reminderSent = true;
  });

  saveTasks();
  renderTasks();
}

function notifyTaskReminder(task) {
  const title = "Task reminder";
  const message = task.title;

  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, {
      body: message,
      tag: `todo-list-task-${task.id}`
    });
  } else {
    showToast(`${title}: ${message}`);
  }
}

function startTaskReminderTimer() {
  window.clearInterval(taskReminderTimer);
  taskReminderTimer = window.setInterval(sendDueTaskReminders, 30000);
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.classList.add("show");

  toastTimer = window.setTimeout(() => {
    els.toast.classList.remove("show");
  }, 4200);
}

function setThemeText(theme) {
  els.themeText.textContent = theme === "dark" ? "Dark" : "Light";
  document.querySelector(".toggle-icon").textContent = theme === "dark" ? "D" : "L";
}

els.taskForm.addEventListener("submit", async event => {
  event.preventDefault();
  const title = els.taskInput.value.trim();
  if (!title) return;

  const reminderAt = toIsoFromDateTimeLocal(els.taskReminder.value);
  if (reminderAt) {
    await requestNotificationPermission();
  }

  state.tasks.unshift(createTask(title, reminderAt));
  els.taskInput.value = "";
  els.taskReminder.value = "";
  saveTasks();
  render();
  sendDueTaskReminders();
});

els.taskList.addEventListener("click", event => {
  const item = event.target.closest(".task-item");
  if (!item) return;

  const task = state.tasks.find(entry => entry.id === item.dataset.id);
  if (!task) return;

  if (event.target.matches(".task-check")) {
    task.completed = event.target.checked;
    task.completedAt = task.completed ? new Date().toISOString() : null;
    saveTasks();
    render();
  }

  if (event.target.matches(".delete-btn")) {
    state.tasks = state.tasks.filter(entry => entry.id !== task.id);
    saveTasks();
    render();
  }

  if (event.target.matches(".edit-btn")) {
    const nextTitle = prompt("Edit task", task.title);
    if (nextTitle && nextTitle.trim()) {
      task.title = nextTitle.trim().slice(0, 120);
      saveTasks();
      render();
    }
  }
});

els.filterButtons.forEach(button => {
  button.addEventListener("click", () => {
    state.filter = button.dataset.filter;
    els.filterButtons.forEach(entry => entry.classList.toggle("active", entry === button));
    renderTasks();
  });
});

els.clearCompleted.addEventListener("click", () => {
  state.tasks = state.tasks.filter(task => !task.completed);
  saveTasks();
  render();
});

els.themeToggle.addEventListener("click", () => {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = nextTheme;
  localStorage.setItem(themeKey, nextTheme);
  setThemeText(nextTheme);
  renderStats();
});

els.overviewRange.addEventListener("change", event => {
  state.overview = event.target.value;
  drawOverview();
});

els.reminderToggle.addEventListener("click", () => {
  if (state.remindersEnabled) {
    disableReminders();
  } else {
    enableReminders();
  }
});

els.reminderInterval.addEventListener("change", event => {
  state.reminderInterval = Number(event.target.value);
  localStorage.setItem(reminderIntervalKey, String(state.reminderInterval));
  startReminderTimer();
});

els.notifyNow.addEventListener("click", () => {
  sendPendingReminder(true);
});

window.addEventListener("resize", drawOverview);

render();
startReminderTimer();
startTaskReminderTimer();
sendDueTaskReminders();
