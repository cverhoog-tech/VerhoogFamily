import { loadTasks, createTask, deleteTask, toggleTaskDone, formatToday } from './tasks.store.js';

const ROOT_ID = 'modern-task-layer-v1';

function ensureRoot() {
  let root = document.getElementById(ROOT_ID);
  if (!root) {
    root = document.createElement('div');
    root.id = ROOT_ID;
    document.body.appendChild(root);
  }
  return root;
}

function renderCards(tasks) {
  return tasks.map((task) => `
    <article class="modern-task-card ${task.done ? 'done' : ''}" data-task-id="${task.id}">
      <img src="${task.image}" alt="${task.title}" class="modern-task-image" />
      <div class="modern-task-content">
        <div class="modern-task-tags">
          <span class="tag">${task.type}</span>
          <span class="tag priority">${task.priority}</span>
        </div>
        <h3>${task.title}</h3>
        <p>${task.description}</p>
        <div class="modern-task-meta">
          <span>${task.date}</span>
          <span>${task.assignee}</span>
        </div>
        <div class="modern-task-footer">
          <strong>${task.xp}</strong>
          <div class="actions">
            <button class="done-btn">${task.done ? '↺ Heropen' : '✓ Voltooi'}</button>
            <button class="delete-btn">✕</button>
          </div>
        </div>
      </div>
    </article>
  `).join('');
}

function renderModal() {
  return `
    <div class="modern-task-modal hidden" id="modern-task-modal">
      <div class="modern-task-sheet">
        <div class="sheet-head">
          <h2>Nieuwe Quest</h2>
          <button id="close-modern-task-modal">✕</button>
        </div>
        <form id="modern-task-form">
          <input name="title" placeholder="Titel" required />
          <textarea name="description" placeholder="Beschrijving"></textarea>
          <select name="assignee">
            <option>Shane</option>
            <option>Esra</option>
          </select>
          <select name="repeat">
            <option value="once">Eenmalig</option>
            <option value="daily">Dagelijks</option>
            <option value="weekly">Wekelijks</option>
            <option value="monthly">Maandelijks</option>
          </select>
          <button type="submit" class="submit-modern-task">Quest toevoegen</button>
        </form>
      </div>
    </div>
  `;
}

function render() {
  const root = ensureRoot();
  const tasks = loadTasks().filter((task) => !task.done);

  root.innerHTML = `
    <section class="modern-task-shell">
      <div class="modern-task-topbar">
        <div>
          <h2>Vandaag</h2>
          <span>${formatToday()}</span>
        </div>
        <button id="open-modern-task-modal">+ Quest toevoegen</button>
      </div>

      <div class="modern-task-grid">
        ${renderCards(tasks)}
      </div>
    </section>
    ${renderModal()}
  `;

  bind();
}

function bind() {
  const modal = document.getElementById('modern-task-modal');

  document.getElementById('open-modern-task-modal')?.addEventListener('click', () => {
    modal?.classList.remove('hidden');
  });

  document.getElementById('close-modern-task-modal')?.addEventListener('click', () => {
    modal?.classList.add('hidden');
  });

  document.getElementById('modern-task-form')?.addEventListener('submit', (event) => {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    createTask({
      title: form.get('title'),
      description: form.get('description'),
      assignee: form.get('assignee'),
      repeat: form.get('repeat'),
    });

    modal?.classList.add('hidden');
    render();
  });

  document.querySelectorAll('.modern-task-card').forEach((card) => {
    const id = card.getAttribute('data-task-id');

    card.querySelector('.done-btn')?.addEventListener('click', (event) => {
      event.stopPropagation();
      toggleTaskDone(id);
      render();
    });

    card.querySelector('.delete-btn')?.addEventListener('click', (event) => {
      event.stopPropagation();
      deleteTask(id);
      render();
    });
  });
}

function shouldMount() {
  const bodyText = document.body?.textContent || '';
  return /taken/i.test(bodyText);
}

function hideLegacyTaskLayer() {
  document.querySelectorAll('.task-card, .task-list, .fq-list, .fq-card').forEach((node) => {
    node.style.display = 'none';
  });
}

function mount() {
  if (!shouldMount()) return;
  hideLegacyTaskLayer();
  render();
}

window.addEventListener('load', () => {
  setTimeout(mount, 400);
});

window.addEventListener('familyapp:tasks-updated', () => {
  render();
});
