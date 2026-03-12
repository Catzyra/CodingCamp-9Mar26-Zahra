/**
 * Unit Tests for Task List Component
 */

const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');
const fs = require('fs');
const path = require('path');

// Load the tasks module code
const tasksCode = fs.readFileSync(path.join(__dirname, '../../scripts/tasks.js'), 'utf8');
const storageCode = fs.readFileSync(path.join(__dirname, '../../scripts/storage.js'), 'utf8');

// Create task list DOM
const createTaskListDOM = () => {
    const container = document.createElement('div');
    container.className = 'tasks-container';
    container.innerHTML = `
        <h2>Tasks</h2>
        <div class="task-input-section">
            <label for="task-input" class="visually-hidden">New task</label>
            <input type="text" id="task-input" class="task-input" placeholder="Add a new task..." maxlength="500" />
            <button class="btn-add-task" aria-label="Add task">Add</button>
        </div>
        <div class="task-sort-controls">
            <button class="btn-sort-alpha" aria-label="Sort tasks alphabetically">A-Z</button>
            <button class="btn-sort-status" aria-label="Sort tasks by completion status">By Status</button>
        </div>
        <ul class="task-list" role="list" aria-label="Task items">
        </ul>
        <div class="task-notification" role="alert" aria-live="polite"></div>
    `;
    return container;
};

// Mock Storage
const mockStorage = {
    data: {},
    getItem(key) {
        return this.data[key] !== undefined ? this.data[key] : null;
    },
    setItem(key, value) {
        this.data[key] = value;
        return true;
    },
    removeItem(key) {
        delete this.data[key];
        return true;
    },
    hasItem(key) {
        return this.data[key] !== undefined;
    },
    clear() {
        this.data = {};
    }
};

// Make Storage available globally
global.Storage = mockStorage;

describe('TaskList Component - Task 6.1', () => {
    let container;
    let TaskList;

    beforeEach(() => {
        // Setup DOM
        container = createTaskListDOM();
        document.body.appendChild(container);
        
        // Clear mock storage
        mockStorage.clear();
        
        // Load storage and tasks modules into scope
        eval(storageCode);
        TaskList = eval(tasksCode + '; TaskList;');
        
        // Reset task list state
        TaskList.tasks = [];
        TaskList.container = null;
        TaskList.taskListElement = null;
        TaskList.taskInputElement = null;
        TaskList.addButtonElement = null;
    });

    afterEach(() => {
        // Cleanup
        if (container && container.parentNode) {
            document.body.removeChild(container);
        }
    });

    describe('UUID Generation', () => {
        it('should generate valid UUID v4 format', () => {
            const uuid = TaskList.generateUUID();
            expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
        });

        it('should generate unique UUIDs', () => {
            const uuid1 = TaskList.generateUUID();
            const uuid2 = TaskList.generateUUID();
            expect(uuid1).not.toBe(uuid2);
        });
    });

    describe('Task Text Validation', () => {
        it('should accept valid non-empty text', () => {
            expect(TaskList.validateTaskText('Buy groceries')).toBe(true);
        });

        it('should reject empty string', () => {
            expect(TaskList.validateTaskText('')).toBe(false);
        });

        it('should reject whitespace-only string', () => {
            expect(TaskList.validateTaskText('   ')).toBe(false);
            expect(TaskList.validateTaskText('\t\n')).toBe(false);
        });

        it('should accept text with leading/trailing whitespace', () => {
            expect(TaskList.validateTaskText('  Valid task  ')).toBe(true);
        });

        it('should reject text exceeding 500 characters', () => {
            const longText = 'a'.repeat(501);
            expect(TaskList.validateTaskText(longText)).toBe(false);
        });

        it('should accept text at exactly 500 characters', () => {
            const maxText = 'a'.repeat(500);
            expect(TaskList.validateTaskText(maxText)).toBe(true);
        });

        it('should reject non-string input', () => {
            expect(TaskList.validateTaskText(null)).toBe(false);
            expect(TaskList.validateTaskText(undefined)).toBe(false);
            expect(TaskList.validateTaskText(123)).toBe(false);
        });
    });

    describe('Task Object Creation', () => {
        it('should create task object with correct structure', () => {
            const task = TaskList.createTaskObject('Test task');
            
            expect(task).toHaveProperty('id');
            expect(task).toHaveProperty('text', 'Test task');
            expect(task).toHaveProperty('completed', false);
            expect(task).toHaveProperty('createdAt');
            expect(task).toHaveProperty('updatedAt');
        });

        it('should trim whitespace from task text', () => {
            const task = TaskList.createTaskObject('  Trimmed task  ');
            expect(task.text).toBe('Trimmed task');
        });

        it('should set timestamps', () => {
            const before = Date.now();
            const task = TaskList.createTaskObject('Test task');
            const after = Date.now();
            
            expect(task.createdAt).toBeGreaterThanOrEqual(before);
            expect(task.createdAt).toBeLessThanOrEqual(after);
            expect(task.updatedAt).toBe(task.createdAt);
        });

        it('should generate unique ID', () => {
            const task = TaskList.createTaskObject('Test task');
            expect(typeof task.id).toBe('string');
            expect(task.id.length).toBeGreaterThan(0);
        });
    });

    describe('Add Task Functionality', () => {
        it('should add valid task to tasks array', () => {
            const result = TaskList.addTask('New task');
            
            expect(result).toBe(true);
            expect(TaskList.tasks).toHaveLength(1);
            expect(TaskList.tasks[0].text).toBe('New task');
        });

        it('should reject empty task text', () => {
            const result = TaskList.addTask('');
            
            expect(result).toBe(false);
            expect(TaskList.tasks).toHaveLength(0);
        });

        it('should reject whitespace-only task text', () => {
            const result = TaskList.addTask('   ');
            
            expect(result).toBe(false);
            expect(TaskList.tasks).toHaveLength(0);
        });

        it('should save task to storage after adding', () => {
            TaskList.addTask('Stored task');
            
            const stored = Storage.getItem('tasks');
            expect(stored).toHaveLength(1);
            expect(stored[0].text).toBe('Stored task');
        });

        it('should add multiple tasks', () => {
            TaskList.addTask('Task 1');
            TaskList.addTask('Task 2');
            TaskList.addTask('Task 3');
            
            expect(TaskList.tasks).toHaveLength(3);
            expect(TaskList.tasks[0].text).toBe('Task 1');
            expect(TaskList.tasks[1].text).toBe('Task 2');
            expect(TaskList.tasks[2].text).toBe('Task 3');
        });
    });

    describe('Load Tasks from Storage', () => {
        it('should load tasks from storage on init', () => {
            const testTasks = [
                { id: '1', text: 'Task 1', completed: false, createdAt: Date.now(), updatedAt: Date.now() },
                { id: '2', text: 'Task 2', completed: true, createdAt: Date.now(), updatedAt: Date.now() }
            ];
            mockStorage.setItem('tasks', testTasks);
            
            TaskList.loadTasks();
            
            expect(TaskList.tasks).toHaveLength(2);
            expect(TaskList.tasks[0].text).toBe('Task 1');
            expect(TaskList.tasks[1].text).toBe('Task 2');
        });

        it('should initialize with empty array if no tasks in storage', () => {
            TaskList.loadTasks();
            
            expect(TaskList.tasks).toEqual([]);
        });
    });

    describe('Save Tasks to Storage', () => {
        it('should save tasks array to storage', () => {
            TaskList.tasks = [
                { id: '1', text: 'Task 1', completed: false, createdAt: Date.now(), updatedAt: Date.now() }
            ];
            
            TaskList.saveTasks();
            
            const stored = mockStorage.getItem('tasks');
            expect(stored).toHaveLength(1);
            expect(stored[0].text).toBe('Task 1');
        });

        it('should persist task completion status', () => {
            TaskList.tasks = [
                { id: '1', text: 'Task 1', completed: true, createdAt: Date.now(), updatedAt: Date.now() }
            ];
            
            TaskList.saveTasks();
            
            const stored = mockStorage.getItem('tasks');
            expect(stored[0].completed).toBe(true);
        });
    });

    describe('init() and DOM Integration', () => {
        it('should initialize and find DOM elements', () => {
            TaskList.init(container);
            
            expect(TaskList.taskListElement).toBeTruthy();
            expect(TaskList.taskInputElement).toBeTruthy();
            expect(TaskList.addButtonElement).toBeTruthy();
        });

        it('should load tasks from storage on init', () => {
            const testTasks = [
                { id: '1', text: 'Stored task', completed: false, createdAt: Date.now(), updatedAt: Date.now() }
            ];
            mockStorage.setItem('tasks', testTasks);
            
            TaskList.init(container);
            
            expect(TaskList.tasks).toHaveLength(1);
            expect(TaskList.tasks[0].text).toBe('Stored task');
        });

        it('should render existing tasks on init', () => {
            const testTasks = [
                { id: '1', text: 'Task 1', completed: false, createdAt: Date.now(), updatedAt: Date.now() },
                { id: '2', text: 'Task 2', completed: false, createdAt: Date.now(), updatedAt: Date.now() }
            ];
            mockStorage.setItem('tasks', testTasks);
            
            TaskList.init(container);
            
            const taskItems = container.querySelectorAll('.task-item');
            expect(taskItems.length).toBe(2);
        });
    });
});

