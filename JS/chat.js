// ============================================================
// chat.js - دوال الدردشة
// ============================================================

import { db, storage } from './firebase-init.js';
import { formatTime } from './utils.js';

import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    arrayUnion,
    arrayRemove,
    writeBatch
} from "firebase/firestore";

import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from "firebase/storage";

// ============================================================
// 1. إنشاء محادثة جديدة (فردية أو جروب)
// ============================================================
export async function createChat(data) {
    try {
        const chatRef = await addDoc(collection(db, 'chats'), {
            type: data.type || 'private', // 'private' | 'group'
            participants: data.participants,
            name: data.name || '',
            admin: data.admin || data.participants[0],
            createdAt: serverTimestamp(),
            lastMessage: '',
            lastMessageTime: serverTimestamp(),
            typing: {}
        });
        return { success: true, chatId: chatRef.id };
    } catch (error) {
        console.error('❌ Create Chat Error:', error);
        return { success: false, message: 'فشل إنشاء المحادثة' };
    }
}

// ============================================================
// 2. إرسال رسالة
// ============================================================
export async function sendMessage(chatId, data) {
    try {
        await addDoc(collection(db, 'chats', chatId, 'messages'), {
            type: data.type || 'text',
            text: data.text || '',
            senderId: data.senderId,
            senderName: data.senderName,
            senderVerified: data.senderVerified || false,
            fileUrl: data.fileUrl || '',
            fileName: data.fileName || '',
            fileSize: data.fileSize || 0,
            caption: data.caption || '',
            stickerUrl: data.stickerUrl || '',
            stickerName: data.stickerName || '',
            timestamp: serverTimestamp(),
            readBy: [data.senderId]
        });

        // تحديث آخر رسالة في المحادثة
        await updateDoc(doc(db, 'chats', chatId), {
            lastMessage: data.text || data.fileName || data.stickerName || 'رسالة',
            lastMessageTime: serverTimestamp()
        });

        return { success: true };
    } catch (error) {
        console.error('❌ Send Message Error:', error);
        return { success: false, message: 'فشل إرسال الرسالة' };
    }
}

// ============================================================
// 3. الاستماع للرسائل (في الوقت الفعلي)
// ============================================================
export function listenMessages(chatId, callback) {
    const q = query(
        collection(db, 'chats', chatId, 'messages'),
        orderBy('timestamp', 'asc')
    );
    return onSnapshot(q, callback);
}

// ============================================================
// 4. الاستماع للمحادثات (في الوقت الفعلي)
// ============================================================
export function listenChats(userId, callback) {
    const q = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', userId),
        orderBy('lastMessageTime', 'desc')
    );
    return onSnapshot(q, callback);
}

// ============================================================
// 5. وضع علامة قراءة على الرسائل
// ============================================================
export async function markMessagesAsRead(chatId, userId) {
    try {
        const messagesRef = collection(db, 'chats', chatId, 'messages');
        const q = query(messagesRef, where('senderId', '!=', userId));
        const snapshot = await getDocs(q);
        
        const batch = writeBatch(db);
        snapshot.forEach((doc) => {
            const data = doc.data();
            if (!data.readBy || !data.readBy.includes(userId)) {
                batch.update(doc.ref, {
                    readBy: arrayUnion(userId)
                });
            }
        });
        await batch.commit();
        return { success: true };
    } catch (error) {
        console.error('❌ Mark Read Error:', error);
        return { success: false };
    }
}

// ============================================================
// 6. حذف رسالة
// ============================================================
export async function deleteMessage(chatId, messageId) {
    try {
        await deleteDoc(doc(db, 'chats', chatId, 'messages', messageId));
        return { success: true };
    } catch (error) {
        console.error('❌ Delete Message Error:', error);
        return { success: false };
    }
}

// ============================================================
// 7. رفع ملف (صورة، فيديو، صوت، ملف)
// ============================================================
export async function uploadFile(chatId, file, userId) {
    try {
        const fileRef = ref(storage, `chats/${chatId}/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(fileRef, file);
        const fileUrl = await getDownloadURL(snapshot.ref);
        return { success: true, fileUrl: fileUrl };
    } catch (error) {
        console.error('❌ Upload File Error:', error);
        return { success: false, message: 'فشل رفع الملف' };
    }
}

// ============================================================
// 8. تحديث حالة المستخدم (يكتب...)
// ============================================================
export async function updateTypingStatus(chatId, userId, isTyping) {
    try {
        await updateDoc(doc(db, 'chats', chatId), {
            [`typing.${userId}`]: isTyping
        });
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

// ============================================================
// 9. مغادرة جروب
// ============================================================
export async function leaveGroup(chatId, userId) {
    try {
        await updateDoc(doc(db, 'chats', chatId), {
            participants: arrayRemove(userId)
        });
        return { success: true };
    } catch (error) {
        console.error('❌ Leave Group Error:', error);
        return { success: false };
    }
}

// ============================================================
// 10. حذف محادثة
// ============================================================
export async function deleteChat(chatId) {
    try {
        await deleteDoc(doc(db, 'chats', chatId));
        return { success: true };
    } catch (error) {
        console.error('❌ Delete Chat Error:', error);
        return { success: false };
    }
        }
