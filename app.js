const taskInput = document.getElementById('taskInput');
const taskDate = document.getElementById('taskDate');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const taskCount = document.getElementById('taskCount');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');
const themeToggle = document.getElementById('themeToggle');

const STORAGE_KEY = 'todo-list-items';
const THEME_KEY = 'todo-theme';

let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
let draggedTaskId = null;

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function formatDueDate(dateString) {
  if (!dateString) return '';

  const date = new Date(dateString + 'T00:00:00');
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function updateThemeButton(theme) {
  const isDark = theme === 'dark';
  themeToggle.textContent = isDark ? '☀️ Light mode' : '🌙 Dark mode';
  themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
}

function loadTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
  const isDark = savedTheme === 'dark';
  document.body.classList.toggle('dark', isDark);
  updateThemeButton(savedTheme);
}

function toggleTheme() {
  const isDark = document.body.classList.toggle('dark');
  const theme = isDark ? 'dark' : 'light';
  localStorage.setItem(THEME_KEY, theme);
  updateThemeButton(theme);
}

function reorderTasks(fromId, toId) {
  const fromIndex = tasks.findIndex((task) => task.id === fromId);
  const toIndex = tasks.findIndex((task) => task.id === toId);

  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
    return;
  }

  const [movedTask] = tasks.splice(fromIndex, 1);
  tasks.splice(toIndex, 0, movedTask);
  saveTasks();
  renderTasks();
}

function renderTasks() {
  taskList.innerHTML = '';

  if (tasks.length === 0) {
    const emptyState = document.createElement('li');
    emptyState.className = 'empty-state';
    emptyState.textContent = 'No tasks yet. Add one above!';
    taskList.appendChild(emptyState);
  } else {
    tasks.forEach((task) => {
      const item = document.createElement('li');
      item.className = 'task-item' + (task.completed ? ' completed' : '');
      item.draggable = true;
      item.dataset.id = String(task.id);

      item.addEventListener('dragstart', (event) => {
        draggedTaskId = task.id;
        item.classList.add('dragging');
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', String(task.id));
      });

      item.addEventListener('dragend', () => {
        draggedTaskId = null;
        item.classList.remove('dragging');
        taskList.querySelectorAll('.drop-target').forEach((dropItem) => dropItem.classList.remove('drop-target'));
      });

      item.addEventListener('dragover', (event) => {
        event.preventDefault();
        item.classList.add('drop-target');
      });

      item.addEventListener('dragleave', () => {
        item.classList.remove('drop-target');
      });

      item.addEventListener('drop', (event) => {
        event.preventDefault();
        item.classList.remove('drop-target');
        if (!draggedTaskId || draggedTaskId === task.id) {
          return;
        }
        reorderTasks(draggedTaskId, task.id);
      });

      const main = document.createElement('div');
      main.className = 'task-main';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = task.completed;
      checkbox.className = 'task-checkbox';
      checkbox.setAttribute('aria-label', 'Mark task as complete');
      checkbox.addEventListener('change', () => {
        task.completed = checkbox.checked;
        saveTasks();
        renderTasks();
      });

      const textWrap = document.createElement('div');
      textWrap.className = 'task-text-wrap';

      const text = document.createElement('span');
      text.className = 'task-text';
      text.textContent = task.text;

      const dueDateLabel = document.createElement('span');
      dueDateLabel.className = 'task-date-label';
      dueDateLabel.textContent = task.dueDate ? `Due ${formatDueDate(task.dueDate)}` : 'No due date';

      textWrap.appendChild(text);
      textWrap.appendChild(dueDateLabel);
      main.appendChild(checkbox);
      main.appendChild(textWrap);

      const actions = document.createElement('div');
      actions.className = 'task-actions';

      const dateInput = document.createElement('input');
      dateInput.type = 'date';
      dateInput.className = 'task-date-input';
      dateInput.value = task.dueDate || '';
      dateInput.setAttribute('aria-label', 'Set task due date');
      dateInput.addEventListener('change', () => {
        task.dueDate = dateInput.value;
        saveTasks();
        renderTasks();
      });

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'edit-btn';
      editBtn.textContent = 'Edit';
      editBtn.setAttribute('aria-label', 'Edit task name');
      editBtn.addEventListener('click', () => {
        const updatedText = prompt('Edit task name:', task.text);
        if (updatedText === null) {
          return;
        }

        const trimmedText = updatedText.trim();
        if (!trimmedText) {
          return;
        }

        task.text = trimmedText;
        saveTasks();
        renderTasks();
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'delete-btn';
      deleteBtn.textContent = 'Delete';
      deleteBtn.setAttribute('aria-label', 'Delete task');
      deleteBtn.addEventListener('click', () => {
        tasks = tasks.filter((itemTask) => itemTask.id !== task.id);
        saveTasks();
        renderTasks();
      });

      actions.appendChild(dateInput);
      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);
      item.appendChild(main);
      item.appendChild(actions);
      taskList.appendChild(item);
    });
  }

  const remaining = tasks.filter((task) => !task.completed).length;
  taskCount.textContent = `${remaining} task${remaining === 1 ? '' : 's'} left`;
}

function addTask() {
  const value = taskInput.value.trim();
  if (!value) {
    taskInput.focus();
    return;
  }

  tasks.unshift({
    id: Date.now() + Math.random(),
    text: value,
    completed: false,
    dueDate: taskDate.value || ''
  });

  taskInput.value = '';
  taskDate.value = '';
  taskInput.focus();
  saveTasks();
  renderTasks();
}

addBtn.addEventListener('click', addTask);

taskInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    addTask();
  }
});

clearCompletedBtn.addEventListener('click', () => {
  tasks = tasks.filter((task) => !task.completed);
  saveTasks();
  renderTasks();
});

themeToggle.addEventListener('click', toggleTheme);

loadTheme();
renderTasks(); 