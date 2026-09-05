// Chat module for Morb Chat

class ChatManager {
    constructor() {
        this.messages = [];
        this.currentUser = null;
        this.chatContainer = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.init();
    }

    /**
     * Initialize chat
     */
    init() {
        this.currentUser = auth.getCurrentUser();
        if (!this.currentUser) {
            window.location.href = 'index.html';
            return;
        }

        this.loadMessages();
        this.setupEventListeners();
        this.updateUserProfile();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
    }

    /**
     * Send a message
     */
    async sendMessage() {
        const text = this.messageInput.value.trim();
        if (!text) return;

        const message = {
            id: generateUUID(),
            userId: this.currentUser.id,
            username: this.currentUser.username,
            text: escapeHTML(text),
            timestamp: new Date().toISOString(),
            type: 'sent'
        };

        this.messages.push(message);
        this.messageInput.value = '';
        this.renderMessages();
        this.scrollToBottom();

        // Save to localStorage (in real app, this would be sent to backend)
        setLocalStorage('chatMessages', this.messages);
    }

    /**
     * Load messages from storage
     */
    loadMessages() {
        const saved = getLocalStorage('chatMessages');
        this.messages = saved || [];
        this.renderMessages();
    }

    /**
     * Render messages in the chat area
     */
    renderMessages() {
        this.chatContainer.innerHTML = '';
        this.messages.forEach(msg => {
            const messageEl = document.createElement('div');
            messageEl.className = `chat-message ${msg.type}`;
            messageEl.innerHTML = `
                <p><strong>${escapeHTML(msg.username)}</strong></p>
                <p>${msg.text}</p>
                <small>${formatDate(new Date(msg.timestamp).getTime())}</small>
            `;
            this.chatContainer.appendChild(messageEl);
        });
        this.scrollToBottom();
    }

    /**
     * Scroll to bottom of chat
     */
    scrollToBottom() {
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }

    /**
     * Update user profile display
     */
    updateUserProfile() {
        const userNameEl = document.getElementById('userName');
        const userAvatarEl = document.getElementById('userAvatar');
        
        if (userNameEl) userNameEl.textContent = this.currentUser.username;
        if (userAvatarEl) userAvatarEl.src = this.currentUser.avatar;
    }

    /**
     * Logout
     */
    logout() {
        auth.logout();
        window.location.href = 'index.html';
    }
}

// Initialize chat when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const chatManager = new ChatManager();
    });
} else {
    const chatManager = new ChatManager();
}