describe('TaskList Component - Task 6.2 - Toggle Completion', () => {
    let container;
    let TaskList;

    beforeEach(() => {
        // Setup DOM
        container = createTaskListDOM();
        document.body.appendChild(container);
        
        // Clear mock storage
        mockStorage.clear();
        
        // Load storage and tasks modules into scope
        eval(storageCode);
        TaskList = eval(tasksCode + '; TaskList;');
        
        // Reset task list state
        TaskList.tasks = [];
        TaskList.container = null;
        TaskList.taskListElement = null;
        TaskList.taskInputElement = null;
        TaskList.addButtonElement = null;
    });

    afterEach(() => {
        // Cleanup
        if (container && container.parentNode) {
            document.body.removeChild(container);
        }
    });

    describe('toggleTask() Function', () => {
        it('should toggle task from uncompleted to completed', () => {
            TaskList.init(container);
            TaskList.addTask('Test task');
            const taskId = TaskList.tasks[0].id;
            
            const result = TaskList.toggleTask(taskId);
            
            expect(result).toBe(true);
            expect(TaskList.tasks[0].completed).toBe(true);
        });

        it('should toggle task from completed to uncompleted', () => {
            TaskList.init(container);
            TaskList.addTask('Test task');
            const taskId = TaskList.tasks[0].id;
            
            // Toggle to completed
            TaskList.toggleTask(taskId);
            expect(TaskList.tasks[0].completed).toBe(true);
            
            // Toggle back to uncompleted
            TaskList.toggleTask(taskId);
            expect(TaskList.tasks[0].completed).toBe(false);
        });

        it('should update updatedAt timestamp when toggling', () => {
            TaskList.init(container);
            TaskList.addTask('Test task');
            const taskId = TaskList.tasks[0].id;
            const originalTimestamp = TaskList.tasks[0].updatedAt;
            
            // Wait a bit to ensure timestamp changes
            const before = Date.now();
            TaskList.toggleTask(taskId);
            const after = Date.now();
            
            expect(TaskList.tasks[0].updatedAt).toBeGreaterThanOrEqual(before);
            expect(TaskList.tasks[0].updatedAt).toBeLessThanOrEqual(after);
            expect(TaskList.tasks[0].updatedAt).toBeGreaterThanOrEqual(originalTimestamp);
        });

        it('should save to storage after toggling', () => {
            TaskList.init(container);
            TaskList.addTask('Test task');
            const taskId = TaskList.tasks[0].id;
            
            TaskList.toggleTask(taskId);
            
            const stored = Storage.getItem('tasks');
            expect(stored[0].completed).toBe(true);
        });

        it('should return false for non-existent task ID', () => {
            TaskList.init(container);
            
            const result = TaskList.toggleTask('non-existent-id');
            
            expect(result).toBe(false);
        });

        it('should add completed class to DOM element when marking as completed', () => {
            TaskList.init(container);
            TaskList.addTask('Test task');
            const taskId = TaskList.tasks[0].id;
            
            TaskList.toggleTask(taskId);
            
            const taskElement = container.querySelector(`[data-task-id="${taskId}"]`);
            expect(taskElement.classList.contains('completed')).toBe(true);
        });

        it('should remove completed class from DOM element when marking as uncompleted', () => {
            TaskList.init(container);
            TaskList.addTask('Test task');
            const taskId = TaskList.tasks[0].id;
            
            // Toggle to completed
            TaskList.toggleTask(taskId);
            expect(container.querySelector(`[data-task-id="${taskId}"]`).classList.contains('completed')).toBe(true);
            
            // Toggle back to uncompleted
            TaskList.toggleTask(taskId);
            expect(container.querySelector(`[data-task-id="${taskId}"]`).classList.contains('completed')).toBe(false);
        });
    });

    describe('Checkbox Event Listener', () => {
        it('should toggle task when checkbox is clicked', () => {
            TaskList.init(container);
            TaskList.addTask('Test task');
            const taskId = TaskList.tasks[0].id;
            
            const checkbox = container.querySelector(`[data-task-id="${taskId}"] .task-checkbox`);
            checkbox.click();
            
            expect(TaskList.tasks[0].completed).toBe(true);
        });

        it('should update checkbox checked state when toggled', () => {
            TaskList.init(container);
            TaskList.addTask('Test task');
            const taskId = TaskList.tasks[0].id;
            
            const checkbox = container.querySelector(`[data-task-id="${taskId}"] .task-checkbox`);
            expect(checkbox.checked).toBe(false);
            
            checkbox.click();
            expect(checkbox.checked).toBe(true);
        });
    });

    describe('Visual Styling for Completed Tasks', () => {
        it('should render completed task with completed class on init', () => {
            const testTasks = [
                { id: '1', text: 'Completed task', completed: true, createdAt: Date.now(), updatedAt: Date.now() }
            ];
            mockStorage.setItem('tasks', testTasks);
            
            TaskList.init(container);
            
            const taskElement = container.querySelector('[data-task-id="1"]');
            expect(taskElement.classList.contains('completed')).toBe(true);
        });

        it('should render uncompleted task without completed class on init', () => {
            const testTasks = [
                { id: '1', text: 'Uncompleted task', completed: false, createdAt: Date.now(), updatedAt: Date.now() }
            ];
            mockStorage.setItem('tasks', testTasks);
            
            TaskList.init(container);
            
            const taskElement = container.querySelector('[data-task-id="1"]');
            expect(taskElement.classList.contains('completed')).toBe(false);
        });

        it('should set checkbox checked attribute for completed tasks on init', () => {
            const testTasks = [
                { id: '1', text: 'Completed task', completed: true, createdAt: Date.now(), updatedAt: Date.now() }
            ];
            mockStorage.setItem('tasks', testTasks);
            
            TaskList.init(container);
            
            const checkbox = container.querySelector('[data-task-id="1"] .task-checkbox');
            expect(checkbox.checked).toBe(true);
        });
    });
});

