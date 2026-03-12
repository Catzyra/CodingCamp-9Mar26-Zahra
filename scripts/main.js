/**
 * Main Application Initialization
 * Initializes all components and handles application startup
 */

(function() {
    'use strict';

    // Track initialization start time for performance monitoring
    const initStartTime = performance.now();

    /**
     * Check if Local Storage is available
     * @returns {boolean} True if storage is available
     */
    function checkStorageAvailability() {
        try {
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Display storage warning message
     */
    function displayStorageWarning() {
        const warningDiv = document.createElement('div');
        warningDiv.className = 'storage-warning';
        warningDiv.setAttribute('role', 'alert');
        warningDiv.setAttribute('aria-live', 'assertive');
        warningDiv.textContent = 'Local storage is disabled. Your data will not be saved.';
        
        // Insert at the top of the dashboard
        const dashboard = document.querySelector('.dashboard');
        if (dashboard) {
            dashboard.insertBefore(warningDiv, dashboard.firstChild);
        }
    }

    /**
     * Validate and sanitize storage data
     * @param {string} key - Storage key
     * @param {Function} validator - Validation function
     * @returns {any} Valid data or null
     */
    function validateStorageData(key, validator) {
        try {
            const data = Storage.getItem(key);
            if (data === null) {
                return null;
            }
            
            // Run validator function
            if (validator && typeof validator === 'function') {
                return validator(data) ? data : null;
            }
            
            return data;
        } catch (error) {
            console.warn(`Malformed data for key "${key}":`, error);
            return null;
        }
    }

    /**
     * Validate tasks array
     * @param {any} data - Data to validate
     * @returns {boolean} True if valid
     */
    function validateTasks(data) {
        if (!Array.isArray(data)) {
            return false;
        }
        
        // Check each task has required fields
        return data.every(task => 
            task && 
            typeof task === 'object' &&
            typeof task.id === 'string' &&
            typeof task.text === 'string' &&
            typeof task.completed === 'boolean'
        );
    }

    /**
     * Validate links array
     * @param {any} data - Data to validate
     * @returns {boolean} True if valid
     */
    function validateLinks(data) {
        if (!Array.isArray(data)) {
            return false;
        }
        
        // Check each link has required fields
        return data.every(link => 
            link && 
            typeof link === 'object' &&
            typeof link.id === 'string' &&
            typeof link.name === 'string' &&
            typeof link.url === 'string'
        );
    }

    /**
     * Validate timer duration
     * @param {any} data - Data to validate
     * @returns {boolean} True if valid
     */
    function validateTimerDuration(data) {
        return typeof data === 'number' && data >= 1 && data <= 120;
    }

    /**
     * Validate task order array
     * @param {any} data - Data to validate
     * @returns {boolean} True if valid
     */
    function validateTaskOrder(data) {
        if (!Array.isArray(data)) {
            return false;
        }
        
        // Check all elements are strings (task IDs)
        return data.every(id => typeof id === 'string');
    }

    /**
     * Clean up malformed storage data
     */
    function cleanupMalformedData() {
        let hasCorruptedData = false;

        // Validate and clean tasks
        const tasks = validateStorageData('tasks', validateTasks);
        if (Storage.hasItem('tasks') && tasks === null) {
            Storage.removeItem('tasks');
            hasCorruptedData = true;
        }

        // Validate and clean links
        const links = validateStorageData('links', validateLinks);
        if (Storage.hasItem('links') && links === null) {
            Storage.removeItem('links');
            hasCorruptedData = true;
        }

        // Validate and clean timer duration
        const duration = validateStorageData('timerDuration', validateTimerDuration);
        if (Storage.hasItem('timerDuration') && duration === null) {
            Storage.removeItem('timerDuration');
            hasCorruptedData = true;
        }

        // Validate and clean task order
        const taskOrder = validateStorageData('taskOrder', validateTaskOrder);
        if (Storage.hasItem('taskOrder') && taskOrder === null) {
            Storage.removeItem('taskOrder');
            hasCorruptedData = true;
        }

        // Display warning if corrupted data was found
        if (hasCorruptedData) {
            console.warn('Could not load saved data. Starting fresh.');
            displayDataCorruptionWarning();
        }
    }

    /**
     * Display data corruption warning
     */
    function displayDataCorruptionWarning() {
        const warningDiv = document.createElement('div');
        warningDiv.className = 'storage-warning';
        warningDiv.setAttribute('role', 'alert');
        warningDiv.setAttribute('aria-live', 'assertive');
        warningDiv.textContent = 'Could not load saved data. Starting fresh.';
        
        // Insert at the top of the dashboard
        const dashboard = document.querySelector('.dashboard');
        if (dashboard) {
            dashboard.insertBefore(warningDiv, dashboard.firstChild);
        }

        // Auto-hide after 5 seconds
        setTimeout(() => {
            warningDiv.remove();
        }, 5000);
    }

    /**
     * Set up global error handlers
     */
    function setupErrorHandlers() {
        // Handle uncaught errors
        window.addEventListener('error', (event) => {
            console.error('Uncaught error:', event.error);
            // Prevent default error handling to avoid breaking the app
            event.preventDefault();
        });

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            // Prevent default handling
            event.preventDefault();
        });
    }

    /**
     * Initialize all components
     */
    function initializeComponents() {
        // Get container elements
        const greetingContainer = document.querySelector('.greeting-container');
        const timerContainer = document.querySelector('.timer-container');
        const tasksContainer = document.querySelector('.tasks-container');
        const linksContainer = document.querySelector('.links-container');

        // Validate required elements exist
        if (!greetingContainer) {
            throw new Error('Greeting container element not found');
        }
        if (!timerContainer) {
            throw new Error('Timer container element not found');
        }
        if (!tasksContainer) {
            throw new Error('Tasks container element not found');
        }
        if (!linksContainer) {
            throw new Error('Links container element not found');
        }

        // Initialize components in correct order
        // 1. Greeting (stateless, no storage dependency)
        GreetingDisplay.init(greetingContainer);

        // 2. Timer (loads custom duration from storage)
        FocusTimer.init(timerContainer);

        // 3. Tasks (loads tasks and task order from storage)
        TaskList.init(tasksContainer);

        // 4. Links (loads links from storage)
        QuickLinks.init(linksContainer);
    }

    /**
     * Main initialization function
     */
    function init() {
        try {
            // Set up global error handlers first
            setupErrorHandlers();

            // Check storage availability
            const storageAvailable = checkStorageAvailability();
            if (!storageAvailable) {
                displayStorageWarning();
            }

            // Clean up any malformed storage data
            if (storageAvailable) {
                cleanupMalformedData();
            }

            // Initialize all components
            initializeComponents();

            // Log initialization time for performance monitoring
            const initEndTime = performance.now();
            const initDuration = initEndTime - initStartTime;
            console.log(`Productivity Dashboard initialized in ${initDuration.toFixed(2)}ms`);

            // Warn if initialization took longer than 1 second
            if (initDuration > 1000) {
                console.warn(`Initialization took ${initDuration.toFixed(2)}ms, exceeding 1 second target`);
            }

        } catch (error) {
            console.error('Failed to initialize application:', error);
            
            // Display user-friendly error message
            const errorDiv = document.createElement('div');
            errorDiv.className = 'init-error';
            errorDiv.setAttribute('role', 'alert');
            errorDiv.textContent = 'Failed to load the application. Please refresh the page.';
            document.body.appendChild(errorDiv);
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // DOM is already ready
        init();
    }

})();
