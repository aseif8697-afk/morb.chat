// ============================================================
// admin.js - دوال لوحة التحكم
// ============================================================

import { db } from './firebase-init.js';
import { formatFullDate } from './utils.js';

import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    onSnapshot,
    updateDoc,
    deleteDoc,
    addDoc,
    serverTimestamp,
    writeBatch
} from "firebase/firestore";

// ============================================================
// 1. تحميل إحصائيات التطبيق
// ============================================================
export async function loadStats() {
    try {
        const users = await getDocs(collection(db, 'users'));
        const banned = await getDocs(query(collection(db, 'users'), where('isBanned', '==', true)));
        const verified = await getDocs(query(collection(db, 'users'), where('isVerified', '==', true)));
        const online = await getDocs(query(collection(db, 'users'), where('status', '==', 'online')));
        const groups = await getDocs(query(collection(db, 'chats'), where('type', '==', 'group')));
        const reports = await getDocs(collection(db, 'reports'));
        const pendingReports = reports.docs.filter(d => d.data().status === 'pending');
        
        // حساب عدد الرسائل
        let totalMessages = 0;
        const chats = await getDocs(collection(db, 'chats'));
        for (const chat of chats.docs) {
            const msgs = await getDocs(collection(db, 'chats', chat.id, 'messages'));
            totalMessages += msgs.size;
        }
        
        return {
            success: true,
            data: {
                users: users.size,
                banned: banned.size,
                verified: verified.size,
                online: online.size,
                groups: groups.size,
                messages: totalMessages,
                reports: reports.size,
                pendingReports: pendingReports.length
            }
        };
    } catch (error) {
        console.error('❌ Load Stats Error:', error);
        return { success: false, message: 'فشل تحميل الإحصائيات' };
    }
}

// ============================================================
// 2. تحميل جميع المستخدمين
// ============================================================
export async function loadUsers() {
    try {
        const snapshot = await getDocs(collection(db, 'users'));
        const users = [];
        snapshot.forEach(doc => {
            users.push({ uid: doc.id, ...doc.data() });
        });
        return { success: true, users };
    } catch (error) {
        console.error('❌ Load Users Error:', error);
        return { success: false, message: 'فشل تحميل المستخدمين' };
    }
}

// ============================================================
// 3. البحث عن مستخدم
// ============================================================
export async function searchUsers(searchTerm) {
    try {
        const q = query(
            collection(db, 'users'),
            where('phone', '>=', searchTerm),
            where('phone', '<=', searchTerm + '\uf8ff')
        );
        const snapshot = await getDocs(q);
        const users = [];
        snapshot.forEach(doc => {
            users.push({ uid: doc.id, ...doc.data() });
        });
        return { success: true, users };
    } catch (error) {
        console.error('❌ Search Users Error:', error);
        return { success: false, message: 'فشل البحث' };
    }
}

// ============================================================
// 4. توثيق/إلغاء توثيق مستخدم
// ============================================================
export async function toggleVerify(uid) {
    try {
        const userRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userRef);
        const currentStatus = userDoc.data()?.isVerified || false;
        
        await updateDoc(userRef, {
            isVerified: !currentStatus
        });
        
        return { success: true, newStatus: !currentStatus };
    } catch (error) {
        console.error('❌ Toggle Verify Error:', error);
        return { success: false, message: 'فشل تغيير حالة التوثيق' };
    }
}

// ============================================================
// 5. حظر/فك حظر مستخدم
// ============================================================
export async function toggleBan(uid, reason = '') {
    try {
        const userRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userRef);
        const currentStatus = userDoc.data()?.isBanned || false;
        
        if (!currentStatus) {
            // حظر
            await updateDoc(userRef, {
                isBanned: true,
                bannedAt: serverTimestamp(),
                banReason: reason || 'انتهاك القواعد',
                bannedBy: 'admin'
            });
        } else {
            // فك حظر
            await updateDoc(userRef, {
                isBanned: false,
                bannedAt: null,
                banReason: '',
                bannedBy: null
            });
        }
        
        return { success: true, newStatus: !currentStatus };
    } catch (error) {
        console.error('❌ Toggle Ban Error:', error);
        return { success: false, message: 'فشل تغيير حالة الحظر' };
    }
}

// ============================================================
// 6. حذف مستخدم
// ============================================================
export async function deleteUser(uid) {
    try {
        await deleteDoc(doc(db, 'users', uid));
        return { success: true };
    } catch (error) {
        console.error('❌ Delete User Error:', error);
        return { success: false, message: 'فشل حذف المستخدم' };
    }
}

// ============================================================
// 7. تحميل التقارير
// ============================================================
export async function loadReports(filter = 'all') {
    try {
        let q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
        if (filter !== 'all') {
            q = query(collection(db, 'reports'), where('status', '==', filter), orderBy('createdAt', 'desc'));
        }
        const snapshot = await getDocs(q);
        const reports = [];
        snapshot.forEach(doc => {
            reports.push({ id: doc.id, ...doc.data() });
        });
        return { success: true, reports };
    } catch (error) {
        console.error('❌ Load Reports Error:', error);
        return { success: false, message: 'فشل تحميل التقارير' };
    }
}

