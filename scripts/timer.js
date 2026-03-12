/**
 * Focus Timer Component
 * Countdown timer with customizable duration
 */

const FocusTimer = {
    // State
    currentTime: 25 * 60, // Default 25 minutes in seconds
    isRunning: false,
    intervalId: null,
    defaultDuration: 25, // Default duration in minutes
    customDuration: 25, // Custom duration in minutes
    
    // DOM elements
    displayElement: null,
    startButton: null,
    stopButton: null,
    resetButton: null,
    durationInput: null,
    setDurationButton: null,
    errorMessageElement: null,

    /**
     * Initialize the timer component
     * @param {HTMLElement} containerElement - Container element for the timer
     */
    init(containerElement) {
        // Get DOM elements
        this.displayElement = containerElement.querySelector('.timer-display');
        this.startButton = containerElement.querySelector('.btn-start');
        this.stopButton = containerElement.querySelector('.btn-stop');
        this.resetButton = containerElement.querySelector('.btn-reset');
        this.durationInput = containerElement.querySelector('.duration-input');
        this.setDurationButton = containerElement.querySelector('.btn-set-duration');

        // Create error message element if it doesn't exist
        let errorElement = containerElement.querySelector('.timer-error');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'timer-error';
            errorElement.setAttribute('role', 'alert');
            errorElement.setAttribute('aria-live', 'polite');
            const settingsDiv = containerElement.querySelector('.timer-settings');
            settingsDiv.appendChild(errorElement);
        }
        this.errorMessageElement = errorElement;

        // Load custom duration from storage
        const savedDuration = Storage.getItem('timerDuration');
        if (savedDuration !== null && typeof savedDuration === 'number') {
            if (savedDuration >= 1 && savedDuration <= 120) {
                this.customDuration = savedDuration;
            }
        }

        // Set initial display
        this.currentTime = this.customDuration * 60;
        this.durationInput.value = this.customDuration;
        this.updateDisplay();

        // Attach event listeners
        this.startButton.addEventListener('click', () => this.start());
        this.stopButton.addEventListener('click', () => this.stop());
        this.resetButton.addEventListener('click', () => this.reset());
        this.setDurationButton.addEventListener('click', () => this.handleSetDuration());
        
        // Allow Enter key to set duration
        this.durationInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSetDuration();
            }
        });
    },

    /**
     * Update the timer display
     */
    updateDisplay() {
        const minutes = Math.floor(this.currentTime / 60);
        const seconds = this.currentTime % 60;
        const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        this.displayElement.textContent = formattedTime;
    },

    /**
     * Start countdown
     */
    start() {
        if (this.isRunning) return; // Already running
        
        this.isRunning = true;
        this.intervalId = setInterval(() => {
            if (this.currentTime > 0) {
                this.currentTime--;
                this.updateDisplay();
                
                // Check if timer reached 00:00 after decrement
                if (this.currentTime === 0) {
                    this.stop();
                }
            }
        }, 1000);
    },

    /**
     * Pause countdown
     */
    stop() {
        if (!this.isRunning) return; // Already stopped
        
        this.isRunning = false;
        if (this.intervalId !== null) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    },

    /**
     * Reset to initial duration
     */
    reset() {
        this.stop();
        this.currentTime = this.customDuration * 60;
        this.updateDisplay();
    },

    /**
     * Handle set duration button click
     */
    handleSetDuration() {
        const value = this.durationInput.value.trim();
        
        // Clear previous error
        this.clearError();
        
        // Validate input is not empty
        if (value === '') {
            this.showError('Please enter a valid number');
            return;
        }
        
        // Parse the value
        const minutes = parseFloat(value);
        
        // Validate it's a number
        if (isNaN(minutes)) {
            this.showError('Please enter a valid number');
            return;
        }
        
        // Attempt to set duration
        const success = this.setDuration(minutes);
        
        if (!success) {
            this.showError('Duration must be between 1 and 120 minutes');
        }
    },

    /**
     * Show error message
     * @param {string} message - Error message to display
     */
    showError(message) {
        if (this.errorMessageElement) {
            this.errorMessageElement.textContent = message;
            this.errorMessageElement.style.display = 'block';
        }
    },

    /**
     * Clear error message
     */
    clearError() {
        if (this.errorMessageElement) {
            this.errorMessageElement.textContent = '';
            this.errorMessageElement.style.display = 'none';
        }
    },

    /**
     * Set custom duration
     * @param {number} minutes - Duration in minutes
     * @returns {boolean} Success status
     */
    setDuration(minutes) {
        // Validate range
        if (minutes < 1 || minutes > 120) {
            return false;
        }
        
        // Validate it's a number
        if (typeof minutes !== 'number' || isNaN(minutes)) {
            return false;
        }
        
        // Update custom duration
        this.customDuration = minutes;
        
        // Save to storage
        Storage.setItem('timerDuration', minutes);
        
        // Reset timer to new duration
        this.reset();
        
        // Update input field
        this.durationInput.value = minutes;
        
        return true;
    },

    /**
     * Get current duration setting
     * @returns {number} Duration in minutes
     */
    getDuration() {
        return this.customDuration;
    }
};
