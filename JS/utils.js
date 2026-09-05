// ============================================================
// utils.js - دوال مساعدة
// ============================================================

// ===== تنسيق الوقت =====
export function formatTime(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('ar-EG', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false
    });
}

// ===== تنسيق التاريخ الكامل =====
export function formatFullDate(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// ===== تنسيق حجم الملف =====
export function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    return (bytes / 1073741824).toFixed(1) + ' GB';
}

// ===== التحقق من صحة رقم الهاتف =====
export function validatePhone(phone) {
    // إزالة أي مسافات أو أحرف غير رقمية
    const cleaned = phone.replace(/[^0-9+]/g, '');
    // التأكد من أن الرقم يبدأ بـ + وبعدها أرقام
    if (!cleaned.startsWith('+')) return false;
    // التأكد من أن الطول مناسب (بين 8 و 15 رقم)
    const digits = cleaned.replace(/[^0-9]/g, '');
    return digits.length >= 8 && digits.length <= 15;
}

// ===== التحقق من صحة البريد الإلكتروني =====
export function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// ===== إنشاء معرف فريد =====
export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ===== إزالة علامات HTML =====
export function stripHtml(text) {
    const div = document.createElement('div');
    div.innerHTML = text;
    return div.textContent || div.innerText || '';
}

// ===== اختصار النص =====
export function truncateText(text, maxLength = 50) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}
