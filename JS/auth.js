// ============================================================
// auth.js - دوال المصادقة
// ============================================================

import { 
    auth, 
    db 
} from './firebase-init.js';

import {
    signInWithPhoneNumber,
    RecaptchaVerifier,
    sendSignInLinkToEmail,
    isSignInWithEmailLink,
    signInWithEmailLink,
    onAuthStateChanged,
    signOut,
    createUserWithEmailAndPassword,
    updateProfile
} from "firebase/auth";

import {
    doc,
    setDoc,
    getDoc,
    serverTimestamp
} from "firebase/firestore";

// ============================================================
// متغيرات عامة
// ============================================================
let confirmationResult = null;
let recaptchaVerifier = null;

// ============================================================
// 1. إعداد Recaptcha
// ============================================================
export function setupRecaptcha(buttonId) {
    if (!recaptchaVerifier) {
        recaptchaVerifier = new RecaptchaVerifier(buttonId, {
            size: 'invisible',
            callback: () => {}
        }, auth);
    }
    return recaptchaVerifier;
}

// ============================================================
// 2. إرسال OTP (رمز التحقق عبر SMS)
// ============================================================
export async function sendOTP(phoneNumber) {
    try {
        setupRecaptcha('sendOTPBtn');
        const result = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
        confirmationResult = result;
        return { success: true, message: 'تم إرسال الكود' };
    } catch (error) {
        console.error('❌ OTP Error:', error);
        let message = 'حدث خطأ، حاول مرة أخرى';
        if (error.code === 'auth/invalid-phone-number') {
            message = 'رقم غير صحيح، تأكد من كتابته بشكل صحيح';
        } else if (error.code === 'auth/too-many-requests') {
            message = 'تم إرسال طلبات كثيرة، انتظر قليلاً';
        }
        return { success: false, message };
    }
}

// ============================================================
// 3. تأكيد OTP
// ============================================================
export async function verifyOTP(code) {
    try {
        const result = await confirmationResult.confirm(code);
        return { success: true, user: result.user };
    } catch (error) {
        console.error('❌ Verify Error:', error);
        let message = 'الكود غير صحيح، حاول مرة أخرى';
        if (error.code === 'auth/invalid-verification-code') {
            message = 'الكود غير صحيح، حاول مرة أخرى';
        }
        return { success: false, message };
    }
}

// ============================================================
// 4. إرسال رابط الإيميل (للدخول المجاني)
// ============================================================
export async function sendEmailLink(email) {
    try {
        const actionCodeSettings = {
            url: window.location.href,
            handleCodeInApp: true
        };
        await sendSignInLinkToEmail(auth, email, actionCodeSettings);
        localStorage.setItem('emailForSignIn', email);
        return { success: true, message: 'تم إرسال رابط التحقق إلى بريدك الإلكتروني' };
    } catch (error) {
        console.error('❌ Email Link Error:', error);
        return { success: false, message: 'فشل إرسال رابط التحقق' };
    }
}

// ============================================================
// 5. تسجيل الدخول عبر رابط الإيميل
// ============================================================
export async function signInWithEmail() {
    if (isSignInWithEmailLink(auth, window.location.href)) {
        let email = localStorage.getItem('emailForSignIn');
        if (!email) {
            email = window.prompt('أدخل بريدك الإلكتروني للتحقق');
        }
        try {
            await signInWithEmailLink(auth, email, window.location.href);
            localStorage.removeItem('emailForSignIn');
            return { success: true };
        } catch (error) {
            console.error('❌ Email SignIn Error:', error);
            return { success: false, message: 'فشل تسجيل الدخول' };
        }
    }
    return { success: false, message: 'لا يوجد رابط' };
}

// ============================================================
// 6. حفظ بيانات المستخدم في Firestore
// ============================================================
export async function saveUserData(user, data) {
    try {
        await setDoc(doc(db, 'users', user.uid), {
            phone: data.phone,
            email: data.email,
            displayName: data.displayName || 'مستخدم',
            photoURL: data.photoURL || 'assets/images/default-avatar.png',
            isVerified: data.isVerified || false,
            isAdmin: data.isAdmin || false,
            isBanned: false,
            trustScore: 100,
            status: 'offline',
            createdAt: serverTimestamp(),
            lastSeen: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('❌ Save User Error:', error);
        return { success: false, message: 'فشل حفظ بيانات المستخدم' };
    }
}

// ============================================================
// 7. جلب بيانات المستخدم
// ============================================================
export async function getUserData(uid) {
    try {
        const docSnap = await getDoc(doc(db, 'users', uid));
        if (docSnap.exists()) {
            return { success: true, data: docSnap.data() };
        }
        return { success: false, message: 'المستخدم غير موجود' };
    } catch (error) {
        console.error('❌ Get User Error:', error);
        return { success: false, message: 'فشل جلب بيانات المستخدم' };
    }
}

// ============================================================
// 8. تحديث بيانات المستخدم
// ============================================================
export async function updateUserData(uid, data) {
    try {
        await setDoc(doc(db, 'users', uid), data, { merge: true });
        return { success: true };
    } catch (error) {
        console.error('❌ Update User Error:', error);
        return { success: false, message: 'فشل تحديث البيانات' };
    }
}

// ============================================================
// 9. تسجيل الخروج
// ============================================================
export async function logout() {
    try {
        await signOut(auth);
        return { success: true };
    } catch (error) {
        console.error('❌ Logout Error:', error);
        return { success: false, message: 'فشل تسجيل الخروج' };
    }
}

// ============================================================
// 10. مراقبة حالة المستخدم
// ============================================================
export function onAuthState(callback) {
    return onAuthStateChanged(auth, callback);
}

// ============================================================
// 11. تسجيل مستخدم جديد (بالإيميل وكلمة المرور)
// ============================================================
export async function registerUser(email, password, displayName, phone) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        await updateProfile(user, {
            displayName: displayName,
            photoURL: 'assets/images/default-avatar.png'
        });
        
        await saveUserData(user, {
            phone: phone,
            email: email,
            displayName: displayName
        });
        
        return { success: true, user };
    } catch (error) {
        console.error('❌ Register Error:', error);
        let message = 'فشل تسجيل المستخدم';
        if (error.code === 'auth/email-already-in-use') {
            message = 'البريد الإلكتروني مستخدم بالفعل';
        } else if (error.code === 'auth/weak-password') {
            message = 'كلمة المرور ضعيفة (يجب أن تكون 6 أحرف على الأقل)';
        }
        return { success: false, message };
    }
            }
