/**
 * Property-Based Tests for Focus Timer Component
 * Feature: productivity-dashboard
 */

const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');
const fc = require('fast-check');
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

describe('Focus Timer Property Tests', () => {
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

    // Feature: productivity-dashboard, Property 4: Timer Start Countdown
    // **Validates: Requirements 3.2**
    it('Property 4: Timer Start Countdown', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 7200 }), // 1 second to 120 minutes in seconds
                (initialTime) => {
                    // Initialize timer
                    FocusTimer.init(container);
                    
                    // Set initial time
                    FocusTimer.currentTime = initialTime;
                    FocusTimer.isRunning = false;
                    FocusTimer.intervalId = null;
                    
                    // Start the timer
                    FocusTimer.start();
                    
                    // Verify running state is true
                    expect(FocusTimer.isRunning).toBe(true);
                    
                    // Verify interval is created (countdown behavior enabled)
                    expect(FocusTimer.intervalId).not.toBeNull();
                    
                    // Cleanup
                    FocusTimer.stop();
                }
            ),
            { numRuns: 100 }
        );
    });

    // Feature: productivity-dashboard, Property 5: Timer Stop Preserves State
    // **Validates: Requirements 3.5**
    it('Property 5: Timer Stop Preserves State', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 7200 }), // 1 second to 120 minutes in seconds
                (remainingTime) => {
                    // Initialize timer
                    FocusTimer.init(container);
                    
                    // Set time and start timer
                    FocusTimer.currentTime = remainingTime;
                    FocusTimer.start();
                    
                    // Verify timer is running
                    expect(FocusTimer.isRunning).toBe(true);
                    
                    // Store the time before stopping
                    const timeBeforeStop = FocusTimer.currentTime;
                    
                    // Stop the timer
                    FocusTimer.stop();
                    
                    // Verify running state is false
                    expect(FocusTimer.isRunning).toBe(false);
                    
                    // Verify current time is preserved
                    expect(FocusTimer.currentTime).toBe(timeBeforeStop);
                    
                    // Verify interval is cleared
                    expect(FocusTimer.intervalId).toBeNull();
                }
            ),
            { numRuns: 100 }
        );
    });

    // Feature: productivity-dashboard, Property 6: Timer Reset to Duration
    // **Validates: Requirements 3.6, 16.3**
    it('Property 6: Timer Reset to Duration', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 120 }), // Valid duration range in minutes
                fc.integer({ min: 0, max: 7200 }), // Any current time state
                (customDuration, currentTime) => {
                    // Initialize timer
                    FocusTimer.init(container);
                    
                    // Set custom duration
                    FocusTimer.setDuration(customDuration);
                    
                    // Modify current time to something different
                    FocusTimer.currentTime = currentTime;
                    
                    // Start timer if current time is positive
                    if (currentTime > 0) {
                        FocusTimer.start();
                    }
                    
                    // Reset the timer
                    FocusTimer.reset();
                    
                    // Verify time is set to configured duration
                    expect(FocusTimer.currentTime).toBe(customDuration * 60);
                    
                    // Verify running state is false
                    expect(FocusTimer.isRunning).toBe(false);
                    
                    // Verify interval is cleared
                    expect(FocusTimer.intervalId).toBeNull();
                }
            ),
            { numRuns: 100 }
        );
    });

    // Feature: productivity-dashboard, Property 20: Custom Timer Duration Update
    // **Validates: Requirements 16.2**
    it('Property 20: Custom Timer Duration Update', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 120 }), // Valid duration range in minutes
                (duration) => {
                    // Initialize timer
                    FocusTimer.init(container);
                    
                    // Set custom duration
                    const result = FocusTimer.setDuration(duration);
                    
                    // Verify setDuration returns true for valid input
                    expect(result).toBe(true);
                    
                    // Verify custom duration is updated
                    expect(FocusTimer.customDuration).toBe(duration);
                    
                    // Verify current time is set to new duration
                    expect(FocusTimer.currentTime).toBe(duration * 60);
                    
                    // Reset and verify it uses the custom duration
                    FocusTimer.currentTime = 500; // Set to some other value
                    FocusTimer.reset();
                    expect(FocusTimer.currentTime).toBe(duration * 60);
                }
            ),
            { numRuns: 100 }
        );
    });

    // Additional property test: Invalid duration rejection
    it('Property 20 (boundary): Invalid duration values are rejected', () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    fc.integer({ max: 0 }), // Values <= 0
                    fc.integer({ min: 121 }) // Values > 120
                ),
                (invalidDuration) => {
                    // Initialize timer
                    FocusTimer.init(container);
                    
                    // Store original duration
                    const originalDuration = FocusTimer.customDuration;
                    
                    // Attempt to set invalid duration
                    const result = FocusTimer.setDuration(invalidDuration);
                    
                    // Verify setDuration returns false
                    expect(result).toBe(false);
                    
                    // Verify custom duration remains unchanged
                    expect(FocusTimer.customDuration).toBe(originalDuration);
                }
            ),
            { numRuns: 100 }
        );
    });
});
