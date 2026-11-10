// 1. DATA AND VARIABLES
// PERSISTENCE: load saved tasks from localStorage (or start empty)
let tasks = JSON.parse(localStorage.getItem('itp10_tasks')) || [];

// Current filter, search text, and task chosen for delete
let currentFilter = 'all';
let currentSearchQuery = '';
let deleteTargetId = null;


// 2. DOM ELEMENTS

// Dashboard
const taskListEl = document.getElementById('taskList');
const statTotalEl = document.getElementById('statTotal');
const statPendingEl = document.getElementById('statPending');
const statCompletedEl = document.getElementById('statCompleted');

// Modals and form
const taskModal = document.getElementById('taskModal');
const deleteModal = document.getElementById('deleteModal');
const taskForm = document.getElementById('taskForm');
const modalTitle = document.getElementById('modalTitle');
const formError = document.getElementById('formError');

// Inputs
const taskIdInput = document.getElementById('taskId');
const taskTitleInput = document.getElementById('taskTitle');
const taskSubjectInput = document.getElementById('taskSubject');
const taskDescInput = document.getElementById('taskDesc');
const taskDeadlineInput = document.getElementById('taskDeadline');
const searchInput = document.getElementById('searchInput');


// 3. EVENT LISTENERS

// Event 1: Page loads
window.addEventListener('DOMContentLoaded', () => {
    renderApp();
});

// Event 2: Add Task button (Control 1)
document.getElementById('openAddModalBtn').addEventListener('click', () => {
    openFormModal();
});

// Event 3: Cancel in task form (Control 10)
document.getElementById('closeTaskModalBtn').addEventListener('click', () => {
    closeFormModal();
});

// Event 4: Save task form (Control 9)
taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    saveTask();
});

// Event 5: Search box (Control 3)
searchInput.addEventListener('input', (e) => {
    currentSearchQuery = e.target.value.toLowerCase().trim();
    renderTasks();
});

// Event 6: Filter tabs (Control 4)
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentFilter = e.target.getAttribute('data-filter');
        renderTasks();
    });
});

// Event 7: Cancel delete (Control 10)
document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
    deleteModal.style.display = 'none';
    deleteTargetId = null;
});

// Event 8: Confirm delete (Control 11)
document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
    if (deleteTargetId !== null) {
        deleteTask(deleteTargetId);
    }
});


// 4. MAIN FUNCTIONS

// Refresh list, counts, and save data (PERSISTENCE)
function renderApp() {
    renderTasks();
    updateStats();
    saveData();
}

// Show tasks that match the filter and search
function renderTasks() {
    let filteredTasks = tasks.filter(task => {
        const matchesFilter = (currentFilter === 'all') || (task.status === currentFilter);
        const matchesSearch = task.title.toLowerCase().includes(currentSearchQuery) || 
                              (task.subject && task.subject.toLowerCase().includes(currentSearchQuery));
        return matchesFilter && matchesSearch;
    });

    // Empty message
    if (filteredTasks.length === 0) {
        taskListEl.innerHTML = `
            <div class="empty-state">
                No tasks found. Click "+ Add Task" to begin.
            </div>
        `;
        return;
    }

    // Task list
    taskListEl.innerHTML = filteredTasks.map(task => `
        <div class="task-item">
            <div class="task-info">
                <!-- Control 5: Checkbox -->
                <input type="checkbox" ${task.status === 'completed' ? 'checked' : ''} 
                       onchange="toggleTaskStatus(${task.id})">
                <div class="task-details">
                    <h5 style="${task.status === 'completed' ? 'text-decoration: line-through; color: #888;' : ''}">${escapeHtml(task.title)}</h5>
                    <p>${task.subject ? escapeHtml(task.subject) + ' • ' : ''}Due: ${formatDate(task.deadline)}</p>
                </div>
            </div>
            <div class="task-actions">
                <span class="badge ${task.status}">${task.status.toUpperCase()}</span>
                <!-- Control 6: Edit -->
                <button class="btn-sm" onclick="openFormModal(${task.id})">Edit</button>
                <!-- Control 7: Delete -->
                <button class="btn-sm" style="color: var(--danger-color);" onclick="promptDeleteTask(${task.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

// Update the summary tiles (Control 2)
function updateStats() {
    const total = tasks.length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const completed = tasks.filter(t => t.status === 'completed').length;

    statTotalEl.textContent = String(total).padStart(2, '0');
    statPendingEl.textContent = String(pending).padStart(2, '0');
    statCompletedEl.textContent = String(completed).padStart(2, '0');
}

// Open the form for Add (no id) or Edit (with id)
function openFormModal(id = null) {
    // VALIDATION: hide old error message and clear the form
    formError.style.display = 'none';
    taskForm.reset();

    if (id !== null) {
        // Edit mode
        modalTitle.textContent = "Edit Task";
        const task = tasks.find(t => t.id === id);
        if (task) {
            taskIdInput.value = task.id;
            taskTitleInput.value = task.title;
            taskSubjectInput.value = task.subject || '';
            taskDescInput.value = task.description || '';
            taskDeadlineInput.value = task.deadline;
        }
    } else {
        // Add mode
        modalTitle.textContent = "Add Task";
        taskIdInput.value = '';
    }
    taskModal.style.display = 'flex';
}

// Close the task form
function closeFormModal() {
    taskModal.style.display = 'none';
}

// Check the form and save the task (Control 9)
function saveTask() {
    const id = taskIdInput.value;
    const title = taskTitleInput.value.trim();
    const subject = taskSubjectInput.value.trim();
    const description = taskDescInput.value.trim();
    const deadline = taskDeadlineInput.value;

    // VALIDATION: title and deadline are required
    // (spaces only count as empty because of trim())
    // If one is missing, show the error and stop (nothing is saved)
    if (!title || !deadline) {
        formError.style.display = 'block';
        return;
    }

    if (id) {
        // Update old task
        tasks = tasks.map(t => t.id == id ? { ...t, title, subject, description, deadline } : t);
    } else {
        // Add new task
        const newTask = {
            id: Date.now(),
            title,
            subject,
            description,
            deadline,
            status: 'pending'
        };
        tasks.push(newTask);
    }

    // Validation passed: close the form, then refresh and save (PERSISTENCE)
    closeFormModal();
    renderApp();
}

// Switch between pending and completed (Control 5)
function toggleTaskStatus(id) {
    tasks = tasks.map(t => {
        if (t.id === id) {
            t.status = t.status === 'pending' ? 'completed' : 'pending';
        }
        return t;
    });
    renderApp();
}

// Ask before deleting (Control 7)
function promptDeleteTask(id) {
    deleteTargetId = id;
    deleteModal.style.display = 'flex';
}

// Remove the task (Control 11)
function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    deleteModal.style.display = 'none';
    deleteTargetId = null;
    renderApp();
}

// PERSISTENCE: save tasks in localStorage as text (JSON)
// so they stay after refreshing or closing the browser
function saveData() {
    localStorage.setItem('itp10_tasks', JSON.stringify(tasks));
}


// 5. HELPER FUNCTIONS

// Make the date easy to read
function formatDate(dateString) {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Stop unsafe text from running as HTML
function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}