describe('TaskList Component - Task 6.3 - Edit Task', () => {
    let container;
    let TaskList;

    beforeEach(() => {
        // Setup DOM
        container = createTaskListDOM();
        document.body.appendChild(container);
        
        // Clear mock storage
        mockStorage.clear();
        
        // Load storage and tasks modules into scope
        eval(storageCode);
        TaskList = eval(tasksCode + '; TaskList;');
        
        // Reset task list state
        TaskList.tasks = [];
        TaskList.container = null;
        TaskList.taskListElement = null;
        TaskList.taskInputElement = null;
        TaskList.addButtonElement = null;
    });

    afterEach(() => {
        // Cleanup
        if (container && container.parentNode) {
            document.body.removeChild(container);
        }
    });

    describe('editTask() Function', () => {
        it('should update task text with valid new text', () => {
            TaskList.init(container);
            TaskList.addTask('Original task');
            const taskId = TaskList.tasks[0].id;
            
            const result = TaskList.editTask(taskId, 'Updated task');
            
            expect(result).toBe(true);
            expect(TaskList.tasks[0].text).toBe('Updated task');
        });

        it('should trim whitespace from new text', () => {
            TaskList.init(container);
            TaskList.addTask('Original task');
            const taskId = TaskList.tasks[0].id;
            
            TaskList.editTask(taskId, '  Updated task  ');
            
            expect(TaskList.tasks[0].text).toBe('Updated task');
        });

        it('should reject empty text', () => {
            TaskList.init(container);
            TaskList.addTask('Original task');
            const taskId = TaskList.tasks[0].id;
            
            const result = TaskList.editTask(taskId, '');
            
            expect(result).toBe(false);
            expect(TaskList.tasks[0].text).toBe('Original task');
        });

        it('should reject whitespace-only text', () => {
            TaskList.init(container);
            TaskList.addTask('Original task');
            const taskId = TaskList.tasks[0].id;
            
            const result = TaskList.editTask(taskId, '   ');
            
            expect(result).toBe(false);
            expect(TaskList.tasks[0].text).toBe('Original task');
        });

        it('should update updatedAt timestamp', () => {
            TaskList.init(container);
            TaskList.addTask('Original task');
            const taskId = TaskList.tasks[0].id;
            const originalTimestamp = TaskList.tasks[0].updatedAt;
            
            const before = Date.now();
            TaskList.editTask(taskId, 'Updated task');
            const after = Date.now();
            
            expect(TaskList.tasks[0].updatedAt).toBeGreaterThanOrEqual(before);
            expect(TaskList.tasks[0].updatedAt).toBeLessThanOrEqual(after);
            expect(TaskList.tasks[0].updatedAt).toBeGreaterThanOrEqual(originalTimestamp);
        });

        it('should preserve task ID when editing', () => {
            TaskList.init(container);
            TaskList.addTask('Original task');
            const taskId = TaskList.tasks[0].id;
            
            TaskList.editTask(taskId, 'Updated task');
            
            expect(TaskList.tasks[0].id).toBe(taskId);
        });

        it('should preserve completion status when editing', () => {
            TaskList.init(container);
            TaskList.addTask('Original task');
            const taskId = TaskList.tasks[0].id;
            TaskList.toggleTask(taskId); // Mark as completed
            
            TaskList.editTask(taskId, 'Updated task');
            
            expect(TaskList.tasks[0].completed).toBe(true);
        });

        it('should save to storage after editing', () => {
            TaskList.init(container);
            TaskList.addTask('Original task');
            const taskId = TaskList.tasks[0].id;
            
            TaskList.editTask(taskId, 'Updated task');
            
            const stored = Storage.getItem('tasks');
            expect(stored[0].text).toBe('Updated task');
        });

        it('should return false for non-existent task ID', () => {
            TaskList.init(container);
            
            const result = TaskList.editTask('non-existent-id', 'New text');
            
            expect(result).toBe(false);
        });

        it('should update DOM text content after editing', () => {
            TaskList.init(container);
            TaskList.addTask('Original task');
            const taskId = TaskList.tasks[0].id;
            
            TaskList.editTask(taskId, 'Updated task');
            
            const textSpan = container.querySelector(`[data-task-id="${taskId}"] .task-text`);
            expect(textSpan.textContent).toBe('Updated task');
        });

        it('should reject text exceeding 500 characters', () => {
            TaskList.init(container);
            TaskList.addTask('Original task');
            const taskId = TaskList.tasks[0].id;
            const longText = 'a'.repeat(501);
            
            const result = TaskList.editTask(taskId, longText);
            
            expect(result).toBe(false);
            expect(TaskList.tasks[0].text).toBe('Original task');
        });

        it('should accept text at exactly 500 characters', () => {
            TaskList.init(container);
            TaskList.addTask('Original task');
            const taskId = TaskList.tasks[0].id;
            const maxText = 'a'.repeat(500);
            
            const result = TaskList.editTask(taskId, maxText);
            
            expect(result).toBe(true);
            expect(TaskList.tasks[0].text).toBe(maxText);
        });
    });

    describe('Edit Mode UI', () => {
        it('should render edit button for each task', () => {
            TaskList.init(container);
            TaskList.addTask('Test task');
            
            const editButton = container.querySelector('.btn-edit-task');
            expect(editButton).toBeTruthy();
            expect(editButton.textContent).toBe('Edit');
        });

        it('should render hidden edit input field for each task', () => {
            TaskList.init(container);
            TaskList.addTask('Test task');
            
            const editInput = container.querySelector('.task-edit-input');
            expect(editInput).toBeTruthy();
            expect(editInput.type).toBe('text');
            expect(editInput.maxLength).toBe(500);
        });

        it('should set edit input value to current task text', () => {
            TaskList.init(container);
            TaskList.addTask('Test task');
            
            const editInput = container.querySelector('.task-edit-input');
            expect(editInput.value).toBe('Test task');
        });

        it('should add editing class when entering edit mode', () => {
            TaskList.init(container);
            TaskList.addTask('Test task');
            const taskId = TaskList.tasks[0].id;
            
            TaskList.enterEditMode(taskId);
            
            const taskElement = container.querySelector(`[data-task-id="${taskId}"]`);
            expect(taskElement.classList.contains('editing')).toBe(true);
        });

        it('should change edit button to save button in edit mode', () => {
            TaskList.init(container);
            TaskList.addTask('Test task');
            const taskId = TaskList.tasks[0].id;
            
            TaskList.enterEditMode(taskId);
            
            const editButton = container.querySelector(`[data-task-id="${taskId}"] .btn-edit-task`);
            expect(editButton.textContent).toBe('Save');
        });

        it('should remove editing class when exiting edit mode', () => {
            TaskList.init(container);
            TaskList.addTask('Test task');
            const taskId = TaskList.tasks[0].id;
            
            TaskList.enterEditMode(taskId);
            TaskList.exitEditMode(taskId);
            
            const taskElement = container.querySelector(`[data-task-id="${taskId}"]`);
            expect(taskElement.classList.contains('editing')).toBe(false);
        });

        it('should change save button back to edit button when exiting edit mode', () => {
            TaskList.init(container);
            TaskList.addTask('Test task');
            const taskId = TaskList.tasks[0].id;
            
            TaskList.enterEditMode(taskId);
            TaskList.exitEditMode(taskId);
            
            const editButton = container.querySelector(`[data-task-id="${taskId}"] .btn-edit-task`);
            expect(editButton.textContent).toBe('Edit');
        });

        it('should save edit and exit edit mode when saveEdit is called', () => {
            TaskList.init(container);
            TaskList.addTask('Original task');
            const taskId = TaskList.tasks[0].id;
            
            TaskList.enterEditMode(taskId);
            const editInput = container.querySelector(`[data-task-id="${taskId}"] .task-edit-input`);
            editInput.value = 'Updated task';
            TaskList.saveEdit(taskId);
            
            expect(TaskList.tasks[0].text).toBe('Updated task');
            const taskElement = container.querySelector(`[data-task-id="${taskId}"]`);
            expect(taskElement.classList.contains('editing')).toBe(false);
        });

        it('should reset input value to current task text when exiting edit mode without saving', () => {
            TaskList.init(container);
            TaskList.addTask('Original task');
            const taskId = TaskList.tasks[0].id;
            
            TaskList.enterEditMode(taskId);
            const editInput = container.querySelector(`[data-task-id="${taskId}"] .task-edit-input`);
            editInput.value = 'Changed but not saved';
            TaskList.exitEditMode(taskId);
            
            expect(editInput.value).toBe('Original task');
            expect(TaskList.tasks[0].text).toBe('Original task');
        });
    });
});

