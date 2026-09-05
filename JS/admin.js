// Admin module for Morb Chat

class AdminPanel {
    constructor() {
        this.users = [];
        this.usersTable = document.getElementById('usersBody');
        this.init();
    }

    /**
     * Initialize admin panel
     */
    init() {
        this.checkAdminAccess();
        this.loadUsers();
    }

    /**
     * Check if current user is admin
     */
    checkAdminAccess() {
        const currentUser = auth.getCurrentUser();
        if (!currentUser) {
            window.location.href = 'index.html';
        }
    }

    /**
     * Load users data
     */
    loadUsers() {
        // In a real app, this would fetch from backend
        const savedUsers = getLocalStorage('allUsers') || [
            {
                id: generateUUID(),
                username: 'admin',
                email: 'admin@morbchat.com',
                status: 'active',
                createdAt: new Date().toISOString()
            },
            {
                id: generateUUID(),
                username: 'user1',
                email: 'user1@morbchat.com',
                status: 'active',
                createdAt: new Date().toISOString()
            }
        ];

        this.users = savedUsers;
        this.renderUsersTable();
    }

    /**
     * Render users table
     */
    renderUsersTable() {
        this.usersTable.innerHTML = '';
        
        this.users.forEach(user => {
            const row = document.createElement('tr');
            const statusClass = user.status === 'active' ? 'active' : 'inactive';
            
            row.innerHTML = `
                <td>${escapeHTML(user.username)}</td>
                <td>${escapeHTML(user.email)}</td>
                <td><span class="status-badge ${statusClass}">${user.status}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action edit" onclick="adminPanel.editUser('${user.id}')">Edit</button>
                        <button class="btn-action delete" onclick="adminPanel.deleteUser('${user.id}')">Delete</button>
                    </div>
                </td>
            `;
            
            this.usersTable.appendChild(row);
        });
    }

    /**
     * Edit user
     * @param {string} userId - User ID
     */
    editUser(userId) {
        alert('Edit functionality coming soon');
    }

    /**
     * Delete user
     * @param {string} userId - User ID
     */
    deleteUser(userId) {
        if (confirm('Are you sure you want to delete this user?')) {
            this.users = this.users.filter(u => u.id !== userId);
            setLocalStorage('allUsers', this.users);
            this.renderUsersTable();
        }
    }
}

// Initialize admin panel when DOM is ready
let adminPanel;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        adminPanel = new AdminPanel();
    });
} else {
    adminPanel = new AdminPanel();
}