// ============================================================
// 8. مراجعة تقرير (قبول أو رفض)
// ============================================================
export async function reviewReport(reportId, action, adminUid) {
    try {
        const reportRef = doc(db, 'reports', reportId);
        const reportDoc = await getDoc(reportRef);
        const reportData = reportDoc.data();
        
        await updateDoc(reportRef, {
            status: action === 'approve' ? 'approved' : 'rejected',
            reviewedAt: serverTimestamp(),
            reviewedBy: adminUid
        });
        
        if (action === 'approve' && reportData.targetUid) {
            // حظر المستخدم المبلغ عنه
            await toggleBan(reportData.targetUid, reportData.type || 'انتهاك القواعد');
        }
        
        return { success: true };
    } catch (error) {
        console.error('❌ Review Report Error:', error);
        return { success: false, message: 'فشل مراجعة التقرير' };
    }
}

// ============================================================
// 9. تحميل الجروبات
// ============================================================
export async function loadGroups() {
    try {
        const q = query(collection(db, 'chats'), where('type', '==', 'group'));
        const snapshot = await getDocs(q);
        const groups = [];
        for (const doc of snapshot.docs) {
            const data = doc.data();
            let adminName = 'غير معروف';
            if (data.admin) {
                const userDoc = await getDoc(doc(db, 'users', data.admin));
                if (userDoc.exists()) adminName = userDoc.data().displayName || 'مستخدم';
            }
            groups.push({
                id: doc.id,
                name: data.name || 'جروب بدون اسم',
                members: data.participants?.length || 0,
                admin: adminName
            });
        }
        return { success: true, groups };
    } catch (error) {
        console.error('❌ Load Groups Error:', error);
        return { success: false, message: 'فشل تحميل الجروبات' };
    }
}

// ============================================================
// 10. حذف جروب
// ============================================================
export async function deleteGroup(groupId) {
    try {
        await deleteDoc(doc(db, 'chats', groupId));
        return { success: true };
    } catch (error) {
        console.error('❌ Delete Group Error:', error);
        return { success: false, message: 'فشل حذف الجروب' };
    }
}

// ============================================================
// 11. تحميل أحدث الرسائل
// ============================================================
export async function loadRecentMessages(limit = 50) {
    try {
        const chats = await getDocs(collection(db, 'chats'));
        let allMessages = [];
        
        for (const chat of chats.docs) {
            const msgs = await getDocs(
                query(collection(db, 'chats', chat.id, 'messages'), orderBy('timestamp', 'desc'), limit(10))
            );
            msgs.forEach(doc => {
                allMessages.push({
                    id: doc.id,
                    chatId: chat.id,
                    ...doc.data()
                });
            });
        }
        
        allMessages.sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds);
        return { success: true, messages: allMessages.slice(0, limit) };
    } catch (error) {
        console.error('❌ Load Messages Error:', error);
        return { success: false, message: 'فشل تحميل الرسائل' };
    }
}

// ============================================================
// 12. إضافة سجل
// ============================================================
export async function addLog(message, type = 'other') {
    try {
        await addDoc(collection(db, 'logs'), {
            message: message,
            type: type,
            createdAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('❌ Add Log Error:', error);
        return { success: false };
    }
}

// ============================================================
// 13. تحميل السجل
// ============================================================
export async function loadLogs(filter = 'all', limit = 100) {
    try {
        let q = query(collection(db, 'logs'), orderBy('createdAt', 'desc'), limit);
        if (filter !== 'all') {
            q = query(collection(db, 'logs'), where('type', '==', filter), orderBy('createdAt', 'desc'), limit);
        }
        const snapshot = await getDocs(q);
        const logs = [];
        snapshot.forEach(doc => {
            logs.push({ id: doc.id, ...doc.data() });
        });
        return { success: true, logs };
    } catch (error) {
        console.error('❌ Load Logs Error:', error);
        return { success: false, message: 'فشل تحميل السجل' };
    }
}

// ============================================================
// 14. مسح السجل
// ============================================================
export async function clearLogs() {
    try {
        const snapshot = await getDocs(collection(db, 'logs'));
        const batch = writeBatch(db);
        snapshot.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        return { success: true };
    } catch (error) {
        console.error('❌ Clear Logs Error:', error);
        return { success: false, message: 'فشل مسح السجل' };
    }
}

// ============================================================
// 15. حفظ الإعدادات العامة
// ============================================================
export async function saveSettings(settings) {
    try {
        await setDoc(doc(db, 'settings', 'general'), settings);
        return { success: true };
    } catch (error) {
        console.error('❌ Save Settings Error:', error);
        return { success: false, message: 'فشل حفظ الإعدادات' };
    }
}

// ============================================================
// 16. تحميل الإعدادات العامة
// ============================================================
export async function loadSettings() {
    try {
        const docSnap = await getDoc(doc(db, 'settings', 'general'));
        if (docSnap.exists()) {
            return { success: true, settings: docSnap.data() };
        }
        return { success: true, settings: null };
    } catch (error) {
        console.error('❌ Load Settings Error:', error);
        return { success: false, message: 'فشل تحميل الإعدادات' };
    }
                                                                          }
