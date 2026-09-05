// Background script for Morb Chat

// This script handles background tasks and events

class BackgroundService {
    constructor() {
        this.init();
    }

    /**
     * Initialize background service
     */
    init() {
        this.setupMessageListener();
        this.setupPeriodicTasks();
    }

    /**
     * Setup message listener for cross-tab communication
     */
    setupMessageListener() {
        window.addEventListener('message', (event) => {
            if (event.source !== window) return;
            
            if (event.data.type && event.data.type === 'CHAT_MESSAGE') {
                this.handleIncomingMessage(event.data);
            }
        });
    }

    /**
     * Handle incoming messages
     * @param {Object} data - Message data
     */
    handleIncomingMessage(data) {
        console.log('Background: Received message', data);
        // Handle message logic here
    }

    /**
     * Setup periodic tasks
     */
    setupPeriodicTasks() {
        // Sync messages every 30 seconds
        setInterval(() => {
            this.syncMessages();
        }, 30000);
    }

    /**
     * Sync messages
     */
    syncMessages() {
        const messages = getLocalStorage('chatMessages');
        if (messages && messages.length > 0) {
            // In a real app, this would sync with backend
            console.log('Syncing messages...', messages.length);
        }
    }
}

// Initialize background service
const backgroundService = new BackgroundService();