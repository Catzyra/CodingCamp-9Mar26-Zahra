/**
 * Greeting Display Component
 * Displays current time, date, and time-based greeting
 */

const GreetingDisplay = {
    container: null,
    timeElement: null,
    dateElement: null,
    greetingElement: null,
    intervalId: null,

    /**
     * Initialize the greeting component
     * @param {HTMLElement} containerElement - Container element for the greeting
     */
    init(containerElement) {
        this.container = containerElement;
        this.timeElement = containerElement.querySelector('.time');
        this.dateElement = containerElement.querySelector('.date');
        this.greetingElement = containerElement.querySelector('.greeting');

        // Initial update
        this.update();

        // Update every second
        this.intervalId = setInterval(() => this.update(), 1000);
    },

    /**
     * Format time in 12-hour format with AM/PM
     * @param {Date} date - Date object
     * @returns {string} Formatted time string (e.g., "12:34 PM")
     */
    formatTime(date) {
        let hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        
        // Convert to 12-hour format
        hours = hours % 12;
        hours = hours ? hours : 12; // 0 should be 12
        
        // Pad minutes with leading zero
        const minutesStr = minutes < 10 ? '0' + minutes : minutes;
        
        return `${hours}:${minutesStr} ${ampm}`;
    },

    /**
     * Format date with day of week, month, and day
     * @param {Date} date - Date object
     * @returns {string} Formatted date string (e.g., "Monday, January 15")
     */
    formatDate(date) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
        
        const dayName = days[date.getDay()];
        const monthName = months[date.getMonth()];
        const dayNumber = date.getDate();
        
        return `${dayName}, ${monthName} ${dayNumber}`;
    },

    /**
     * Get greeting text based on current time
     * @param {number} hour - Hour value (0-23)
     * @returns {string} Greeting text
     */
    getGreeting(hour) {
        // Morning: 5:00-11:59
        if (hour >= 5 && hour < 12) {
            return 'Good Morning';
        }
        // Afternoon: 12:00-16:59
        else if (hour >= 12 && hour < 17) {
            return 'Good Afternoon';
        }
        // Evening: 17:00-20:59
        else if (hour >= 17 && hour < 21) {
            return 'Good Evening';
        }
        // Night: 21:00-4:59
        else {
            return 'Good Night';
        }
    },

    /**
     * Update display (called every second)
     */
    update() {
        const now = new Date();
        
        if (this.timeElement) {
            this.timeElement.textContent = this.formatTime(now);
        }
        
        if (this.dateElement) {
            this.dateElement.textContent = this.formatDate(now);
        }
        
        if (this.greetingElement) {
            this.greetingElement.textContent = this.getGreeting(now.getHours());
        }
    }
};
