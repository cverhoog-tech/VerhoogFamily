const TASKS_KEY = 'fam_tasks_v023';

const imageMap = {
  home: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=700&q=90&fm=webp',
  plant: 'https://images.unsplash.com/photo-1525498128493-380d1990a112?auto=format&fit=crop&w=700&q=90&fm=webp',
  car: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=700&q=90&fm=webp',
  food: 'https://images.unsplash.com/photo-1543353071-10c8ba85a904?auto=format&fit=crop&w=700&q=90&fm=webp',
  laundry: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=700&q=90&fm=webp',
  work: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=700&q=90&fm=webp',
};

const fallbackTasks = [
  ['plant', 'SIDE QUEST', 'Planten water geven', 'Zorg dat alle planten genoeg water hebben.', todayIso(), 'Esra', '+10 XP', imageMap.plant, ['Gieter vullen', 'Alle planten nalopen'], 0, 'once', todayIso(), 'laag'],
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function safeParse(raw) {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

function pickImage(title = '', description = '') {
  const text = `${title} ${description}`.toLowerCase();
  if (/plant/.test(text)) return imageMap.plant;
  if (/was|laundry|handdoek/.test(text)) return imageMap.laundry;
  if (/auto|car/.test(text)) return imageMap.car;
  if (/eten|kook|boodschap/.test(text)) return imageMap.food;
  if (/kamer|huis|stofzuig|woonkamer/.test(text)) return imageMap.home;
  return imageMap.work;
}

function normalizeTask(task) {
  return {
    id: task[0],
    type: task[1] || 'SIDE QUEST',
    title: task[2] || 'Nieuwe quest',
    description: task[3] || '',
    date: task[11] || task[4] || todayIso(),
    assignee: task[5] || 'Shane',
    xp: task[6] || '+10 XP',
    image: task[7] || pickImage(task[2], task[3]),
    subtasks: Array.isArray(task[8]) ? task[8] : [],
    done: !!task[9],
    repeat: task[10] || 'once',
    priority: task[12] || 'laag',
    raw: task,
  };
}

function toLegacyTask(task) {
  return [
    task.id,
    task.type || 'SIDE QUEST',
    task.title || 'Nieuwe quest',
    task.description || '',
    task.date || todayIso(),
    task.assignee || 'Shane',
    task.xp || '+10 XP',
    task.image || pickImage(task.title, task.description),
    task.subtasks && task.subtasks.length ? task.subtasks : ['Afronden'],
    task.done ? 1 : 0,
    task.repeat || 'once',
    task.date || todayIso(),
    task.priority || 'laag',
  ];
}

export function loadTasks() {
  const raw = safeParse(localStorage.getItem(TASKS_KEY))
    || safeParse(localStorage.getItem('fam_tasks_v022'))
    || safeParse(localStorage.getItem('fam_tasks_v021'))
    || fallbackTasks;

  return raw.map(normalizeTask);
}

export function saveTasks(tasks) {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks.map(toLegacyTask)));
  window.dispatchEvent(new CustomEvent('familyapp:tasks-updated', { detail: { tasks } }));
}

export function createTask(input) {
  const tasks = loadTasks();
  const task = {
    id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: input.type || 'SIDE QUEST',
    title: input.title || 'Nieuwe quest',
    description: input.description || '',
    date: input.date || todayIso(),
    assignee: input.assignee || 'Shane',
    xp: input.xp || '+10 XP',
    image: pickImage(input.title, input.description),
    subtasks: input.subtasks && input.subtasks.length ? input.subtasks : ['Afronden'],
    done: false,
    repeat: input.repeat || 'once',
    priority: input.priority || 'laag',
  };
  tasks.push(task);
  saveTasks(tasks);
  return task;
}

export function deleteTask(id) {
  const tasks = loadTasks().filter((task) => task.id !== id);
  saveTasks(tasks);
}

export function toggleTaskDone(id) {
  const tasks = loadTasks().map((task) => task.id === id ? { ...task, done: !task.done } : task);
  saveTasks(tasks);
}

export function formatToday() {
  return new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' });
}