describe('TaskList Component - Task 6.4 - Delete Task', () => {
    let container;
    let TaskList;

    beforeEach(() => {
        // Setup DOM
        container = createTaskListDOM();
        document.body.appendChild(container);
        
        // Clear mock storage
        mockStorage.clear();
        
        // Load storage and tasks modules into scope
        eval(storageCode);
        TaskList = eval(tasksCode + '; TaskList;');
        
        // Reset task list state
        TaskList.tasks = [];
        TaskList.container = null;
        TaskList.taskListElement = null;
        TaskList.taskInputElement = null;
        TaskList.addButtonElement = null;
    });

    afterEach(() => {
        // Cleanup
        if (container && container.parentNode) {
            document.body.removeChild(container);
        }
    });

    describe('deleteTask() Function', () => {
        it('should remove task from tasks array', () => {
            TaskList.init(container);
            TaskList.addTask('Task to delete');
            const taskId = TaskList.tasks[0].id;
            
            const result = TaskList.deleteTask(taskId);
            
            expect(result).toBe(true);
            expect(TaskList.tasks).toHaveLength(0);
        });

        it('should remove task from DOM', () => {
            TaskList.init(container);
            TaskList.addTask('Task to delete');
            const taskId = TaskList.tasks[0].id;
            
            TaskList.deleteTask(taskId);
            
            const taskElement = container.querySelector(`[data-task-id="${taskId}"]`);
            expect(taskElement).toBeNull();
        });

        it('should remove task from storage', () => {
            TaskList.init(container);
            TaskList.addTask('Task to delete');
            const taskId = TaskList.tasks[0].id;
            
            TaskList.deleteTask(taskId);
            
            const stored = Storage.getItem('tasks');
            expect(stored).toHaveLength(0);
        });

        it('should return false for non-existent task ID', () => {
            TaskList.init(container);
            
            const result = TaskList.deleteTask('non-existent-id');
            
            expect(result).toBe(false);
        });

        it('should delete correct task when multiple tasks exist', () => {
            TaskList.init(container);
            TaskList.addTask('Task 1');
            TaskList.addTask('Task 2');
            TaskList.addTask('Task 3');
            const task2Id = TaskList.tasks[1].id;
            
            TaskList.deleteTask(task2Id);
            
            expect(TaskList.tasks).toHaveLength(2);
            expect(TaskList.tasks[0].text).toBe('Task 1');
            expect(TaskList.tasks[1].text).toBe('Task 3');
        });

        it('should preserve other tasks in storage after deletion', () => {
            TaskList.init(container);
            TaskList.addTask('Task 1');
            TaskList.addTask('Task 2');
            TaskList.addTask('Task 3');
            const task2Id = TaskList.tasks[1].id;
            
            TaskList.deleteTask(task2Id);
            
            const stored = Storage.getItem('tasks');
            expect(stored).toHaveLength(2);
            expect(stored[0].text).toBe('Task 1');
            expect(stored[1].text).toBe('Task 3');
        });

        it('should delete completed task', () => {
            TaskList.init(container);
            TaskList.addTask('Completed task');
            const taskId = TaskList.tasks[0].id;
            TaskList.toggleTask(taskId); // Mark as completed
            
            const result = TaskList.deleteTask(taskId);
            
            expect(result).toBe(true);
            expect(TaskList.tasks).toHaveLength(0);
        });

        it('should delete uncompleted task', () => {
            TaskList.init(container);
            TaskList.addTask('Uncompleted task');
            const taskId = TaskList.tasks[0].id;
            
            const result = TaskList.deleteTask(taskId);
            
            expect(result).toBe(true);
            expect(TaskList.tasks).toHaveLength(0);
        });
    });

    describe('Delete Button UI', () => {
        it('should render delete button for each task', () => {
            TaskList.init(container);
            TaskList.addTask('Test task');
            
            const deleteButton = container.querySelector('.btn-delete-task');
            expect(deleteButton).toBeTruthy();
            expect(deleteButton.textContent).toBe('Delete');
        });

        it('should delete task when delete button is clicked', () => {
            TaskList.init(container);
            TaskList.addTask('Test task');
            const taskId = TaskList.tasks[0].id;
            
            const deleteButton = container.querySelector(`[data-task-id="${taskId}"] .btn-delete-task`);
            deleteButton.click();
            
            expect(TaskList.tasks).toHaveLength(0);
            expect(container.querySelector(`[data-task-id="${taskId}"]`)).toBeNull();
        });

        it('should have aria-label for accessibility', () => {
            TaskList.init(container);
            TaskList.addTask('Test task');
            
            const deleteButton = container.querySelector('.btn-delete-task');
            expect(deleteButton.getAttribute('aria-label')).toBe('Delete task');
        });
    });
});

