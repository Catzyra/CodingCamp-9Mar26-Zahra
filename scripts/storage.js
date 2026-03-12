/**
 * Storage Module
 * Provides abstraction layer for Local Storage operations
 */

const Storage = {
    /**
     * Get data from storage
     * @param {string} key - Storage key
     * @returns {any} Parsed data or null if not found
     */
    getItem(key) {
        try {
            // Check if localStorage is available
            if (typeof localStorage === 'undefined') {
                console.warn('Local storage is not available');
                return null;
            }

            const item = localStorage.getItem(key);
            
            // Return null if key doesn't exist
            if (item === null) {
                return null;
            }

            // Parse and return JSON data
            return JSON.parse(item);
        } catch (error) {
            console.error(`Error retrieving item with key "${key}":`, error);
            return null;
        }
    },

    /**
     * Save data to storage
     * @param {string} key - Storage key
     * @param {any} value - Data to store
     * @returns {boolean} Success status
     */
    setItem(key, value) {
        try {
            // Check if localStorage is available
            if (typeof localStorage === 'undefined') {
                console.warn('Local storage is not available');
                return false;
            }

            // Serialize and save data
            const serialized = JSON.stringify(value);
            localStorage.setItem(key, serialized);
            return true;
        } catch (error) {
            // Handle quota exceeded error
            if (error.name === 'QuotaExceededError') {
                console.error('Storage limit reached. Please delete some items.');
            } else {
                console.error(`Error saving item with key "${key}":`, error);
            }
            return false;
        }
    },

    /**
     * Remove data from storage
     * @param {string} key - Storage key
     * @returns {boolean} Success status
     */
    removeItem(key) {
        try {
            // Check if localStorage is available
            if (typeof localStorage === 'undefined') {
                console.warn('Local storage is not available');
                return false;
            }

            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Error removing item with key "${key}":`, error);
            return false;
        }
    },

    /**
     * Check if key exists in storage
     * @param {string} key - Storage key
     * @returns {boolean} True if key exists
     */
    hasItem(key) {
        try {
            // Check if localStorage is available
            if (typeof localStorage === 'undefined') {
                return false;
            }

            return localStorage.getItem(key) !== null;
        } catch (error) {
            console.error(`Error checking existence of key "${key}":`, error);
            return false;
        }
    }
};
