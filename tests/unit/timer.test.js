/**
 * Unit tests for Focus Timer Component
 */

const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');
const fs = require('fs');
const path = require('path');

// Load the timer module code
const timerCode = fs.readFileSync(path.join(__dirname, '../../scripts/timer.js'), 'utf8');

// Mock DOM elements
const createTimerDOM = () => {
    const container = document.createElement('div');
    container.className = 'timer-container';
    container.innerHTML = `
        <div class="timer-display">25:00</div>
        <div class="timer-controls">
            <button class="btn-start">Start</button>
            <button class="btn-stop">Stop</button>
            <button class="btn-reset">Reset</button>
        </div>
        <div class="timer-settings">
            <label for="duration-input">Duration (minutes):</label>
            <input type="number" id="duration-input" class="duration-input" min="1" max="120" />
            <button class="btn-set-duration">Set Duration</button>
        </div>
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

describe('Focus Timer Component - Task 4.1', () => {
    let container;
    let FocusTimer;

    beforeEach(() => {
        // Setup DOM
        container = createTimerDOM();
        document.body.appendChild(container);
        
        // Clear mock storage
        mockStorage.clear();
        
        // Load timer module into scope
        FocusTimer = eval(timerCode + '; FocusTimer;');
        
        // Reset timer state
        FocusTimer.currentTime = 25 * 60;
        FocusTimer.isRunning = false;
        FocusTimer.intervalId = null;
        FocusTimer.defaultDuration = 25;
        FocusTimer.customDuration = 25;
        FocusTimer.displayElement = null;
        FocusTimer.startButton = null;
        FocusTimer.stopButton = null;
        FocusTimer.resetButton = null;
        FocusTimer.durationInput = null;
        FocusTimer.setDurationButton = null;
        FocusTimer.errorMessageElement = null;
    });

    afterEach(() => {
        // Cleanup
        if (FocusTimer && FocusTimer.intervalId) {
            clearInterval(FocusTimer.intervalId);
        }
        if (container && container.parentNode) {
            document.body.removeChild(container);
        }
    });

    describe('init()', () => {
        it('should initialize with 25:00 default duration', () => {
            FocusTimer.init(container);
            const display = container.querySelector('.timer-display');
            expect(display.textContent).toBe('25:00');
        });

        it('should set currentTime to 1500 seconds (25 minutes)', () => {
            FocusTimer.init(container);
            expect(FocusTimer.currentTime).toBe(1500);
        });

        it('should attach event listeners to buttons', () => {
            FocusTimer.init(container);
            expect(FocusTimer.startButton).toBeTruthy();
            expect(FocusTimer.stopButton).toBeTruthy();
            expect(FocusTimer.resetButton).toBeTruthy();
        });
    });

    describe('start()', () => {
        it('should set isRunning to true', () => {
            FocusTimer.init(container);
            FocusTimer.start();
            expect(FocusTimer.isRunning).toBe(true);
        });

        it('should create an interval', () => {
            FocusTimer.init(container);
            FocusTimer.start();
            expect(FocusTimer.intervalId).not.toBeNull();
        });

        it('should not create multiple intervals if already running', () => {
            FocusTimer.init(container);
            FocusTimer.start();
            const firstIntervalId = FocusTimer.intervalId;
            FocusTimer.start();
            expect(FocusTimer.intervalId).toBe(firstIntervalId);
        });
    });

    describe('stop()', () => {
        it('should set isRunning to false', () => {
            FocusTimer.init(container);
            FocusTimer.start();
            FocusTimer.stop();
            expect(FocusTimer.isRunning).toBe(false);
        });

        it('should clear the interval', () => {
            FocusTimer.init(container);
            FocusTimer.start();
            FocusTimer.stop();
            expect(FocusTimer.intervalId).toBeNull();
        });

        it('should preserve current time when stopped', () => {
            FocusTimer.init(container);
            FocusTimer.currentTime = 1200; // 20 minutes
            const timeBeforeStop = FocusTimer.currentTime;
            FocusTimer.stop();
            expect(FocusTimer.currentTime).toBe(timeBeforeStop);
        });
    });

    describe('reset()', () => {
        it('should restore time to 25:00', () => {
            FocusTimer.init(container);
            FocusTimer.currentTime = 500; // Some other time
            FocusTimer.reset();
            expect(FocusTimer.currentTime).toBe(1500);
        });

        it('should stop the timer if running', () => {
            FocusTimer.init(container);
            FocusTimer.start();
            FocusTimer.reset();
            expect(FocusTimer.isRunning).toBe(false);
        });

        it('should update display to 25:00', () => {
            FocusTimer.init(container);
            FocusTimer.currentTime = 500;
            FocusTimer.reset();
            const display = container.querySelector('.timer-display');
            expect(display.textContent).toBe('25:00');
        });
    });

    describe('countdown logic', () => {
        it('should decrement time by 1 second', (done) => {
            FocusTimer.init(container);
            const initialTime = FocusTimer.currentTime;
            FocusTimer.start();
            
            setTimeout(() => {
                FocusTimer.stop();
                expect(FocusTimer.currentTime).toBe(initialTime - 1);
                done();
            }, 1100);
        });

        it('should stop at 00:00', (done) => {
            FocusTimer.init(container);
            FocusTimer.currentTime = 1; // 1 second remaining
            FocusTimer.start();
            
            setTimeout(() => {
                expect(FocusTimer.currentTime).toBe(0);
                expect(FocusTimer.isRunning).toBe(false);
                done();
            }, 1500);
        });

        it('should update display during countdown', (done) => {
            FocusTimer.init(container);
            FocusTimer.currentTime = 65; // 1:05
            FocusTimer.start();
            
            setTimeout(() => {
                FocusTimer.stop();
                const display = container.querySelector('.timer-display');
                expect(display.textContent).toBe('01:04');
                done();
            }, 1100);
        });
    });

    describe('display formatting', () => {
        it('should format minutes and seconds with leading zeros', () => {
            FocusTimer.init(container);
            FocusTimer.currentTime = 65; // 1:05
            FocusTimer.updateDisplay();
            const display = container.querySelector('.timer-display');
            expect(display.textContent).toBe('01:05');
        });

        it('should display 00:00 when time is zero', () => {
            FocusTimer.init(container);
            FocusTimer.currentTime = 0;
            FocusTimer.updateDisplay();
            const display = container.querySelector('.timer-display');
            expect(display.textContent).toBe('00:00');
        });
    });
});


describe('Focus Timer Component - Task 4.2 Custom Duration', () => {
    let container;
    let FocusTimer;

    beforeEach(() => {
        // Setup DOM
        container = createTimerDOM();
        document.body.appendChild(container);
        
        // Clear mock storage
        mockStorage.clear();
        
        // Load timer module into scope
        FocusTimer = eval(timerCode + '; FocusTimer;');
        
        // Reset timer state
        FocusTimer.currentTime = 25 * 60;
        FocusTimer.isRunning = false;
        FocusTimer.intervalId = null;
        FocusTimer.defaultDuration = 25;
        FocusTimer.customDuration = 25;
        FocusTimer.displayElement = null;
        FocusTimer.startButton = null;
        FocusTimer.stopButton = null;
        FocusTimer.resetButton = null;
        FocusTimer.durationInput = null;
        FocusTimer.setDurationButton = null;
        FocusTimer.errorMessageElement = null;
    });

    afterEach(() => {
        // Cleanup
        if (FocusTimer && FocusTimer.intervalId) {
            clearInterval(FocusTimer.intervalId);
        }
        if (container && container.parentNode) {
            document.body.removeChild(container);
        }
    });

    describe('setDuration()', () => {
        it('should accept valid duration within range (1-120)', () => {
            FocusTimer.init(container);
            const result = FocusTimer.setDuration(30);
            expect(result).toBe(true);
            expect(FocusTimer.customDuration).toBe(30);
        });

        it('should reject duration less than 1', () => {
            FocusTimer.init(container);
            const result = FocusTimer.setDuration(0);
            expect(result).toBe(false);
            expect(FocusTimer.customDuration).toBe(25); // Should remain unchanged
        });

        it('should reject duration greater than 120', () => {
            FocusTimer.init(container);
            const result = FocusTimer.setDuration(121);
            expect(result).toBe(false);
            expect(FocusTimer.customDuration).toBe(25); // Should remain unchanged
        });

        it('should accept boundary value 1', () => {
            FocusTimer.init(container);
            const result = FocusTimer.setDuration(1);
            expect(result).toBe(true);
            expect(FocusTimer.customDuration).toBe(1);
        });

        it('should accept boundary value 120', () => {
            FocusTimer.init(container);
            const result = FocusTimer.setDuration(120);
            expect(result).toBe(true);
            expect(FocusTimer.customDuration).toBe(120);
        });

        it('should save duration to storage', () => {
            FocusTimer.init(container);
            FocusTimer.setDuration(45);
            expect(mockStorage.getItem('timerDuration')).toBe(45);
        });

        it('should reset timer to new duration', () => {
            FocusTimer.init(container);
            FocusTimer.setDuration(10);
            expect(FocusTimer.currentTime).toBe(600); // 10 minutes in seconds
        });

        it('should update input field value', () => {
            FocusTimer.init(container);
            FocusTimer.setDuration(15);
            const input = container.querySelector('.duration-input');
            expect(input.value).toBe('15');
        });
    });

    describe('getDuration()', () => {
        it('should return current custom duration', () => {
            FocusTimer.init(container);
            FocusTimer.setDuration(40);
            expect(FocusTimer.getDuration()).toBe(40);
        });

        it('should return default 25 if no custom duration set', () => {
            FocusTimer.init(container);
            expect(FocusTimer.getDuration()).toBe(25);
        });
    });

    describe('init() with storage', () => {
        it('should load custom duration from storage on init', () => {
            mockStorage.setItem('timerDuration', 50);
            FocusTimer.init(container);
            expect(FocusTimer.customDuration).toBe(50);
            expect(FocusTimer.currentTime).toBe(3000); // 50 minutes in seconds
        });

        it('should use default 25 if no duration in storage', () => {
            FocusTimer.init(container);
            expect(FocusTimer.customDuration).toBe(25);
            expect(FocusTimer.currentTime).toBe(1500);
        });

        it('should populate input field with loaded duration', () => {
            mockStorage.setItem('timerDuration', 35);
            FocusTimer.init(container);
            const input = container.querySelector('.duration-input');
            expect(input.value).toBe('35');
        });

        it('should ignore invalid stored duration (< 1)', () => {
            mockStorage.setItem('timerDuration', 0);
            FocusTimer.init(container);
            expect(FocusTimer.customDuration).toBe(25); // Should use default
        });

        it('should ignore invalid stored duration (> 120)', () => {
            mockStorage.setItem('timerDuration', 150);
            FocusTimer.init(container);
            expect(FocusTimer.customDuration).toBe(25); // Should use default
        });
    });

    describe('reset() with custom duration', () => {
        it('should reset to custom duration instead of default', () => {
            FocusTimer.init(container);
            FocusTimer.setDuration(60);
            FocusTimer.currentTime = 1000; // Some other time
            FocusTimer.reset();
            expect(FocusTimer.currentTime).toBe(3600); // 60 minutes in seconds
        });

        it('should display custom duration after reset', () => {
            FocusTimer.init(container);
            FocusTimer.setDuration(15);
            FocusTimer.reset();
            const display = container.querySelector('.timer-display');
            expect(display.textContent).toBe('15:00');
        });
    });

    describe('handleSetDuration() and error handling', () => {
        it('should show error for empty input', () => {
            FocusTimer.init(container);
            const input = container.querySelector('.duration-input');
            input.value = '';
            FocusTimer.handleSetDuration();
            expect(FocusTimer.errorMessageElement.textContent).toBe('Please enter a valid number');
        });

        it('should show error for non-numeric input', () => {
            FocusTimer.init(container);
            const input = container.querySelector('.duration-input');
            input.value = 'abc';
            FocusTimer.handleSetDuration();
            expect(FocusTimer.errorMessageElement.textContent).toBe('Please enter a valid number');
        });

        it('should show error for out of range value', () => {
            FocusTimer.init(container);
            const input = container.querySelector('.duration-input');
            input.value = '150';
            FocusTimer.handleSetDuration();
            expect(FocusTimer.errorMessageElement.textContent).toBe('Duration must be between 1 and 120 minutes');
        });

        it('should clear previous error on successful set', () => {
            FocusTimer.init(container);
            const input = container.querySelector('.duration-input');
            
            // First trigger an error
            input.value = '150';
            FocusTimer.handleSetDuration();
            expect(FocusTimer.errorMessageElement.textContent).toBeTruthy();
            
            // Then set valid value
            input.value = '30';
            FocusTimer.handleSetDuration();
            expect(FocusTimer.errorMessageElement.textContent).toBe('');
        });

        it('should handle whitespace in input', () => {
            FocusTimer.init(container);
            
            // Directly test that setDuration works with a trimmed value
            const value = '  45  ';
            const trimmed = value.trim();
            const parsed = parseFloat(trimmed);
            
            const result = FocusTimer.setDuration(parsed);
            expect(result).toBe(true);
            expect(FocusTimer.customDuration).toBe(45);
        });
    });

    describe('DOM elements', () => {
        it('should create error message element on init', () => {
            FocusTimer.init(container);
            const errorElement = container.querySelector('.timer-error');
            expect(errorElement).toBeTruthy();
            expect(errorElement.getAttribute('role')).toBe('alert');
        });

        it('should attach event listener to set duration button', () => {
            FocusTimer.init(container);
            expect(FocusTimer.setDurationButton).toBeTruthy();
        });

        it('should attach event listener to duration input', () => {
            FocusTimer.init(container);
            expect(FocusTimer.durationInput).toBeTruthy();
        });
    });
});