describe('TaskList Component - Task 7.1 - Duplicate Detection', () => {
    let container;
    let TaskList;

    beforeEach(() => {
        // Setup DOM
        container = createTaskListDOM();
        document.body.appendChild(container);
        
        // Clear mock storage
        mockStorage.clear();
        
        // Load storage and tasks modules into scope
        eval(storageCode);
        TaskList = eval(tasksCode + '; TaskList;');
        
        // Reset task list state
        TaskList.tasks = [];
        TaskList.container = null;
        TaskList.taskListElement = null;
        TaskList.taskInputElement = null;
        TaskList.addButtonElement = null;
        TaskList.notificationTimeout = null;
    });

    afterEach(() => {
        // Cleanup
        if (container && container.parentNode) {
            document.body.removeChild(container);
        }
        // Clear any pending notification timeouts
        if (TaskList.notificationTimeout) {
            clearTimeout(TaskList.notificationTimeout);
        }
    });

    describe('isDuplicate() Function', () => {
        it('should return false when no tasks exist', () => {
            TaskList.init(container);
            
            const result = TaskList.isDuplicate('New task');
            
            expect(result).toBe(false);
        });

        it('should return true for exact duplicate text', () => {
            TaskList.init(container);
            TaskList.addTask('Buy groceries');
            
            const result = TaskList.isDuplicate('Buy groceries');
            
            expect(result).toBe(true);
        });

        it('should return true for case-insensitive duplicate', () => {
            TaskList.init(container);
            TaskList.addTask('Buy groceries');
            
            expect(TaskList.isDuplicate('buy groceries')).toBe(true);
            expect(TaskList.isDuplicate('BUY GROCERIES')).toBe(true);
            expect(TaskList.isDuplicate('BuY GrOcErIeS')).toBe(true);
        });

        it('should return true when duplicate has leading/trailing whitespace', () => {
            TaskList.init(container);
            TaskList.addTask('Buy groceries');
            
            expect(TaskList.isDuplicate('  Buy groceries  ')).toBe(true);
            expect(TaskList.isDuplicate('\tBuy groceries\n')).toBe(true);
        });

        it('should return true when original has whitespace and duplicate does not', () => {
            TaskList.init(container);
            TaskList.addTask('  Buy groceries  ');
            
            const result = TaskList.isDuplicate('Buy groceries');
            
            expect(result).toBe(true);
        });

        it('should return false for non-duplicate text', () => {
            TaskList.init(container);
            TaskList.addTask('Buy groceries');
            
            expect(TaskList.isDuplicate('Buy milk')).toBe(false);
            expect(TaskList.isDuplicate('Groceries')).toBe(false);
        });

        it('should return false for non-string input', () => {
            TaskList.init(container);
            TaskList.addTask('Buy groceries');
            
            expect(TaskList.isDuplicate(null)).toBe(false);
            expect(TaskList.isDuplicate(undefined)).toBe(false);
            expect(TaskList.isDuplicate(123)).toBe(false);
        });

        it('should check against all existing tasks', () => {
            TaskList.init(container);
            TaskList.addTask('Task 1');
            TaskList.addTask('Task 2');
            TaskList.addTask('Task 3');
            
            expect(TaskList.isDuplicate('Task 1')).toBe(true);
            expect(TaskList.isDuplicate('Task 2')).toBe(true);
            expect(TaskList.isDuplicate('Task 3')).toBe(true);
            expect(TaskList.isDuplicate('Task 4')).toBe(false);
        });
    });

    describe('Duplicate Prevention in addTask()', () => {
        it('should prevent adding duplicate task', () => {
            TaskList.init(container);
            TaskList.addTask('Buy groceries');
            
            const result = TaskList.addTask('Buy groceries');
            
            expect(result).toBe(false);
            expect(TaskList.tasks).toHaveLength(1);
        });

        it('should prevent adding case-insensitive duplicate', () => {
            TaskList.init(container);
            TaskList.addTask('Buy groceries');
            
            const result = TaskList.addTask('BUY GROCERIES');
            
            expect(result).toBe(false);
            expect(TaskList.tasks).toHaveLength(1);
        });

        it('should prevent adding duplicate with different whitespace', () => {
            TaskList.init(container);
            TaskList.addTask('Buy groceries');
            
            const result = TaskList.addTask('  Buy groceries  ');
            
            expect(result).toBe(false);
            expect(TaskList.tasks).toHaveLength(1);
        });

        it('should not save duplicate to storage', () => {
            TaskList.init(container);
            TaskList.addTask('Buy groceries');
            
            TaskList.addTask('Buy groceries');
            
            const stored = Storage.getItem('tasks');
            expect(stored).toHaveLength(1);
        });

        it('should not render duplicate in DOM', () => {
            TaskList.init(container);
            TaskList.addTask('Buy groceries');
            
            TaskList.addTask('Buy groceries');
            
            const taskItems = container.querySelectorAll('.task-item');
            expect(taskItems.length).toBe(1);
        });

        it('should allow adding non-duplicate tasks', () => {
            TaskList.init(container);
            TaskList.addTask('Buy groceries');
            
            const result = TaskList.addTask('Buy milk');
            
            expect(result).toBe(true);
            expect(TaskList.tasks).toHaveLength(2);
        });
    });

    describe('Duplicate Notification', () => {
        it('should display notification when duplicate detected', () => {
            TaskList.init(container);
            TaskList.addTask('Buy groceries');
            
            TaskList.addTask('Buy groceries');
            
            const notification = container.querySelector('.task-notification');
            expect(notification.textContent).toBe('This task already exists');
            expect(notification.classList.contains('visible')).toBe(true);
        });

        it('should display notification for case-insensitive duplicate', () => {
            TaskList.init(container);
            TaskList.addTask('Buy groceries');
            
            TaskList.addTask('BUY GROCERIES');
            
            const notification = container.querySelector('.task-notification');
            expect(notification.textContent).toBe('This task already exists');
        });

        it('should not display notification for non-duplicate', () => {
            TaskList.init(container);
            TaskList.addTask('Buy groceries');
            
            TaskList.addTask('Buy milk');
            
            const notification = container.querySelector('.task-notification');
            expect(notification.textContent).toBe('');
        });

        it('should clear notification after timeout', (done) => {
            TaskList.init(container);
            TaskList.addTask('Buy groceries');
            
            TaskList.addTask('Buy groceries');
            
            const notification = container.querySelector('.task-notification');
            expect(notification.textContent).toBe('This task already exists');
            
            // Wait for notification to clear (default 3000ms)
            setTimeout(() => {
                expect(notification.textContent).toBe('');
                expect(notification.classList.contains('visible')).toBe(false);
                done();
            }, 3100);
        }, 4000);

        it('should handle multiple notifications by clearing previous timeout', () => {
            TaskList.init(container);
            TaskList.addTask('Task 1');
            TaskList.addTask('Task 2');
            
            // Trigger first notification
            TaskList.addTask('Task 1');
            const notification = container.querySelector('.task-notification');
            expect(notification.textContent).toBe('This task already exists');
            
            // Trigger second notification immediately
            TaskList.addTask('Task 2');
            expect(notification.textContent).toBe('This task already exists');
            expect(notification.classList.contains('visible')).toBe(true);
        });
    });

    describe('showNotification() Function', () => {
        it('should display notification with custom message', () => {
            TaskList.init(container);
            
            TaskList.showNotification('Test notification');
            
            const notification = container.querySelector('.task-notification');
            expect(notification.textContent).toBe('Test notification');
            expect(notification.classList.contains('visible')).toBe(true);
        });

        it('should handle missing notification element gracefully', () => {
            TaskList.init(container);
            
            // Remove notification element
            const notification = container.querySelector('.task-notification');
            notification.remove();
            
            // Should not throw error
            expect(() => {
                TaskList.showNotification('Test');
            }).not.toThrow();
        });

        it('should accept custom duration', (done) => {
            TaskList.init(container);
            
            TaskList.showNotification('Test', 500);
            
            const notification = container.querySelector('.task-notification');
            expect(notification.textContent).toBe('Test');
            
            setTimeout(() => {
                expect(notification.textContent).toBe('');
                done();
            }, 600);
        }, 1000);
    });
});

