/**
 * Unit tests for Error Handling
 * Task 11.2: Test storage quota exceeded, malformed JSON, missing DOM elements, and storage unavailable scenarios
 */

const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');
const fs = require('fs');
const path = require('path');

// Load the storage module code
const storageCode = fs.readFileSync(path.join(__dirname, '../../scripts/storage.js'), 'utf8');

// Load component codes for DOM error testing
const greetingCode = fs.readFileSync(path.join(__dirname, '../../scripts/greeting.js'), 'utf8');
const timerCode = fs.readFileSync(path.join(__dirname, '../../scripts/timer.js'), 'utf8');
const tasksCode = fs.readFileSync(path.join(__dirname, '../../scripts/tasks.js'), 'utf8');
const linksCode = fs.readFileSync(path.join(__dirname, '../../scripts/links.js'), 'utf8');

describe('Error Handling - Malformed JSON in Storage', () => {
    let Storage;
    let mockLocalStorage;

    beforeEach(() => {
        mockLocalStorage = {
            data: {},
            getItem(key) {
                return this.data[key] || null;
            },
            setItem(key, value) {
                this.data[key] = value;
            },
            removeItem(key) {
                delete this.data[key];
            }
        };

        global.localStorage = mockLocalStorage;
        Storage = eval(storageCode + '; Storage;');
    });

    afterEach(() => {
        delete global.localStorage;
    });

    it('should return null when JSON parsing fails', () => {
        // Store malformed JSON directly
        mockLocalStorage.data['tasks'] = '{invalid json}';
        
        const result = Storage.getItem('tasks');
        expect(result).toBeNull();
    });

    it('should log error when JSON parsing fails', () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        
        mockLocalStorage.data['tasks'] = '{invalid: json}';
        Storage.getItem('tasks');
        
        expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining('Error retrieving item'),
            expect.any(Error)
        );
        
        consoleSpy.mockRestore();
    });

    it('should handle incomplete JSON objects', () => {
        mockLocalStorage.data['data'] = '{"key": "value"';
        
        const result = Storage.getItem('data');
        expect(result).toBeNull();
    });

    it('should handle invalid JSON arrays', () => {
        mockLocalStorage.data['array'] = '[1, 2, 3,]';
        
        const result = Storage.getItem('array');
        expect(result).toBeNull();
    });

    it('should handle undefined values in JSON', () => {
        mockLocalStorage.data['undefined'] = 'undefined';
        
        const result = Storage.getItem('undefined');
        expect(result).toBeNull();
    });

    it('should handle NaN in JSON', () => {
        mockLocalStorage.data['nan'] = 'NaN';
        
        const result = Storage.getItem('nan');
        expect(result).toBeNull();
    });

    it('should successfully parse valid JSON after malformed attempt', () => {
        // First attempt with malformed JSON
        mockLocalStorage.data['test'] = '{bad}';
        expect(Storage.getItem('test')).toBeNull();
        
        // Second attempt with valid JSON
        Storage.setItem('test', { valid: 'data' });
        const result = Storage.getItem('test');
        expect(result).toEqual({ valid: 'data' });
    });
});

describe('Error Handling - Storage Unavailable', () => {
    let Storage;

    beforeEach(() => {
        // Simulate localStorage being unavailable
        delete global.localStorage;
        
        Storage = eval(storageCode + '; Storage;');
    });

    it('should return null when localStorage is unavailable on getItem', () => {
        const result = Storage.getItem('test');
        expect(result).toBeNull();
    });

    it('should return false when localStorage is unavailable on setItem', () => {
        const result = Storage.setItem('test', 'value');
        expect(result).toBe(false);
    });

    it('should return false when localStorage is unavailable on removeItem', () => {
        const result = Storage.removeItem('test');
        expect(result).toBe(false);
    });

    it('should return false when localStorage is unavailable on hasItem', () => {
        const result = Storage.hasItem('test');
        expect(result).toBe(false);
    });

    it('should log warning when localStorage is unavailable on getItem', () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
        
        Storage.getItem('test');
        
        expect(consoleSpy).toHaveBeenCalledWith(
            'Local storage is not available'
        );
        
        consoleSpy.mockRestore();
    });

    it('should log warning when localStorage is unavailable on setItem', () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
        
        Storage.setItem('test', 'value');
        
        expect(consoleSpy).toHaveBeenCalledWith(
            'Local storage is not available'
        );
        
        consoleSpy.mockRestore();
    });

    it('should handle multiple operations gracefully when storage unavailable', () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
        
        Storage.setItem('key1', 'value1');
        Storage.getItem('key1');
        Storage.removeItem('key1');
        Storage.hasItem('key1');
        
        // Should not crash and should log warnings
        expect(consoleSpy).toHaveBeenCalled();
        
        consoleSpy.mockRestore();
    });
});

