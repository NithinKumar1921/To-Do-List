# To-Do-List
# To Do List Website Documentation

## Overview

This is a simple To Do List web app built with plain HTML, CSS, and JavaScript. It lets users create tasks, mark them as completed, edit task names, delete tasks, switch between light and dark mode, and track completion progress with charts and stats.

The app saves tasks in the browser using `localStorage`, so tasks remain available after refreshing the page on the same browser.

## Project Files

- `index.html` contains the page structure.
- `styles.css` contains the light/dark theme, layout, responsive design, and visual styling.
- `app.js` contains the task logic, data saving, filters, stats, charts, and streak calculation.

## How To Open The Website

If the local server is running, open:

```text
http://127.0.0.1:8080/index.html
```

You can also open `index.html` directly in a browser, but using the local server is usually smoother while developing.

To start the local server from the project folder:

```powershell
python -m http.server 8080 --bind 127.0.0.1
```

Then visit the URL above.

## How To Use

### Add A Task

1. Type a task in the input box that says `Add a new task...`.
2. Click `Add Task`.
3. The new task appears in the task list.

New tasks are added near the top of the list.

### Complete A Task

Click the checkbox next to a task. Once completed:

- The task text gets crossed out.
- The completed task moves below unfinished tasks.
- The completed count increases.
- The completion chart updates.
- The streak may increase if this is the first task completed today.

### Edit A Task

Click the `Edit` button next to a task. A prompt opens where you can change the task text.

### Delete A Task

Click the `Del` button next to a task. The task is removed from the list and the stats update.

### Filter Tasks

Use the filter buttons above the task list:

- `All` shows every task.
- `Active` shows unfinished tasks only.
- `Done` shows completed tasks only.

### Clear Completed Tasks

Click `Clear done` to remove all completed tasks at once.

### Switch Light And Dark Mode

Click the theme button in the top-right area of the app. The app switches between light mode and dark mode. The selected theme is saved in the browser.

## How The Stats Work

### Total Tasks

Shows the number of all tasks currently saved.

### Completed

Shows how many tasks are marked as completed.

### Pending

Shows how many tasks are still unfinished.

### Current Streak

The streak counts how many consecutive days, including today, have at least one completed task.

For example:

- If you complete a task today, the streak becomes `1`.
- If you also completed tasks yesterday, the streak becomes `2`.
- If a day is missed, the streak starts again from `0` or `1` when a task is completed.

## How The Charts Work

### Completion Donut Chart

The circle chart shows the percentage of completed tasks:

```text
completed tasks / total tasks * 100
```

If all tasks are completed, it shows `100%`.

### Overview Bar Chart

The overview chart shows completed tasks over time. You can choose:

- `Daily`: completed tasks across the last 7 days.
- `Weekly`: completed tasks across recent weeks.
- `Monthly`: completed tasks across recent months.

Only tasks that have been marked completed are counted in the overview chart.

## How The App Stores Data

The app stores tasks in the browser's `localStorage` using this key:

```text
todo-list-pro-tasks
```

The selected theme is stored using this key:

```text
todo-list-pro-theme
```

This means:

- Refreshing the page keeps your tasks.
- Closing and reopening the browser usually keeps your tasks.
- Opening the app in another browser may not show the same tasks.
- Clearing browser site data will remove the saved tasks.

## Task Ordering

Tasks are sorted so that:

1. Unfinished tasks appear first.
2. Completed tasks appear below unfinished tasks.
3. Newer tasks appear before older tasks inside each group.

## Main JavaScript Functions

- `createTask(title)` creates a new task object.
- `getFilteredTasks()` sorts and filters tasks.
- `renderTasks()` displays the task list.
- `renderStats()` updates total, completed, pending, streak, and charts.
- `drawDonut(percent)` draws the circular completion chart.
- `drawOverview()` draws the daily, weekly, or monthly bar chart.
- `getCompletionStreak()` calculates the current streak.
- `saveTasks()` saves tasks to `localStorage`.

## Browser Support

The app uses standard browser features:

- HTML forms
- CSS variables
- Canvas charts
- JavaScript events
- `localStorage`

It should work in modern versions of Chrome, Edge, Firefox, and Safari.

## Possible Future Improvements

- Add due dates for tasks.
- Add task categories or priorities.
- Add drag-and-drop sorting.
- Add a search box.
- Add export/import for saved tasks.
- Replace the edit prompt with an inline edit field.