describe('TaskList Component - Task 7.2 - Sort Tasks', () => {
    let container;
    let TaskList;

    beforeEach(() => {
        // Setup DOM
        container = createTaskListDOM();
        document.body.appendChild(container);
        
        // Clear mock storage
        mockStorage.clear();
        
        // Load storage and tasks modules into scope
        eval(storageCode);
        TaskList = eval(tasksCode + '; TaskList;');
        
        // Reset task list state
        TaskList.tasks = [];
        TaskList.container = null;
        TaskList.taskListElement = null;
        TaskList.taskInputElement = null;
        TaskList.addButtonElement = null;
    });

    afterEach(() => {
        // Cleanup
        if (container && container.parentNode) {
            document.body.removeChild(container);
        }
    });

    describe('sortTasks() - Alphabetical Sorting', () => {
        it('should sort tasks alphabetically by text', () => {
            TaskList.init(container);
            TaskList.addTask('Zebra');
            TaskList.addTask('Apple');
            TaskList.addTask('Mango');
            
            TaskList.sortTasks('alphabetical');
            
            expect(TaskList.tasks[0].text).toBe('Apple');
            expect(TaskList.tasks[1].text).toBe('Mango');
            expect(TaskList.tasks[2].text).toBe('Zebra');
        });

        it('should sort case-insensitively', () => {
            TaskList.init(container);
            TaskList.addTask('zebra');
            TaskList.addTask('Apple');
            TaskList.addTask('MANGO');
            
            TaskList.sortTasks('alphabetical');
            
            expect(TaskList.tasks[0].text).toBe('Apple');
            expect(TaskList.tasks[1].text).toBe('MANGO');
            expect(TaskList.tasks[2].text).toBe('zebra');
        });

        it('should handle single task', () => {
            TaskList.init(container);
            TaskList.addTask('Single task');
            
            TaskList.sortTasks('alphabetical');
            
            expect(TaskList.tasks).toHaveLength(1);
            expect(TaskList.tasks[0].text).toBe('Single task');
        });

        it('should handle empty task list', () => {
            TaskList.init(container);
            
            TaskList.sortTasks('alphabetical');
            
            expect(TaskList.tasks).toHaveLength(0);
        });

        it('should save sorted order to storage', () => {
            TaskList.init(container);
            TaskList.addTask('Zebra');
            TaskList.addTask('Apple');
            
            TaskList.sortTasks('alphabetical');
            
            const stored = Storage.getItem('tasks');
            expect(stored[0].text).toBe('Apple');
            expect(stored[1].text).toBe('Zebra');
        });

        it('should re-render task list after sorting', () => {
            TaskList.init(container);
            TaskList.addTask('Zebra');
            TaskList.addTask('Apple');
            
            TaskList.sortTasks('alphabetical');
            
            const taskItems = container.querySelectorAll('.task-item');
            expect(taskItems[0].querySelector('.task-text').textContent).toBe('Apple');
            expect(taskItems[1].querySelector('.task-text').textContent).toBe('Zebra');
        });

        it('should preserve task properties during sorting', () => {
            TaskList.init(container);
            TaskList.addTask('Zebra');
            TaskList.addTask('Apple');
            const zebraId = TaskList.tasks[0].id;
            const appleId = TaskList.tasks[1].id;
            TaskList.toggleTask(zebraId); // Mark Zebra as completed
            
            TaskList.sortTasks('alphabetical');
            
            // Apple should be first
            expect(TaskList.tasks[0].text).toBe('Apple');
            expect(TaskList.tasks[0].id).toBe(appleId);
            expect(TaskList.tasks[0].completed).toBe(false);
            
            // Zebra should be second
            expect(TaskList.tasks[1].text).toBe('Zebra');
            expect(TaskList.tasks[1].id).toBe(zebraId);
            expect(TaskList.tasks[1].completed).toBe(true);
        });
    });

    describe('sortTasks() - Completion Status Sorting', () => {
        it('should sort uncompleted tasks before completed tasks', () => {
            TaskList.init(container);
            TaskList.addTask('Task 1');
            TaskList.addTask('Task 2');
            TaskList.addTask('Task 3');
            
            // Mark Task 1 and Task 3 as completed
            TaskList.toggleTask(TaskList.tasks[0].id);
            TaskList.toggleTask(TaskList.tasks[2].id);
            
            TaskList.sortTasks('completion');
            
            // Task 2 (uncompleted) should be first
            expect(TaskList.tasks[0].text).toBe('Task 2');
            expect(TaskList.tasks[0].completed).toBe(false);
            
            // Task 1 and Task 3 (completed) should be after
            expect(TaskList.tasks[1].completed).toBe(true);
            expect(TaskList.tasks[2].completed).toBe(true);
        });

        it('should handle all completed tasks', () => {
            TaskList.init(container);
            TaskList.addTask('Task 1');
            TaskList.addTask('Task 2');
            
            TaskList.toggleTask(TaskList.tasks[0].id);
            TaskList.toggleTask(TaskList.tasks[1].id);
            
            TaskList.sortTasks('completion');
            
            expect(TaskList.tasks[0].completed).toBe(true);
            expect(TaskList.tasks[1].completed).toBe(true);
        });

        it('should handle all uncompleted tasks', () => {
            TaskList.init(container);
            TaskList.addTask('Task 1');
            TaskList.addTask('Task 2');
            
            TaskList.sortTasks('completion');
            
            expect(TaskList.tasks[0].completed).toBe(false);
            expect(TaskList.tasks[1].completed).toBe(false);
        });

        it('should handle single task', () => {
            TaskList.init(container);
            TaskList.addTask('Single task');
            
            TaskList.sortTasks('completion');
            
            expect(TaskList.tasks).toHaveLength(1);
            expect(TaskList.tasks[0].text).toBe('Single task');
        });

        it('should save sorted order to storage', () => {
            TaskList.init(container);
            TaskList.addTask('Task 1');
            TaskList.addTask('Task 2');
            TaskList.toggleTask(TaskList.tasks[0].id);
            
            TaskList.sortTasks('completion');
            
            const stored = Storage.getItem('tasks');
            expect(stored[0].completed).toBe(false);
            expect(stored[1].completed).toBe(true);
        });

        it('should re-render task list after sorting', () => {
            TaskList.init(container);
            TaskList.addTask('Task 1');
            TaskList.addTask('Task 2');
            TaskList.toggleTask(TaskList.tasks[0].id);
            
            TaskList.sortTasks('completion');
            
            const taskItems = container.querySelectorAll('.task-item');
            expect(taskItems[0].classList.contains('completed')).toBe(false);
            expect(taskItems[1].classList.contains('completed')).toBe(true);
        });

        it('should preserve task properties during sorting', () => {
            TaskList.init(container);
            TaskList.addTask('Completed task');
            TaskList.addTask('Uncompleted task');
            const completedId = TaskList.tasks[0].id;
            const uncompletedId = TaskList.tasks[1].id;
            TaskList.toggleTask(completedId);
            
            TaskList.sortTasks('completion');
            
            // Uncompleted should be first
            expect(TaskList.tasks[0].text).toBe('Uncompleted task');
            expect(TaskList.tasks[0].id).toBe(uncompletedId);
            expect(TaskList.tasks[0].completed).toBe(false);
            
            // Completed should be second
            expect(TaskList.tasks[1].text).toBe('Completed task');
            expect(TaskList.tasks[1].id).toBe(completedId);
            expect(TaskList.tasks[1].completed).toBe(true);
        });
    });

    describe('Sort Button Event Listeners', () => {
        it('should wire up alphabetical sort button', () => {
            TaskList.init(container);
            TaskList.addTask('Zebra');
            TaskList.addTask('Apple');
            
            const sortAlphaButton = container.querySelector('.btn-sort-alpha');
            sortAlphaButton.click();
            
            expect(TaskList.tasks[0].text).toBe('Apple');
            expect(TaskList.tasks[1].text).toBe('Zebra');
        });

        it('should wire up completion status sort button', () => {
            TaskList.init(container);
            TaskList.addTask('Task 1');
            TaskList.addTask('Task 2');
            TaskList.toggleTask(TaskList.tasks[0].id);
            
            const sortStatusButton = container.querySelector('.btn-sort-status');
            sortStatusButton.click();
            
            expect(TaskList.tasks[0].completed).toBe(false);
            expect(TaskList.tasks[1].completed).toBe(true);
        });

        it('should handle missing sort buttons gracefully', () => {
            // Remove sort buttons
            const sortControls = container.querySelector('.task-sort-controls');
            sortControls.remove();
            
            // Should not throw error during init
            expect(() => {
                TaskList.init(container);
            }).not.toThrow();
        });
    });
});

