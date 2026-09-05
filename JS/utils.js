// Utility functions for the Morb Chat application

/**
 * Validates an email address
 * @param {string} email - The email to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Safely stores data in localStorage
 * @param {string} key - The key to store
 * @param {any} value - The value to store
 */
function setLocalStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error('Error storing data:', error);
    }
}

/**
 * Safely retrieves data from localStorage
 * @param {string} key - The key to retrieve
 * @returns {any} - The stored value or null
 */
function getLocalStorage(key) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (error) {
        console.error('Error retrieving data:', error);
        return null;
    }
}

/**
 * Formats a timestamp to a readable date string
 * @param {number} timestamp - The Unix timestamp
 * @returns {string} - Formatted date string
 */
function formatDate(timestamp) {
    const date = new Date(timestamp);
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('en-US', options);
}

/**
 * Generates a unique ID
 * @returns {string} - A unique identifier
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0,
            v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Debounces a function
 * @param {Function} func - The function to debounce
 * @param {number} wait - The debounce delay in milliseconds
 * @returns {Function} - The debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Escapes HTML special characters
 * @param {string} text - The text to escape
 * @returns {string} - Escaped text
 */
function escapeHTML(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        validateEmail,
        setLocalStorage,
        getLocalStorage,
        formatDate,
        generateUUID,
        debounce,
        escapeHTML
    };
}