describe('Error Handling - Missing DOM Elements', () => {
    describe('Greeting Component', () => {
        let GreetingDisplay;

        beforeEach(() => {
            GreetingDisplay = eval(greetingCode + '; GreetingDisplay;');
        });

        afterEach(() => {
            if (GreetingDisplay.intervalId) {
                clearInterval(GreetingDisplay.intervalId);
            }
        });

        it('should handle missing time element gracefully', () => {
            const container = document.createElement('div');
            container.innerHTML = `
                <div class="date">Date</div>
                <div class="greeting">Greeting</div>
            `;
            
            expect(() => {
                GreetingDisplay.init(container);
                GreetingDisplay.update();
            }).not.toThrow();
        });

        it('should handle missing date element gracefully', () => {
            const container = document.createElement('div');
            container.innerHTML = `
                <div class="time">Time</div>
                <div class="greeting">Greeting</div>
            `;
            
            expect(() => {
                GreetingDisplay.init(container);
                GreetingDisplay.update();
            }).not.toThrow();
        });

        it('should handle missing greeting element gracefully', () => {
            const container = document.createElement('div');
            container.innerHTML = `
                <div class="time">Time</div>
                <div class="date">Date</div>
            `;
            
            expect(() => {
                GreetingDisplay.init(container);
                GreetingDisplay.update();
            }).not.toThrow();
        });

        it('should handle completely empty container', () => {
            const container = document.createElement('div');
            
            expect(() => {
                GreetingDisplay.init(container);
                GreetingDisplay.update();
            }).not.toThrow();
        });

        it('should not update missing elements', () => {
            const container = document.createElement('div');
            container.innerHTML = `<div class="time">12:00 PM</div>`;
            
            GreetingDisplay.init(container);
            GreetingDisplay.update();
            
            // Should not crash even though date and greeting elements are missing
            expect(container.querySelector('.time')).toBeTruthy();
        });
    });

    describe('Timer Component', () => {
        let FocusTimer;
        let mockStorage;

        beforeEach(() => {
            mockStorage = {
                data: {},
                getItem(key) {
                    return this.data[key] || null;
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
                }
            };

            global.Storage = mockStorage;
            FocusTimer = eval(timerCode + '; FocusTimer;');
        });

        afterEach(() => {
            if (FocusTimer.intervalId) {
                clearInterval(FocusTimer.intervalId);
            }
            delete global.Storage;
        });

        it('should throw error when timer settings section is missing', () => {
            const container = document.createElement('div');
            container.innerHTML = `
                <div class="timer-display">25:00</div>
                <div class="timer-controls">
                    <button class="btn-start">Start</button>
                    <button class="btn-stop">Stop</button>
                    <button class="btn-reset">Reset</button>
                </div>
            `;
            
            expect(() => {
                FocusTimer.init(container);
            }).toThrow();
        });

        it('should throw error when control buttons are missing', () => {
            const container = document.createElement('div');
            container.innerHTML = `
                <div class="timer-display">25:00</div>
                <div class="timer-settings">
                    <input type="number" class="duration-input" />
                    <button class="btn-set-duration">Set</button>
                </div>
            `;
            
            expect(() => {
                FocusTimer.init(container);
            }).toThrow();
        });

        it('should throw error when duration input is missing', () => {
            const container = document.createElement('div');
            container.innerHTML = `
                <div class="timer-display">25:00</div>
                <div class="timer-controls">
                    <button class="btn-start">Start</button>
                    <button class="btn-stop">Stop</button>
                    <button class="btn-reset">Reset</button>
                </div>
                <div class="timer-settings">
                    <button class="btn-set-duration">Set</button>
                </div>
            `;
            
            expect(() => {
                FocusTimer.init(container);
            }).toThrow();
        });

        it('should throw error when container is completely empty', () => {
            const container = document.createElement('div');
            
            expect(() => {
                FocusTimer.init(container);
            }).toThrow();
        });
    });

    describe('Tasks Component', () => {
        let TaskList;
        let mockStorage;

        beforeEach(() => {
            mockStorage = {
                data: {},
                getItem(key) {
                    return this.data[key] || null;
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
                }
            };

            global.Storage = mockStorage;
            TaskList = eval(tasksCode + '; TaskList;');
        });

        afterEach(() => {
            delete global.Storage;
        });

        it('should handle missing task input element', () => {
            const container = document.createElement('div');
            container.innerHTML = `
                <button class="btn-add-task">Add</button>
                <ul class="task-list"></ul>
            `;
            
            expect(() => {
                TaskList.init(container);
            }).not.toThrow();
        });

        it('should handle missing task list element', () => {
            const container = document.createElement('div');
            container.innerHTML = `
                <input type="text" class="task-input" />
                <button class="btn-add-task">Add</button>
            `;
            
            expect(() => {
                TaskList.init(container);
            }).not.toThrow();
        });

        it('should handle missing add button', () => {
            const container = document.createElement('div');
            container.innerHTML = `
                <input type="text" class="task-input" />
                <ul class="task-list"></ul>
            `;
            
            expect(() => {
                TaskList.init(container);
            }).not.toThrow();
        });

        it('should handle completely empty container', () => {
            const container = document.createElement('div');
            
            expect(() => {
                TaskList.init(container);
            }).not.toThrow();
        });
    });

    describe('Links Component', () => {
        let QuickLinks;
        let mockStorage;

        beforeEach(() => {
            mockStorage = {
                data: {},
                getItem(key) {
                    return this.data[key] || null;
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
                }
            };

            global.Storage = mockStorage;
            QuickLinks = eval(linksCode + '; QuickLinks;');
        });

        afterEach(() => {
            delete global.Storage;
        });

        it('should handle missing link name input gracefully', () => {
            const container = document.createElement('div');
            container.innerHTML = `
                <input type="url" class="link-url-input" />
                <button class="btn-add-link">Add</button>
                <div class="links-grid"></div>
            `;
            
            expect(() => {
                QuickLinks.init(container);
            }).not.toThrow();
        });

        it('should throw error when link URL input is missing', () => {
            const container = document.createElement('div');
            container.innerHTML = `
                <input type="text" class="link-name-input" />
                <button class="btn-add-link">Add</button>
                <div class="links-grid"></div>
            `;
            
            expect(() => {
                QuickLinks.init(container);
            }).toThrow();
        });

        it('should throw error when links grid is missing', () => {
            const container = document.createElement('div');
            container.innerHTML = `
                <input type="text" class="link-name-input" />
                <input type="url" class="link-url-input" />
                <button class="btn-add-link">Add</button>
            `;
            
            expect(() => {
                QuickLinks.init(container);
            }).toThrow();
        });

        it('should throw error when container is completely empty', () => {
            const container = document.createElement('div');
            
            expect(() => {
                QuickLinks.init(container);
            }).toThrow();
        });
    });
});