describe('TaskList Component - Task 7.3 - Drag and Drop Reordering', () => {
    let container;
    let TaskList;

    beforeEach(() => {
        // Setup DOM
        container = createTaskListDOM();
        document.body.appendChild(container);
        
        // Clear mock storage
        mockStorage.clear();
        
        // Load storage and tasks modules into scope
        eval(storageCode);
        TaskList = eval(tasksCode + '; TaskList;');
        
        // Reset task list state
        TaskList.tasks = [];
        TaskList.container = null;
        TaskList.taskListElement = null;
        TaskList.taskInputElement = null;
        TaskList.addButtonElement = null;
    });

    afterEach(() => {
        // Cleanup
        if (container && container.parentNode) {
            document.body.removeChild(container);
        }
    });

    describe('reorderTasks() Function', () => {
        it('should reorder task to new position', () => {
            TaskList.init(container);
            TaskList.addTask('Task 1');
            TaskList.addTask('Task 2');
            TaskList.addTask('Task 3');
            
            const task1Id = TaskList.tasks[0].id;
            
            // Move Task 1 to position 2 (index 2)
            const result = TaskList.reorderTasks(task1Id, 2);
            
            expect(result).toBe(true);
            expect(TaskList.tasks[0].text).toBe('Task 2');
            expect(TaskList.tasks[1].text).toBe('Task 3');
            expect(TaskList.tasks[2].text).toBe('Task 1');
        });

        it('should move task from end to beginning', () => {
            TaskList.init(container);
            TaskList.addTask('Task 1');
            TaskList.addTask('Task 2');
            TaskList.addTask('Task 3');
            
            const task3Id = TaskList.tasks[2].id;
            
            // Move Task 3 to position 0
            const result = TaskList.reorderTasks(task3Id, 0);
            
            expect(result).toBe(true);
            expect(TaskList.tasks[0].text).toBe('Task 3');
            expect(TaskList.tasks[1].text).toBe('Task 1');
            expect(TaskList.tasks[2].text).toBe('Task 2');
        });

        it('should return false for non-existent task ID', () => {
            TaskList.init(container);
            TaskList.addTask('Task 1');
            
            const result = TaskList.reorderTasks('non-existent-id', 0);
            
            expect(result).toBe(false);
        });

        it('should return false for invalid index (negative)', () => {
            TaskList.init(container);
            TaskList.addTask('Task 1');
            const taskId = TaskList.tasks[0].id;
            
            const result = TaskList.reorderTasks(taskId, -1);
            
            expect(result).toBe(false);
        });

        it('should return false for invalid index (out of bounds)', () => {
            TaskList.init(container);
            TaskList.addTask('Task 1');
            TaskList.addTask('Task 2');
            const taskId = TaskList.tasks[0].id;
            
            const result = TaskList.reorderTasks(taskId, 5);
            
            expect(result).toBe(false);
        });

        it('should return true when moving to same position', () => {
            TaskList.init(container);
            TaskList.addTask('Task 1');
            TaskList.addTask('Task 2');
            const taskId = TaskList.tasks[0].id;
            
            const result = TaskList.reorderTasks(taskId, 0);
            
            expect(result).toBe(true);
            expect(TaskList.tasks[0].id).toBe(taskId);
        });

        it('should save task order to storage after reordering', () => {
            TaskList.init(container);
            TaskList.addTask('Task 1');
            TaskList.addTask('Task 2');
            TaskList.addTask('Task 3');
            
            const task1Id = TaskList.tasks[0].id;
            const task2Id = TaskList.tasks[1].id;
            const task3Id = TaskList.tasks[2].id;
            
            TaskList.reorderTasks(task1Id, 2);
            
            const savedOrder = Storage.getItem('taskOrder');
            expect(savedOrder).toEqual([task2Id, task3Id, task1Id]);
        });

        it('should re-render tasks after reordering', () => {
            TaskList.init(container);
            TaskList.addTask('Task 1');
            TaskList.addTask('Task 2');
            TaskList.addTask('Task 3');
            
            const task1Id = TaskList.tasks[0].id;
            
            TaskList.reorderTasks(task1Id, 2);
            
            const taskItems = container.querySelectorAll('.task-item');
            expect(taskItems[0].querySelector('.task-text').textContent).toBe('Task 2');
            expect(taskItems[1].querySelector('.task-text').textContent).toBe('Task 3');
            expect(taskItems[2].querySelector('.task-text').textContent).toBe('Task 1');
        });
    });

    describe('Task Order Persistence', () => {
        it('should save task order when tasks are reordered', () => {
            TaskList.init(container);
            TaskList.addTask('Task 1');
            TaskList.addTask('Task 2');
            
            const task1Id = TaskList.tasks[0].id;
            const task2Id = TaskList.tasks[1].id;
            
            TaskList.reorderTasks(task1Id, 1);
            
            const savedOrder = Storage.getItem('taskOrder');
            expect(savedOrder).toEqual([task2Id, task1Id]);
        });

        it('should load and apply saved task order on init', () => {
            TaskList.init(container);
            TaskList.addTask('Task 1');
            TaskList.addTask('Task 2');
            TaskList.addTask('Task 3');
            
            const task1Id = TaskList.tasks[0].id;
            const task2Id = TaskList.tasks[1].id;
            const task3Id = TaskList.tasks[2].id;
            
            // Save a custom order
            const customOrder = [task3Id, task1Id, task2Id];
            mockStorage.setItem('taskOrder', customOrder);
            
            // Reload tasks
            TaskList.loadTasks();
            
            expect(TaskList.tasks[0].id).toBe(task3Id);
            expect(TaskList.tasks[1].id).toBe(task1Id);
            expect(TaskList.tasks[2].id).toBe(task2Id);
        });

        it('should use creation order when no saved order exists', () => {
            TaskList.init(container);
            TaskList.addTask('Task 1');
            TaskList.addTask('Task 2');
            TaskList.addTask('Task 3');
            
            const task1Id = TaskList.tasks[0].id;
            const task2Id = TaskList.tasks[1].id;
            const task3Id = TaskList.tasks[2].id;
            
            // Reload tasks without saved order
            TaskList.loadTasks();
            
            expect(TaskList.tasks[0].id).toBe(task1Id);
            expect(TaskList.tasks[1].id).toBe(task2Id);
            expect(TaskList.tasks[2].id).toBe(task3Id);
        });

        it('should handle tasks not in saved order (newly added)', () => {
            TaskList.init(container);
            TaskList.addTask('Task 1');
            TaskList.addTask('Task 2');
            
            const task1Id = TaskList.tasks[0].id;
            const task2Id = TaskList.tasks[1].id;
            
            // Save order with only task1
            mockStorage.setItem('taskOrder', [task1Id]);
            
            // Reload tasks
            TaskList.loadTasks();
            
            // Task 1 should be first (from saved order), Task 2 should be second (not in saved order)
            expect(TaskList.tasks[0].id).toBe(task1Id);
            expect(TaskList.tasks[1].id).toBe(task2Id);
        });

        it('should save task order when sorting alphabetically', () => {
            TaskList.init(container);
            TaskList.addTask('Zebra');
            TaskList.addTask('Apple');
            
            TaskList.sortTasks('alphabetical');
            
            const savedOrder = Storage.getItem('taskOrder');
            expect(savedOrder).toHaveLength(2);
            expect(TaskList.tasks[0].text).toBe('Apple');
            expect(savedOrder[0]).toBe(TaskList.tasks[0].id);
        });

        it('should save task order when sorting by completion status', () => {
            TaskList.init(container);
            TaskList.addTask('Task 1');
            TaskList.addTask('Task 2');
            TaskList.toggleTask(TaskList.tasks[0].id);
            
            TaskList.sortTasks('completion');
            
            const savedOrder = Storage.getItem('taskOrder');
            expect(savedOrder).toHaveLength(2);
            expect(TaskList.tasks[0].completed).toBe(false);
            expect(savedOrder[0]).toBe(TaskList.tasks[0].id);
        });
    });

    describe('Drag Event Listeners', () => {
        it('should add draggable attribute to task items', () => {
            TaskList.init(container);
            TaskList.addTask('Task 1');
            
            const taskItem = container.querySelector('.task-item');
            expect(taskItem.getAttribute('draggable')).toBe('true');
        });

        it('should set draggedTaskId on dragstart', () => {
            TaskList.init(container);
            TaskList.addTask('Task 1');
            const taskId = TaskList.tasks[0].id;
            
            const taskItem = container.querySelector('.task-item');
            const dragEvent = new Event('dragstart');
            dragEvent.dataTransfer = {
                effectAllowed: '',
                setData: jest.fn()
            };
            
            taskItem.dispatchEvent(dragEvent);
            
            expect(TaskList.draggedTaskId).toBe(taskId);
        });

        it('should clear draggedTaskId on dragend', () => {
            TaskList.init(container);
            TaskList.addTask('Task 1');
            
            const taskItem = container.querySelector('.task-item');
            const dragStartEvent = new Event('dragstart');
            dragStartEvent.dataTransfer = {
                effectAllowed: '',
                setData: jest.fn()
            };
            taskItem.dispatchEvent(dragStartEvent);
            
            expect(TaskList.draggedTaskId).toBeTruthy();
            
            const dragEndEvent = new Event('dragend');
            taskItem.dispatchEvent(dragEndEvent);
            
            expect(TaskList.draggedTaskId).toBeNull();
        });

        it('should add dragging class on dragstart', () => {
            TaskList.init(container);
            TaskList.addTask('Task 1');
            
            const taskItem = container.querySelector('.task-item');
            const dragEvent = new Event('dragstart');
            dragEvent.dataTransfer = {
                effectAllowed: '',
                setData: jest.fn()
            };
            
            taskItem.dispatchEvent(dragEvent);
            
            expect(taskItem.classList.contains('dragging')).toBe(true);
        });

        it('should remove dragging class on dragend', () => {
            TaskList.init(container);
            TaskList.addTask('Task 1');
            
            const taskItem = container.querySelector('.task-item');
            const dragStartEvent = new Event('dragstart');
            dragStartEvent.dataTransfer = {
                effectAllowed: '',
                setData: jest.fn()
            };
            taskItem.dispatchEvent(dragStartEvent);
            
            const dragEndEvent = new Event('dragend');
            taskItem.dispatchEvent(dragEndEvent);
            
            expect(taskItem.classList.contains('dragging')).toBe(false);
        });
    });
});
