// ============================================================
// firebase-init.js - تهيئة Firebase
// ============================================================

import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// ============================================================
// إعدادات Firebase (مشروعك)
// ============================================================
const firebaseConfig = {
    apiKey: "AIzaSyCsL5cDqM4G7htK1k2qS7zC2YYGRJK6UbQ",
    authDomain: "morb-1cf55.firebaseapp.com",
    projectId: "morb-1cf55",
    storageBucket: "morb-1cf55.firebasestorage.app",
    messagingSenderId: "462602603099",
    appId: "1:462602603099:web:f377fcd79b88a2a7b84d7e",
    measurementId: "G-W4RG2RG9J6"
};

// ============================================================
// تهيئة Firebase
// ============================================================
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// ============================================================
// تفعيل حفظ الجلسة (المستخدم يفضل مسجل طول الوقت)
// ============================================================
setPersistence(auth, browserLocalPersistence)
    .then(() => {
        console.log('✅ تم تفعيل حفظ الجلسة');
    })
    .catch((error) => {
        console.error('❌ فشل تفعيل حفظ الجلسة:', error);
    });

// ============================================================
// تصدير
// ============================================================
export { app, auth, db, storage };
