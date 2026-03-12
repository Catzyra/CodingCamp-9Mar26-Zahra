/**
 * Property-Based Tests for Task List Component
 * Feature: productivity-dashboard
 */

const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');
const fc = require('fast-check');
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

describe('Task List Property Tests', () => {
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
        
        // Initialize the task list
        TaskList.init(container);
    });

    afterEach(() => {
        // Cleanup
        if (container && container.parentNode) {
            document.body.removeChild(container);
        }
    });

    // Feature: productivity-dashboard, Property 7: Task Creation and Display
    // **Validates: Requirements 4.1, 4.2**
    it('Property 7: Task Creation and Display', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
                (taskText) => {
                    // Store initial count
                    const initialCount = TaskList.tasks.length;
                    
                    // Add task
                    const result = TaskList.addTask(taskText);
                    
                    // Verify task was created successfully
                    expect(result).toBe(true);
                    
                    // Verify task was added to array
                    expect(TaskList.tasks.length).toBe(initialCount + 1);
                    
                    // Find the newly created task
                    const newTask = TaskList.tasks[TaskList.tasks.length - 1];
                    
                    // Verify task has correct properties
                    expect(newTask.text).toBe(taskText.trim());
                    expect(newTask.completed).toBe(false);
                    expect(newTask.id).toBeTruthy();
                    expect(typeof newTask.id).toBe('string');
                    
                    // Verify task is displayed in DOM
                    const taskElement = container.querySelector(`[data-task-id="${newTask.id}"]`);
                    expect(taskElement).toBeTruthy();
                    expect(taskElement.querySelector('.task-text').textContent).toBe(taskText.trim());
                    
                    // Verify checkbox is unchecked
                    const checkbox = taskElement.querySelector('.task-checkbox');
                    expect(checkbox.checked).toBe(false);
                    
                    // Cleanup for next iteration
                    TaskList.tasks = [];
                    mockStorage.clear();
                    container.querySelector('.task-list').innerHTML = '';
                }
            ),
            { numRuns: 100 }
        );
    });

    // Feature: productivity-dashboard, Property 9: Empty Task Rejection
    // **Validates: Requirements 4.4, 6.4**
    it('Property 9: Empty Task Rejection', () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    fc.constant(''),
                    fc.constant(' '),
                    fc.constant('  '),
                    fc.constant('\t'),
                    fc.constant('\n'),
                    fc.constant('   \t\n   '),
                    fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 1, maxLength: 20 })
                ),
                (whitespaceText) => {
                    // Store initial state
                    const initialCount = TaskList.tasks.length;
                    const initialStorageState = JSON.stringify(mockStorage.data);
                    
                    // Attempt to add empty/whitespace task
                    const result = TaskList.addTask(whitespaceText);
                    
                    // Verify task was rejected
                    expect(result).toBe(false);
                    
                    // Verify task list is unchanged
                    expect(TaskList.tasks.length).toBe(initialCount);
                    
                    // Verify storage is unchanged
                    expect(JSON.stringify(mockStorage.data)).toBe(initialStorageState);
                    
                    // Verify no new DOM elements were added
                    const taskElements = container.querySelectorAll('.task-item');
                    expect(taskElements.length).toBe(initialCount);
                }
            ),
            { numRuns: 100 }
        );
    });

    // Feature: productivity-dashboard, Property 10: Task Completion Toggle Round-Trip
    // **Validates: Requirements 5.1, 5.3**
    it('Property 10: Task Completion Toggle Round-Trip', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
                fc.boolean(),
                (taskText, initialCompletionStatus) => {
                    // Add a task
                    TaskList.addTask(taskText);
                    const taskId = TaskList.tasks[0].id;
                    
                    // Set initial completion status
                    if (initialCompletionStatus) {
                        TaskList.toggleTask(taskId);
                    }
                    
                    // Store the initial completion state
                    const firstState = TaskList.tasks[0].completed;
                    expect(firstState).toBe(initialCompletionStatus);
                    
                    // Toggle once
                    TaskList.toggleTask(taskId);
                    const secondState = TaskList.tasks[0].completed;
                    expect(secondState).toBe(!firstState);
                    
                    // Toggle again (round-trip)
                    TaskList.toggleTask(taskId);
                    const finalState = TaskList.tasks[0].completed;
                    
                    // Verify we're back to the original state
                    expect(finalState).toBe(firstState);
                    expect(finalState).toBe(initialCompletionStatus);
                    
                    // Cleanup for next iteration
                    TaskList.tasks = [];
                    mockStorage.clear();
                    container.querySelector('.task-list').innerHTML = '';
                }
            ),
            { numRuns: 100 }
        );
    });

    // Feature: productivity-dashboard, Property 11: Task Completion Styling
    // **Validates: Requirements 5.2**
    it('Property 11: Task Completion Styling', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
                (taskText) => {
                    // Clear everything first
                    TaskList.tasks = [];
                    mockStorage.clear();
                    container.querySelector('.task-list').innerHTML = '';
                    
                    // Add a task
                    TaskList.addTask(taskText);
                    const taskId = TaskList.tasks[0].id;
                    
                    // Get the task element
                    const taskElement = container.querySelector(`[data-task-id="${taskId}"]`);
                    expect(taskElement).toBeTruthy();
                    
                    // Initially, task should not have completed class
                    expect(taskElement.classList.contains('completed')).toBe(false);
                    
                    // Mark task as completed
                    TaskList.toggleTask(taskId);
                    
                    // Verify completed class is applied
                    expect(taskElement.classList.contains('completed')).toBe(true);
                    
                    // Verify checkbox is checked
                    const checkbox = taskElement.querySelector('.task-checkbox');
                    expect(checkbox.checked).toBe(true);
                    
                    // Mark task as uncompleted
                    TaskList.toggleTask(taskId);
                    
                    // Verify completed class is removed
                    expect(taskElement.classList.contains('completed')).toBe(false);
                    
                    // Verify checkbox is unchecked
                    expect(checkbox.checked).toBe(false);
                }
            ),
            { numRuns: 100 }
        );
    });

    // Feature: productivity-dashboard, Property 12: Task Edit Mode Display
    // **Validates: Requirements 6.1**
    it('Property 12: Task Edit Mode Display', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
                (taskText) => {
                    // Add a task
                    TaskList.addTask(taskText);
                    const taskId = TaskList.tasks[0].id;
                    
                    // Enter edit mode
                    TaskList.enterEditMode(taskId);
                    
                    // Verify edit input field is displayed with current task text
                    const taskElement = container.querySelector(`[data-task-id="${taskId}"]`);
                    expect(taskElement).toBeTruthy();
                    expect(taskElement.classList.contains('editing')).toBe(true);
                    
                    const editInput = taskElement.querySelector('.task-edit-input');
                    expect(editInput).toBeTruthy();
                    expect(editInput.value).toBe(taskText.trim());
                    
                    // Cleanup for next iteration
                    TaskList.tasks = [];
                    mockStorage.clear();
                }
            ),
            { numRuns: 100 }
        );
    });

    // Feature: productivity-dashboard, Property 13: Task Text Update
    // **Validates: Requirements 6.2**
    it('Property 13: Task Text Update', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
                fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
                fc.boolean(),
                (originalText, newText, completionStatus) => {
                    // Add a task
                    TaskList.addTask(originalText);
                    const taskId = TaskList.tasks[0].id;
                    
                    // Set completion status
                    if (completionStatus) {
                        TaskList.toggleTask(taskId);
                    }
                    
                    // Store original values
                    const originalId = TaskList.tasks[0].id;
                    const originalCompleted = TaskList.tasks[0].completed;
                    
                    // Update task text
                    const result = TaskList.editTask(taskId, newText);
                    
                    // Verify update was successful
                    expect(result).toBe(true);
                    
                    // Verify text was updated
                    expect(TaskList.tasks[0].text).toBe(newText.trim());
                    
                    // Verify ID was preserved
                    expect(TaskList.tasks[0].id).toBe(originalId);
                    
                    // Verify completion status was preserved
                    expect(TaskList.tasks[0].completed).toBe(originalCompleted);
                    
                    // Cleanup for next iteration
                    TaskList.tasks = [];
                    mockStorage.clear();
                }
            ),
            { numRuns: 100 }
        );
    });

    // Feature: productivity-dashboard, Property 14: Task Deletion
    // **Validates: Requirements 7.1, 7.2**
    it('Property 14: Task Deletion', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
                    { minLength: 1, maxLength: 10 }
                ),
                fc.integer({ min: 0, max: 9 }),
                (taskTexts, deleteIndex) => {
                    // Adjust deleteIndex to be within bounds
                    const actualDeleteIndex = deleteIndex % taskTexts.length;
                    
                    // Add all tasks
                    taskTexts.forEach(text => TaskList.addTask(text));
                    
                    // Get the task ID to delete
                    const taskIdToDelete = TaskList.tasks[actualDeleteIndex].id;
                    
                    // Store original count
                    const originalCount = TaskList.tasks.length;
                    
                    // Delete the task
                    const result = TaskList.deleteTask(taskIdToDelete);
                    
                    // Verify deletion was successful
                    expect(result).toBe(true);
                    
                    // Verify task was removed from array
                    expect(TaskList.tasks.length).toBe(originalCount - 1);
                    expect(TaskList.tasks.find(t => t.id === taskIdToDelete)).toBeUndefined();
                    
                    // Verify task was removed from DOM
                    const taskElement = container.querySelector(`[data-task-id="${taskIdToDelete}"]`);
                    expect(taskElement).toBeNull();
                    
                    // Verify task was removed from storage
                    const stored = Storage.getItem('tasks');
                    expect(stored.length).toBe(originalCount - 1);
                    expect(stored.find(t => t.id === taskIdToDelete)).toBeUndefined();
                    
                    // Verify other tasks are still present
                    const remainingTexts = taskTexts.filter((_, idx) => idx !== actualDeleteIndex);
                    remainingTexts.forEach(text => {
                        const trimmedText = text.trim();
                        expect(TaskList.tasks.some(t => t.text === trimmedText)).toBe(true);
                    });
                    
                    // Cleanup for next iteration
                    TaskList.tasks = [];
                    mockStorage.clear();
                    container.querySelector('.task-list').innerHTML = '';
                }
            ),
            { numRuns: 100 }
        );
    });

    // Feature: productivity-dashboard, Property 22: Duplicate Task Detection
    // **Validates: Requirements 17.1, 17.2, 17.3, 17.4, 17.5**
    it('Property 22: Duplicate Task Detection', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
                fc.constantFrom('', ' ', '  ', '\t', '\n'),
                fc.constantFrom('lower', 'upper', 'mixed'),
                (taskText, whitespace, caseVariation) => {
                    // Clear everything first
                    TaskList.tasks = [];
                    mockStorage.clear();
                    container.querySelector('.task-list').innerHTML = '';
                    
                    // Add the original task
                    const result1 = TaskList.addTask(taskText);
                    expect(result1).toBe(true);
                    expect(TaskList.tasks.length).toBe(1);
                    
                    // Create a duplicate with variations
                    let duplicateText = taskText;
                    
                    // Apply case variation
                    if (caseVariation === 'lower') {
                        duplicateText = duplicateText.toLowerCase();
                    } else if (caseVariation === 'upper') {
                        duplicateText = duplicateText.toUpperCase();
                    }
                    // 'mixed' keeps original case
                    
                    // Add whitespace
                    duplicateText = whitespace + duplicateText + whitespace;
                    
                    // Attempt to add duplicate
                    const result2 = TaskList.addTask(duplicateText);
                    
                    // Verify duplicate was rejected
                    expect(result2).toBe(false);
                    
                    // Verify task list is unchanged
                    expect(TaskList.tasks.length).toBe(1);
                    
                    // Verify storage is unchanged
                    const stored = Storage.getItem('tasks');
                    expect(stored.length).toBe(1);
                    
                    // Verify notification was displayed
                    const notification = container.querySelector('.task-notification');
                    expect(notification.textContent).toBe('This task already exists');
                    expect(notification.classList.contains('visible')).toBe(true);
                    
                    // Verify only one task element in DOM
                    const taskElements = container.querySelectorAll('.task-item');
                    expect(taskElements.length).toBe(1);
                }
            ),
            { numRuns: 100 }
        );
    });

    // Additional property test: Non-duplicate tasks should be allowed
    it('Property 22 (Inverse): Non-duplicate tasks are allowed', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
                    { minLength: 2, maxLength: 10 }
                ).filter(arr => {
                    // Ensure all strings are unique when normalized (trimmed and lowercased)
                    const normalized = arr.map(s => s.trim().toLowerCase());
                    return new Set(normalized).size === normalized.length;
                }),
                (uniqueTaskTexts) => {
                    // Clear everything first
                    TaskList.tasks = [];
                    mockStorage.clear();
                    container.querySelector('.task-list').innerHTML = '';
                    
                    // Add all unique tasks
                    uniqueTaskTexts.forEach((text, index) => {
                        const result = TaskList.addTask(text);
                        
                        // Each unique task should be added successfully
                        expect(result).toBe(true);
                        expect(TaskList.tasks.length).toBe(index + 1);
                    });
                    
                    // Verify all tasks are in storage
                    const stored = Storage.getItem('tasks');
                    expect(stored.length).toBe(uniqueTaskTexts.length);
                    
                    // Verify all tasks are in DOM
                    const taskElements = container.querySelectorAll('.task-item');
                    expect(taskElements.length).toBe(uniqueTaskTexts.length);
                }
            ),
            { numRuns: 100 }
        );
    });

    // Feature: productivity-dashboard, Property 23: Alphabetical Task Sorting
    // **Validates: Requirements 18.1**
    it('Property 23: Alphabetical Task Sorting', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
                    { minLength: 2, maxLength: 10 }
                ).filter(arr => {
                    // Ensure all strings are unique
                    const normalized = arr.map(s => s.trim().toLowerCase());
                    return new Set(normalized).size === normalized.length;
                }),
                (taskTexts) => {
                    // Clear everything first
                    TaskList.tasks = [];
                    mockStorage.clear();
                    container.querySelector('.task-list').innerHTML = '';
                    
                    // Add all tasks
                    taskTexts.forEach(text => TaskList.addTask(text));
                    
                    // Sort alphabetically
                    TaskList.sortTasks('alphabetical');
                    
                    // Verify tasks are in alphabetical order (case-insensitive)
                    for (let i = 0; i < TaskList.tasks.length - 1; i++) {
                        const currentText = TaskList.tasks[i].text.toLowerCase();
                        const nextText = TaskList.tasks[i + 1].text.toLowerCase();
                        expect(currentText.localeCompare(nextText)).toBeLessThanOrEqual(0);
                    }
                    
                    // Verify all tasks are still present
                    expect(TaskList.tasks.length).toBe(taskTexts.length);
                    
                    // Verify all original task texts are still present
                    const currentTexts = TaskList.tasks.map(t => t.text);
                    const originalTexts = taskTexts.map(t => t.trim());
                    originalTexts.forEach(text => {
                        expect(currentTexts).toContain(text);
                    });
                    
                    // Verify DOM reflects the sorted order
                    const taskElements = container.querySelectorAll('.task-item');
                    expect(taskElements.length).toBe(taskTexts.length);
                    
                    // Verify DOM order matches task array order
                    taskElements.forEach((element, index) => {
                        const taskText = element.querySelector('.task-text').textContent;
                        expect(taskText).toBe(TaskList.tasks[index].text);
                    });
                    
                    // Verify order was saved to storage
                    const savedOrder = Storage.getItem('taskOrder');
                    const expectedOrder = TaskList.tasks.map(t => t.id);
                    expect(savedOrder).toEqual(expectedOrder);
                }
            ),
            { numRuns: 100 }
        );
    });

    // Feature: productivity-dashboard, Property 24: Completion Status Sorting
    // **Validates: Requirements 18.2**
    it('Property 24: Completion Status Sorting', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        text: fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
                        completed: fc.boolean()
                    }),
                    { minLength: 2, maxLength: 10 }
                ).filter(arr => {
                    // Ensure all task texts are unique
                    const normalized = arr.map(t => t.text.trim().toLowerCase());
                    return new Set(normalized).size === normalized.length;
                }),
                (taskData) => {
                    // Clear everything first
                    TaskList.tasks = [];
                    mockStorage.clear();
                    container.querySelector('.task-list').innerHTML = '';
                    
                    // Add all tasks and set their completion status
                    taskData.forEach(data => {
                        TaskList.addTask(data.text);
                        const taskId = TaskList.tasks[TaskList.tasks.length - 1].id;
                        
                        // Set completion status if needed
                        if (data.completed) {
                            TaskList.toggleTask(taskId);
                        }
                    });
                    
                    // Sort by completion status
                    TaskList.sortTasks('completion');
                    
                    // Verify uncompleted tasks come before completed tasks
                    let foundCompleted = false;
                    for (let i = 0; i < TaskList.tasks.length; i++) {
                        const task = TaskList.tasks[i];
                        
                        if (task.completed) {
                            foundCompleted = true;
                        } else {
                            // If we find an uncompleted task after a completed one, fail
                            expect(foundCompleted).toBe(false);
                        }
                    }
                    
                    // Verify all tasks are still present
                    expect(TaskList.tasks.length).toBe(taskData.length);
                    
                    // Verify all original task texts are still present
                    const currentTexts = TaskList.tasks.map(t => t.text);
                    const originalTexts = taskData.map(t => t.text.trim());
                    originalTexts.forEach(text => {
                        expect(currentTexts).toContain(text);
                    });
                    
                    // Verify completion statuses are preserved
                    taskData.forEach(data => {
                        const task = TaskList.tasks.find(t => t.text === data.text.trim());
                        expect(task).toBeTruthy();
                        expect(task.completed).toBe(data.completed);
                    });
                    
                    // Verify DOM reflects the sorted order
                    const taskElements = container.querySelectorAll('.task-item');
                    expect(taskElements.length).toBe(taskData.length);
                    
                    // Verify DOM order matches task array order
                    taskElements.forEach((element, index) => {
                        const taskText = element.querySelector('.task-text').textContent;
                        const isCompleted = element.classList.contains('completed');
                        expect(taskText).toBe(TaskList.tasks[index].text);
                        expect(isCompleted).toBe(TaskList.tasks[index].completed);
                    });
                    
                    // Verify order was saved to storage
                    const savedOrder = Storage.getItem('taskOrder');
                    const expectedOrder = TaskList.tasks.map(t => t.id);
                    expect(savedOrder).toEqual(expectedOrder);
                }
            ),
            { numRuns: 100 }
        );
    });

    // Feature: productivity-dashboard, Property 25: Task Reordering
    // **Validates: Requirements 18.3**
    it('Property 25: Task Reordering', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
                    { minLength: 2, maxLength: 10 }
                ).filter(arr => {
                    // Ensure all strings are unique
                    const normalized = arr.map(s => s.trim().toLowerCase());
                    return new Set(normalized).size === normalized.length;
                }),
                fc.integer({ min: 0, max: 9 }),
                fc.integer({ min: 0, max: 9 }),
                (taskTexts, fromIndexRaw, toIndexRaw) => {
                    // Clear everything first
                    TaskList.tasks = [];
                    mockStorage.clear();
                    container.querySelector('.task-list').innerHTML = '';
                    
                    // Add all tasks
                    taskTexts.forEach(text => TaskList.addTask(text));
                    
                    // Adjust indices to be within bounds
                    const fromIndex = fromIndexRaw % taskTexts.length;
                    const toIndex = toIndexRaw % taskTexts.length;
                    
                    // Get the task ID to move
                    const taskIdToMove = TaskList.tasks[fromIndex].id;
                    const taskTextToMove = TaskList.tasks[fromIndex].text;
                    
                    // Reorder the task
                    const result = TaskList.reorderTasks(taskIdToMove, toIndex);
                    
                    // Verify reordering was successful
                    expect(result).toBe(true);
                    
                    // Verify the task is now at the new position
                    expect(TaskList.tasks[toIndex].id).toBe(taskIdToMove);
                    expect(TaskList.tasks[toIndex].text).toBe(taskTextToMove);
                    
                    // Verify all tasks are still present
                    expect(TaskList.tasks.length).toBe(taskTexts.length);
                    
                    // Verify all original task texts are still present
                    const currentTexts = TaskList.tasks.map(t => t.text);
                    const originalTexts = taskTexts.map(t => t.trim());
                    originalTexts.forEach(text => {
                        expect(currentTexts).toContain(text);
                    });
                    
                    // Verify DOM reflects the new order
                    const taskElements = container.querySelectorAll('.task-item');
                    expect(taskElements.length).toBe(taskTexts.length);
                    expect(taskElements[toIndex].querySelector('.task-text').textContent).toBe(taskTextToMove);
                }
            ),
            { numRuns: 100 }
        );
    });

    // Feature: productivity-dashboard, Property 26: Task Order Persistence Round-Trip
    // **Validates: Requirements 18.4, 18.5**
    it('Property 26: Task Order Persistence Round-Trip', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
                    { minLength: 2, maxLength: 10 }
                ).filter(arr => {
                    // Ensure all strings are unique
                    const normalized = arr.map(s => s.trim().toLowerCase());
                    return new Set(normalized).size === normalized.length;
                }),
                fc.integer({ min: 0, max: 9 }),
                fc.integer({ min: 0, max: 9 }),
                (taskTexts, fromIndexRaw, toIndexRaw) => {
                    // Clear everything first
                    TaskList.tasks = [];
                    mockStorage.clear();
                    container.querySelector('.task-list').innerHTML = '';
                    
                    // Add all tasks
                    taskTexts.forEach(text => TaskList.addTask(text));
                    
                    // Adjust indices to be within bounds
                    const fromIndex = fromIndexRaw % taskTexts.length;
                    const toIndex = toIndexRaw % taskTexts.length;
                    
                    // Get the task ID to move
                    const taskIdToMove = TaskList.tasks[fromIndex].id;
                    
                    // Reorder the task
                    TaskList.reorderTasks(taskIdToMove, toIndex);
                    
                    // Get the current order
                    const expectedOrder = TaskList.tasks.map(t => t.id);
                    
                    // Verify order was saved to storage
                    const savedOrder = Storage.getItem('taskOrder');
                    expect(savedOrder).toEqual(expectedOrder);
                    
                    // Simulate page reload by loading tasks again
                    TaskList.loadTasks();
                    
                    // Verify the order is preserved after loading
                    const loadedOrder = TaskList.tasks.map(t => t.id);
                    expect(loadedOrder).toEqual(expectedOrder);
                    expect(loadedOrder).toEqual(savedOrder);
                    
                    // Verify the task at the target position is still correct
                    expect(TaskList.tasks[toIndex].id).toBe(taskIdToMove);
                }
            ),
            { numRuns: 100 }
        );
    });

    // Additional property test: Default to creation order when no saved order exists
    it('Property 26 (Default Order): Use creation order when no saved order exists', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
                    { minLength: 1, maxLength: 10 }
                ).filter(arr => {
                    // Ensure all strings are unique
                    const normalized = arr.map(s => s.trim().toLowerCase());
                    return new Set(normalized).size === normalized.length;
                }),
                (taskTexts) => {
                    // Clear everything first
                    TaskList.tasks = [];
                    mockStorage.clear();
                    container.querySelector('.task-list').innerHTML = '';
                    
                    // Add all tasks
                    taskTexts.forEach(text => TaskList.addTask(text));
                    
                    // Store the creation order (task IDs)
                    const creationOrder = TaskList.tasks.map(t => t.id);
                    
                    // Clear the taskOrder from storage (but keep tasks)
                    mockStorage.removeItem('taskOrder');
                    
                    // Reload tasks
                    TaskList.loadTasks();
                    
                    // Verify tasks are in creation order
                    const loadedOrder = TaskList.tasks.map(t => t.id);
                    expect(loadedOrder).toEqual(creationOrder);
                    
                    // Verify all tasks are still present
                    expect(TaskList.tasks.length).toBe(taskTexts.length);
                }
            ),
            { numRuns: 100 }
        );
    });
});