describe('Error Handling - Storage Error Recovery', () => {
    let Storage;
    let mockLocalStorage;

    beforeEach(() => {
        mockLocalStorage = {
            data: {},
            throwError: false,
            getItem(key) {
                if (this.throwError) {
                    throw new Error('Storage access denied');
                }
                return this.data[key] || null;
            },
            setItem(key, value) {
                if (this.throwError) {
                    throw new Error('Storage access denied');
                }
                this.data[key] = value;
            },
            removeItem(key) {
                if (this.throwError) {
                    throw new Error('Storage access denied');
                }
                delete this.data[key];
            }
        };

        global.localStorage = mockLocalStorage;
        Storage = eval(storageCode + '; Storage;');
    });

    afterEach(() => {
        delete global.localStorage;
    });

    it('should handle unexpected errors in getItem', () => {
        mockLocalStorage.throwError = true;
        
        const result = Storage.getItem('test');
        expect(result).toBeNull();
    });

    it('should handle unexpected errors in setItem', () => {
        mockLocalStorage.throwError = true;
        
        const result = Storage.setItem('test', 'value');
        expect(result).toBe(false);
    });

    it('should handle unexpected errors in removeItem', () => {
        mockLocalStorage.throwError = true;
        
        const result = Storage.removeItem('test');
        expect(result).toBe(false);
    });

    it('should recover after error is resolved', () => {
        // First operation fails
        mockLocalStorage.throwError = true;
        expect(Storage.setItem('test', 'value')).toBe(false);
        
        // Error is resolved
        mockLocalStorage.throwError = false;
        expect(Storage.setItem('test', 'value')).toBe(true);
        expect(Storage.getItem('test')).toBe('value');
    });
});
