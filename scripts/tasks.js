/**
 * Task List Component
 * Manages to-do items with CRUD operations
 */

const TaskList = {
    // Internal state
    tasks: [],
    container: null,
    taskListElement: null,
    taskInputElement: null,
    addButtonElement: null,
    notificationTimeout: null,
    draggedTaskId: null,

    /**
     * Generate UUID v4
     * @returns {string} UUID string
     */
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },

    /**
     * Validate task text
     * @param {string} text - Task text to validate
     * @returns {boolean} True if valid
     */
    validateTaskText(text) {
        if (typeof text !== 'string') {
            return false;
        }
        const trimmed = text.trim();
        return trimmed.length > 0 && trimmed.length <= 500;
    },

    /**
     * Create task object
     * @param {string} text - Task text
     * @returns {object} Task object
     */
    createTaskObject(text) {
        const now = Date.now();
        return {
            id: this.generateUUID(),
            text: text.trim(),
            completed: false,
            createdAt: now,
            updatedAt: now
        };
    },

    /**
     * Load tasks from storage
     */
    loadTasks() {
        const storedTasks = Storage.getItem('tasks');
        if (storedTasks && Array.isArray(storedTasks)) {
            this.tasks = storedTasks;
        } else {
            this.tasks = [];
        }
        
        // Apply saved task order if it exists
        this.applySavedOrder();
    },
    
    /**
     * Load and apply saved task order
     */
    applySavedOrder() {
        const savedOrder = Storage.getItem('taskOrder');
        
        // If no saved order exists, use creation order (already in tasks array)
        if (!savedOrder || !Array.isArray(savedOrder)) {
            return;
        }
        
        // Reorder tasks array based on saved order
        const orderedTasks = [];
        const taskMap = new Map(this.tasks.map(task => [task.id, task]));
        
        // Add tasks in saved order
        savedOrder.forEach(taskId => {
            const task = taskMap.get(taskId);
            if (task) {
                orderedTasks.push(task);
                taskMap.delete(taskId);
            }
        });
        
        // Add any remaining tasks that weren't in saved order (newly added tasks)
        taskMap.forEach(task => {
            orderedTasks.push(task);
        });
        
        this.tasks = orderedTasks;
    },
    
    /**
     * Save task order to storage
     */
    saveTaskOrder() {
        const taskOrder = this.tasks.map(task => task.id);
        Storage.setItem('taskOrder', taskOrder);
    },

    /**
     * Save tasks to storage
     */
    saveTasks() {
        Storage.setItem('tasks', this.tasks);
    },

    /**
     * Render all tasks
     */
    renderTasks() {
        if (!this.taskListElement) {
            return;
        }

        // Clear existing tasks
        this.taskListElement.innerHTML = '';

        // Render each task
        this.tasks.forEach(task => {
            this.renderTaskItem(task);
        });
    },

    /**
     * Render a single task item
     * @param {object} task - Task object
     */
    renderTaskItem(task) {
        const li = document.createElement('li');
        li.className = 'task-item';
        if (task.completed) {
            li.classList.add('completed');
        }
        li.setAttribute('data-task-id', task.id);
        li.setAttribute('draggable', 'true');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'task-checkbox';
        checkbox.checked = task.completed;

        const textSpan = document.createElement('span');
        textSpan.className = 'task-text';
        textSpan.textContent = task.text;

        // Create edit input (hidden by default)
        const editInput = document.createElement('input');
        editInput.type = 'text';
        editInput.className = 'task-edit-input';
        editInput.maxLength = 500;
        editInput.value = task.text;

        const editButton = document.createElement('button');
        editButton.className = 'btn-edit-task';
        editButton.textContent = 'Edit';
        editButton.setAttribute('aria-label', 'Edit task');

        const deleteButton = document.createElement('button');
        deleteButton.className = 'btn-delete-task';
        deleteButton.textContent = 'Delete';
        deleteButton.setAttribute('aria-label', 'Delete task');

        // Add checkbox event listener
        checkbox.addEventListener('change', () => {
            this.toggleTask(task.id);
        });

        // Add edit button event listener
        editButton.addEventListener('click', () => {
            this.enterEditMode(task.id);
        });

        // Add delete button event listener
        deleteButton.addEventListener('click', () => {
            this.deleteTask(task.id);
        });
        
        // Add drag event listeners
        li.addEventListener('dragstart', (e) => {
            this.handleDragStart(e, task.id);
        });
        
        li.addEventListener('dragover', (e) => {
            this.handleDragOver(e);
        });
        
        li.addEventListener('drop', (e) => {
            this.handleDrop(e, task.id);
        });
        
        li.addEventListener('dragend', (e) => {
            this.handleDragEnd(e);
        });

        li.appendChild(checkbox);
        li.appendChild(textSpan);
        li.appendChild(editInput);
        li.appendChild(editButton);
        li.appendChild(deleteButton);

        this.taskListElement.appendChild(li);
    },

    /**
     * Handle add task button click
     */
    handleAddTask() {
        if (!this.taskInputElement) {
            return;
        }

        const text = this.taskInputElement.value;
        const success = this.addTask(text);

        if (success) {
            // Clear input field
            this.taskInputElement.value = '';
        }
    },

    /**
     * Initialize the task list component
     * @param {HTMLElement} containerElement - Container element for the task list
     */
    init(containerElement) {
        this.container = containerElement;

        // Get DOM elements
        this.taskListElement = containerElement.querySelector('.task-list');
        this.taskInputElement = containerElement.querySelector('.task-input');
        this.addButtonElement = containerElement.querySelector('.btn-add-task');
        const sortAlphaButton = containerElement.querySelector('.btn-sort-alpha');
        const sortStatusButton = containerElement.querySelector('.btn-sort-status');

        if (!this.taskListElement || !this.taskInputElement || !this.addButtonElement) {
            console.error('Required task list elements not found');
            return;
        }

        // Load tasks from storage
        this.loadTasks();

        // Render tasks
        this.renderTasks();

        // Set up event listeners
        this.addButtonElement.addEventListener('click', () => this.handleAddTask());
        
        // Allow adding task with Enter key
        this.taskInputElement.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleAddTask();
            }
        });

        // Set up sort button event listeners
        if (sortAlphaButton) {
            sortAlphaButton.addEventListener('click', () => this.sortTasks('alphabetical'));
        }
        
        if (sortStatusButton) {
            sortStatusButton.addEventListener('click', () => this.sortTasks('completion'));
        }
    },

    /**
     * Add a new task
     * @param {string} text - Task text
     * @returns {boolean} Success status
     */
    addTask(text) {
        // Validate input
        if (!this.validateTaskText(text)) {
            return false;
        }

        // Check for duplicate
        if (this.isDuplicate(text)) {
            this.showNotification('This task already exists');
            return false;
        }

        // Create task object
        const task = this.createTaskObject(text);

        // Add to tasks array
        this.tasks.push(task);

        // Save to storage
        this.saveTasks();

        // Render the new task (only if DOM is initialized)
        if (this.taskListElement) {
            this.renderTaskItem(task);
        }

        return true;
    },

    /**
     * Toggle task completion status
     * @param {string} taskId - Task ID
     * @returns {boolean} Success status
     */
    toggleTask(taskId) {
        // Find the task
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) {
            return false;
        }

        // Toggle completion status
        task.completed = !task.completed;
        
        // Update timestamp
        task.updatedAt = Date.now();

        // Save to storage
        this.saveTasks();

        // Update DOM element
        const taskElement = this.taskListElement?.querySelector(`[data-task-id="${taskId}"]`);
        if (taskElement) {
            if (task.completed) {
                taskElement.classList.add('completed');
            } else {
                taskElement.classList.remove('completed');
            }
            
            // Update checkbox state
            const checkbox = taskElement.querySelector('.task-checkbox');
            if (checkbox) {
                checkbox.checked = task.completed;
            }
        }

        return true;
    },

    /**
     * Update task text
     * @param {string} taskId - Task ID
     * @param {string} newText - New task text
     * @returns {boolean} Success status
     */
    editTask(taskId, newText) {
        // Validate new text
        if (!this.validateTaskText(newText)) {
            return false;
        }

        // Find the task
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) {
            return false;
        }

        // Update task text and timestamp
        task.text = newText.trim();
        task.updatedAt = Date.now();

        // Save to storage
        this.saveTasks();

        // Update DOM element
        const taskElement = this.taskListElement?.querySelector(`[data-task-id="${taskId}"]`);
        if (taskElement) {
            const textSpan = taskElement.querySelector('.task-text');
            if (textSpan) {
                textSpan.textContent = task.text;
            }
        }

        return true;
    },

    /**
     * Enter edit mode for a task
     * @param {string} taskId - Task ID
     */
    enterEditMode(taskId) {
        const taskElement = this.taskListElement?.querySelector(`[data-task-id="${taskId}"]`);
        if (!taskElement) {
            return;
        }

        // Add editing class to show input field
        taskElement.classList.add('editing');

        // Get the edit input and focus it
        const editInput = taskElement.querySelector('.task-edit-input');
        if (editInput) {
            editInput.focus();
            editInput.select();

            // Change edit button to save button
            const editButton = taskElement.querySelector('.btn-edit-task');
            if (editButton) {
                editButton.textContent = 'Save';
                editButton.setAttribute('aria-label', 'Save task');
                
                // Remove old event listener by replacing the button
                const newEditButton = editButton.cloneNode(true);
                editButton.parentNode.replaceChild(newEditButton, editButton);
                
                // Add save event listener
                newEditButton.addEventListener('click', () => {
                    this.saveEdit(taskId);
                });
            }

            // Handle Enter key to save
            editInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.saveEdit(taskId);
                }
            });

            // Handle Escape key to cancel
            editInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.exitEditMode(taskId);
                }
            });
        }
    },

    /**
     * Save edited task
     * @param {string} taskId - Task ID
     */
    saveEdit(taskId) {
        const taskElement = this.taskListElement?.querySelector(`[data-task-id="${taskId}"]`);
        if (!taskElement) {
            return;
        }

        const editInput = taskElement.querySelector('.task-edit-input');
        if (!editInput) {
            return;
        }

        const newText = editInput.value;
        const success = this.editTask(taskId, newText);

        if (success) {
            this.exitEditMode(taskId);
        }
    },

    /**
     * Exit edit mode for a task
     * @param {string} taskId - Task ID
     */
    exitEditMode(taskId) {
        const taskElement = this.taskListElement?.querySelector(`[data-task-id="${taskId}"]`);
        if (!taskElement) {
            return;
        }

        // Remove editing class
        taskElement.classList.remove('editing');

        // Reset edit button
        const editButton = taskElement.querySelector('.btn-edit-task');
        if (editButton) {
            editButton.textContent = 'Edit';
            editButton.setAttribute('aria-label', 'Edit task');
            
            // Remove old event listener by replacing the button
            const newEditButton = editButton.cloneNode(true);
            editButton.parentNode.replaceChild(newEditButton, editButton);
            
            // Add edit event listener
            newEditButton.addEventListener('click', () => {
                this.enterEditMode(taskId);
            });
        }

        // Reset input value to current task text
        const task = this.tasks.find(t => t.id === taskId);
        const editInput = taskElement.querySelector('.task-edit-input');
        if (task && editInput) {
            editInput.value = task.text;
        }
    },

    /**
     * Delete a task
     * @param {string} taskId - Task ID
     * @returns {boolean} Success status
     */
    deleteTask(taskId) {
        // Find the task index
        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) {
            return false;
        }

        // Remove task from array
        this.tasks.splice(taskIndex, 1);

        // Save to storage
        this.saveTasks();

        // Remove from DOM
        const taskElement = this.taskListElement?.querySelector(`[data-task-id="${taskId}"]`);
        if (taskElement) {
            taskElement.remove();
        }

        return true;
    },

    /**
     * Sort tasks by criteria
     * @param {string} criteria - Sort criteria ('alphabetical' | 'completion')
     */
    sortTasks(criteria) {
        if (criteria === 'alphabetical') {
            // Sort alphabetically by task text (case-insensitive)
            this.tasks.sort((a, b) => {
                const textA = a.text.toLowerCase();
                const textB = b.text.toLowerCase();
                return textA.localeCompare(textB);
            });
        } else if (criteria === 'completion') {
            // Sort by completion status (uncompleted first)
            this.tasks.sort((a, b) => {
                // If a is uncompleted and b is completed, a comes first (return -1)
                // If a is completed and b is uncompleted, b comes first (return 1)
                // If both have same status, maintain current order (return 0)
                if (a.completed === b.completed) {
                    return 0;
                }
                return a.completed ? 1 : -1;
            });
        }

        // Save the new order to storage
        this.saveTasks();
        this.saveTaskOrder();

        // Re-render the task list
        this.renderTasks();
    },

    /**
     * Reorder tasks (drag and drop)
     * @param {string} taskId - Task ID
     * @param {number} newIndex - New position index
     * @returns {boolean} Success status
     */
    reorderTasks(taskId, newIndex) {
        // Find the task
        const currentIndex = this.tasks.findIndex(t => t.id === taskId);
        if (currentIndex === -1) {
            return false;
        }
        
        // Validate new index
        if (newIndex < 0 || newIndex >= this.tasks.length) {
            return false;
        }
        
        // If the position hasn't changed, still save order and return success
        if (currentIndex === newIndex) {
            this.saveTaskOrder();
            return true;
        }
        
        // Remove task from current position
        const [task] = this.tasks.splice(currentIndex, 1);
        
        // Insert task at new position
        this.tasks.splice(newIndex, 0, task);
        
        // Save the new order to storage
        this.saveTaskOrder();
        
        // Re-render the task list
        this.renderTasks();
        
        return true;
    },
    
    /**
     * Handle drag start event
     * @param {DragEvent} e - Drag event
     * @param {string} taskId - Task ID being dragged
     */
    handleDragStart(e, taskId) {
        this.draggedTaskId = taskId;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.target.innerHTML);
        
        // Add dragging class for visual feedback
        e.target.classList.add('dragging');
    },
    
    /**
     * Handle drag over event
     * @param {DragEvent} e - Drag event
     */
    handleDragOver(e) {
        if (e.preventDefault) {
            e.preventDefault();
        }
        
        e.dataTransfer.dropEffect = 'move';
        
        // Add visual feedback for drop target
        const target = e.target.closest('.task-item');
        if (target && target.getAttribute('data-task-id') !== this.draggedTaskId) {
            target.classList.add('drag-over');
        }
        
        return false;
    },
    
    /**
     * Handle drop event
     * @param {DragEvent} e - Drag event
     * @param {string} targetTaskId - Task ID where item is dropped
     */
    handleDrop(e, targetTaskId) {
        if (e.stopPropagation) {
            e.stopPropagation();
        }
        
        // Don't do anything if dropping on itself
        if (this.draggedTaskId === targetTaskId) {
            return false;
        }
        
        // Find the new index based on target task
        const newIndex = this.tasks.findIndex(t => t.id === targetTaskId);
        
        if (newIndex !== -1) {
            // Reorder the tasks
            this.reorderTasks(this.draggedTaskId, newIndex);
        }
        
        return false;
    },
    
    /**
     * Handle drag end event
     * @param {DragEvent} e - Drag event
     */
    handleDragEnd(e) {
        // Remove all drag-related classes
        const taskItems = this.taskListElement?.querySelectorAll('.task-item');
        if (taskItems) {
            taskItems.forEach(item => {
                item.classList.remove('dragging');
                item.classList.remove('drag-over');
            });
        }
        
        this.draggedTaskId = null;
    },

    /**
     * Check if task text is duplicate
     * @param {string} text - Task text to check
     * @returns {boolean} True if duplicate exists
     */
    isDuplicate(text) {
        if (typeof text !== 'string') {
            return false;
        }
        
        const trimmedText = text.trim().toLowerCase();
        
        return this.tasks.some(task => 
            task.text.toLowerCase() === trimmedText
        );
    },

    /**
     * Display notification message
     * @param {string} message - Notification message
     * @param {number} duration - Duration in milliseconds (default 3000)
     */
    showNotification(message, duration = 3000) {
        const notificationElement = this.container?.querySelector('.task-notification');
        if (!notificationElement) {
            return;
        }
        
        // Set the message
        notificationElement.textContent = message;
        notificationElement.classList.add('visible');
        
        // Clear any existing timeout
        if (this.notificationTimeout) {
            clearTimeout(this.notificationTimeout);
        }
        
        // Hide after duration
        this.notificationTimeout = setTimeout(() => {
            notificationElement.textContent = '';
            notificationElement.classList.remove('visible');
        }, duration);
    }

};
