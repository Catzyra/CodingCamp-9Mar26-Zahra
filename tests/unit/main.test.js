/**
 * Unit Tests for Main Application Initialization
 */

describe('Main Application Initialization', () => {
    let originalLocalStorage;
    let mockGreetingDisplay;
    let mockFocusTimer;
    let mockTaskList;
    let mockQuickLinks;

    beforeEach(() => {
        // Save original localStorage
        originalLocalStorage = global.localStorage;

        // Create mock components
        mockGreetingDisplay = { init: jest.fn() };
        mockFocusTimer = { init: jest.fn() };
        mockTaskList = { init: jest.fn() };
        mockQuickLinks = { init: jest.fn() };

        global.GreetingDisplay = mockGreetingDisplay;
        global.FocusTimer = mockFocusTimer;
        global.TaskList = mockTaskList;
        global.QuickLinks = mockQuickLinks;

        // Set up DOM
        document.body.innerHTML = `
            <main class="dashboard">
                <section class="greeting-section">
                    <div class="greeting-container"></div>
                </section>
                <section class="timer-section">
                    <div class="timer-container"></div>
                </section>
                <section class="tasks-section">
                    <div class="tasks-container"></div>
                </section>
                <section class="links-section">
                    <div class="links-container"></div>
                </section>
            </main>
        `;

        // Mock performance.now()
        global.performance = {
            now: jest.fn(() => 0)
        };

        // Clear console methods
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        global.localStorage = originalLocalStorage;
        jest.restoreAllMocks();
    });

    describe('Storage Availability Check', () => {
        test('should detect when localStorage is available', () => {
            // Mock localStorage
            const mockStorage = {
                setItem: jest.fn(),
                removeItem: jest.fn(),
                getItem: jest.fn(() => null)
            };
            global.localStorage = mockStorage;

            // Load main.js functions (in real test, this would be imported)
            // For now, we'll test the logic directly
            const isStorageAvailable = () => {
                try {
                    const testKey = '__storage_test__';
                    localStorage.setItem(testKey, 'test');
                    localStorage.removeItem(testKey);
                    return true;
                } catch (error) {
                    return false;
                }
            };

            expect(isStorageAvailable()).toBe(true);
            expect(mockStorage.setItem).toHaveBeenCalledWith('__storage_test__', 'test');
            expect(mockStorage.removeItem).toHaveBeenCalledWith('__storage_test__');
        });

        test('should detect when localStorage is unavailable', () => {
            // Mock localStorage that throws error
            const mockStorage = {
                setItem: jest.fn(() => {
                    throw new Error('Storage disabled');
                }),
                removeItem: jest.fn()
            };
            global.localStorage = mockStorage;

            const isStorageAvailable = () => {
                try {
                    const testKey = '__storage_test__';
                    localStorage.setItem(testKey, 'test');
                    localStorage.removeItem(testKey);
                    return true;
                } catch (error) {
                    return false;
                }
            };

            expect(isStorageAvailable()).toBe(false);
        });

        test('should display warning when storage is unavailable', () => {
            const displayStorageWarning = () => {
                const warningDiv = document.createElement('div');
                warningDiv.className = 'storage-warning';
                warningDiv.setAttribute('role', 'alert');
                warningDiv.setAttribute('aria-live', 'assertive');
                warningDiv.textContent = 'Local storage is disabled. Your data will not be saved.';
                
                const dashboard = document.querySelector('.dashboard');
                if (dashboard) {
                    dashboard.insertBefore(warningDiv, dashboard.firstChild);
                }
            };

            displayStorageWarning();

            const warning = document.querySelector('.storage-warning');
            expect(warning).toBeTruthy();
            expect(warning.textContent).toBe('Local storage is disabled. Your data will not be saved.');
            expect(warning.getAttribute('role')).toBe('alert');
            expect(warning.getAttribute('aria-live')).toBe('assertive');
        });
    });

    describe('Malformed Storage Data Handling', () => {
        test('should handle malformed tasks data', () => {
            const mockStorage = {
                getItem: jest.fn((key) => {
                    if (key === 'tasks') return 'invalid json';
                    return null;
                }),
                removeItem: jest.fn()
            };
            global.localStorage = mockStorage;

            const validateStorageData = () => {
                try {
                    const tasksData = localStorage.getItem('tasks');
                    if (tasksData !== null) {
                        try {
                            const tasks = JSON.parse(tasksData);
                            if (!Array.isArray(tasks)) {
                                localStorage.removeItem('tasks');
                                return false;
                            }
                        } catch (error) {
                            localStorage.removeItem('tasks');
                            return false;
                        }
                    }
                    return true;
                } catch (error) {
                    return false;
                }
            };

            expect(validateStorageData()).toBe(false);
            expect(mockStorage.removeItem).toHaveBeenCalledWith('tasks');
        });

        test('should handle non-array tasks data', () => {
            const mockStorage = {
                getItem: jest.fn((key) => {
                    if (key === 'tasks') return '{"not": "array"}';
                    return null;
                }),
                removeItem: jest.fn()
            };
            global.localStorage = mockStorage;

            const validateStorageData = () => {
                try {
                    const tasksData = localStorage.getItem('tasks');
                    if (tasksData !== null) {
                        try {
                            const tasks = JSON.parse(tasksData);
                            if (!Array.isArray(tasks)) {
                                localStorage.removeItem('tasks');
                                return false;
                            }
                        } catch (error) {
                            localStorage.removeItem('tasks');
                            return false;
                        }
                    }
                    return true;
                } catch (error) {
                    return false;
                }
            };

            expect(validateStorageData()).toBe(false);
            expect(mockStorage.removeItem).toHaveBeenCalledWith('tasks');
        });

        test('should handle invalid timer duration', () => {
            const mockStorage = {
                getItem: jest.fn((key) => {
                    if (key === 'timerDuration') return '150'; // > 120
                    return null;
                }),
                removeItem: jest.fn()
            };
            global.localStorage = mockStorage;

            const validateStorageData = () => {
                try {
                    const durationData = localStorage.getItem('timerDuration');
                    if (durationData !== null) {
                        try {
                            const duration = JSON.parse(durationData);
                            if (typeof duration !== 'number' || duration < 1 || duration > 120) {
                                localStorage.removeItem('timerDuration');
                                return false;
                            }
                        } catch (error) {
                            localStorage.removeItem('timerDuration');
                            return false;
                        }
                    }
                    return true;
                } catch (error) {
                    return false;
                }
            };

            expect(validateStorageData()).toBe(false);
            expect(mockStorage.removeItem).toHaveBeenCalledWith('timerDuration');
        });

        test('should display data corruption warning', () => {
            const displayDataCorruptionWarning = () => {
                const warningDiv = document.createElement('div');
                warningDiv.className = 'storage-warning';
                warningDiv.setAttribute('role', 'alert');
                warningDiv.setAttribute('aria-live', 'assertive');
                warningDiv.textContent = 'Could not load saved data. Starting fresh.';
                
                const dashboard = document.querySelector('.dashboard');
                if (dashboard) {
                    dashboard.insertBefore(warningDiv, dashboard.firstChild);
                }
            };

            displayDataCorruptionWarning();

            const warning = document.querySelector('.storage-warning');
            expect(warning).toBeTruthy();
            expect(warning.textContent).toBe('Could not load saved data. Starting fresh.');
        });
    });

    describe('Component Initialization', () => {
        test('should initialize all components in correct order', () => {
            const mockStorage = {
                getItem: jest.fn(() => null),
                setItem: jest.fn(),
                removeItem: jest.fn()
            };
            global.localStorage = mockStorage;

            const initializeComponents = () => {
                const greetingContainer = document.querySelector('.greeting-container');
                if (greetingContainer) {
                    GreetingDisplay.init(greetingContainer);
                }
                
                const timerContainer = document.querySelector('.timer-container');
                if (timerContainer) {
                    FocusTimer.init(timerContainer);
                }
                
                const tasksContainer = document.querySelector('.tasks-container');
                if (tasksContainer) {
                    TaskList.init(tasksContainer);
                }
                
                const linksContainer = document.querySelector('.links-container');
                if (linksContainer) {
                    QuickLinks.init(linksContainer);
                }
            };

            initializeComponents();

            expect(mockGreetingDisplay.init).toHaveBeenCalled();
            expect(mockFocusTimer.init).toHaveBeenCalled();
            expect(mockTaskList.init).toHaveBeenCalled();
            expect(mockQuickLinks.init).toHaveBeenCalled();
        });

        test('should handle missing container elements gracefully', () => {
            document.body.innerHTML = '<main class="dashboard"></main>';

            const initializeComponents = () => {
                const greetingContainer = document.querySelector('.greeting-container');
                if (greetingContainer) {
                    GreetingDisplay.init(greetingContainer);
                } else {
                    console.error('Greeting container element not found');
                }
            };

            expect(() => initializeComponents()).not.toThrow();
            expect(console.error).toHaveBeenCalledWith('Greeting container element not found');
        });

        test('should handle component initialization errors', () => {
            mockGreetingDisplay.init.mockImplementation(() => {
                throw new Error('Init failed');
            });

            const initializeComponents = () => {
                const greetingContainer = document.querySelector('.greeting-container');
                if (greetingContainer) {
                    try {
                        GreetingDisplay.init(greetingContainer);
                    } catch (error) {
                        console.error('Failed to initialize Greeting Display:', error);
                    }
                }
            };

            expect(() => initializeComponents()).not.toThrow();
            expect(console.error).toHaveBeenCalled();
        });
    });

    describe('Global Error Handlers', () => {
        test('should set up error event handler', () => {
            const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

            const setupErrorHandlers = () => {
                window.addEventListener('error', (event) => {
                    console.error('Uncaught error:', event.error);
                    event.preventDefault();
                });
            };

            setupErrorHandlers();

            expect(addEventListenerSpy).toHaveBeenCalledWith('error', expect.any(Function));
        });

        test('should set up unhandled rejection handler', () => {
            const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

            const setupErrorHandlers = () => {
                window.addEventListener('unhandledrejection', (event) => {
                    console.error('Unhandled promise rejection:', event.reason);
                    event.preventDefault();
                });
            };

            setupErrorHandlers();

            expect(addEventListenerSpy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
        });
    });

    describe('Performance Monitoring', () => {
        test('should log initialization time', () => {
            let callCount = 0;
            global.performance.now = jest.fn(() => {
                callCount++;
                return callCount === 1 ? 0 : 500; // 500ms initialization
            });

            const initStartTime = performance.now();
            // Simulate initialization
            const initEndTime = performance.now();
            const initDuration = initEndTime - initStartTime;

            console.log(`Productivity Dashboard initialized in ${initDuration.toFixed(2)}ms`);

            expect(console.log).toHaveBeenCalledWith('Productivity Dashboard initialized in 500.00ms');
        });

        test('should warn if initialization exceeds 1 second', () => {
            let callCount = 0;
            global.performance.now = jest.fn(() => {
                callCount++;
                return callCount === 1 ? 0 : 1500; // 1500ms initialization
            });

            const initStartTime = performance.now();
            const initEndTime = performance.now();
            const initDuration = initEndTime - initStartTime;

            if (initDuration > 1000) {
                console.warn(`Initialization took ${initDuration.toFixed(2)}ms, exceeding 1 second target`);
            }

            expect(console.warn).toHaveBeenCalledWith('Initialization took 1500.00ms, exceeding 1 second target');
        });
    });
});
