// Authentication module for Morb Chat

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.init();
    }

    /**
     * Initialize authentication
     */
    init() {
        const savedUser = getLocalStorage('currentUser');
        if (savedUser) {
            this.currentUser = savedUser;
            this.isAuthenticated = true;
        }
    }

    /**
     * Register a new user
     * @param {string} username - Username
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<Object>} - User object or error
     */
    async register(username, email, password) {
        if (!username || !email || !password) {
            return { success: false, error: 'All fields are required' };
        }

        if (!validateEmail(email)) {
            return { success: false, error: 'Invalid email format' };
        }

        if (password.length < 6) {
            return { success: false, error: 'Password must be at least 6 characters' };
        }

        try {
            const user = {
                id: generateUUID(),
                username,
                email,
                createdAt: new Date().toISOString(),
                avatar: 'assests/images/default-avatar.png'
            };

            // In a real app, this would be sent to a backend
            setLocalStorage('currentUser', user);
            this.currentUser = user;
            this.isAuthenticated = true;

            return { success: true, user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Login user
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<Object>} - User object or error
     */
    async login(email, password) {
        if (!email || !password) {
            return { success: false, error: 'Email and password are required' };
        }

        try {
            // In a real app, this would validate against a backend
            const user = {
                id: generateUUID(),
                username: email.split('@')[0],
                email,
                avatar: 'assests/images/default-avatar.png'
            };

            setLocalStorage('currentUser', user);
            this.currentUser = user;
            this.isAuthenticated = true;

            return { success: true, user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Logout current user
     */
    logout() {
        localStorage.removeItem('currentUser');
        this.currentUser = null;
        this.isAuthenticated = false;
    }

    /**
     * Get current user
     * @returns {Object|null} - Current user or null
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Check if user is authenticated
     * @returns {boolean} - Authentication status
     */
    isLoggedIn() {
        return this.isAuthenticated;
    }
}

const auth = new AuthManager();