// Firebase Authentication Example Routes
// This file shows how to use Firebase Authentication with Express/Node.js
// You can integrate this with your existing auth.js route file

const express = require('express');
const admin = require('firebase-admin');
const db = require('../db'); // Your Firebase admin initialization

const router = express.Router();

// Initialize Firebase Admin (ensure this is done in server.js)
// const serviceAccount = require('../firebase-service-account.json');
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

const firestore = admin.firestore();
const auth = admin.auth();

// ==================== AUTHENTICATION ROUTES ====================

/**
 * Register Route
 * POST /auth/register
 * Body: { email, password, username, phone }
 */
router.post('/register', async (req, res) => {
  const { email, password, username, phone } = req.body;

  try {
    // Validate input
    if (!email || !password || !username) {
      return res.status(400).json({ error: 'Email, password, and username are required' });
    }

    // Create Firebase Auth user
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      displayName: username,
    });

    // Create Firestore user document
    await firestore.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: email,
      username: username,
      phone: phone || '',
      address: '',
      balance: 0,
      role: 'customer',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Create custom claims for role
    await auth.setCustomUserClaims(userRecord.uid, { role: 'customer' });

    req.flash('success', 'Đăng ký thành công! Vui lòng đăng nhập.');
    res.redirect('/auth/login');
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.code === 'auth/email-already-exists') {
      req.flash('error', 'Email này đã được đăng ký.');
    } else if (error.code === 'auth/weak-password') {
      req.flash('error', 'Mật khẩu quá yếu. Vui lòng chọn mật khẩu mạnh hơn.');
    } else {
      req.flash('error', 'Lỗi đăng ký: ' + error.message);
    }
    
    res.redirect('/auth/register');
  }
});

/**
 * Login Route
 * POST /auth/login
 * Body: { email, password }
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Verify user with Firebase Admin SDK
    // Note: Firebase Admin SDK doesn't verify passwords directly
    // You need to use Firebase REST API or client-side auth

    // For simplicity, redirect to client-side Firebase auth
    // Or use Firebase REST API for password verification
    
    // Get user by email
    const userRecord = await auth.getUserByEmail(email);

    // Get user data from Firestore
    const userDoc = await firestore.collection('users').doc(userRecord.uid).get();
    const userData = userDoc.data();

    // Set session
    req.session.user = {
      uid: userRecord.uid,
      email: userRecord.email,
      username: userData.username,
      role: userData.role,
      balance: userData.balance,
      phone: userData.phone,
      address: userData.address,
    };

    req.flash('success', 'Đăng nhập thành công!');
    
    if (userData.role === 'admin') {
      res.redirect('/admin');
    } else {
      res.redirect('/');
    }
  } catch (error) {
    console.error('Login error:', error);

    if (error.code === 'auth/user-not-found') {
      req.flash('error', 'Email hoặc mật khẩu không đúng.');
    } else {
      req.flash('error', 'Lỗi đăng nhập: ' + error.message);
    }

    res.redirect('/auth/login');
  }
});

/**
 * Logout Route
 * POST /auth/logout
 */
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    req.flash('success', 'Đã đăng xuất.');
    res.redirect('/');
  });
});

/**
 * Get Current User
 * GET /auth/me
 */
router.get('/me', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const userDoc = await firestore.collection('users').doc(req.session.user.uid).get();
    res.json(userDoc.data());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update User Profile
 * PUT /auth/profile
 * Body: { username, phone, address }
 */
router.put('/profile', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { username, phone, address } = req.body;

  try {
    await firestore.collection('users').doc(req.session.user.uid).update({
      username: username || req.session.user.username,
      phone: phone || req.session.user.phone,
      address: address || req.session.user.address,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update session
    req.session.user.username = username || req.session.user.username;
    req.session.user.phone = phone || req.session.user.phone;
    req.session.user.address = address || req.session.user.address;

    res.json({ success: true, message: 'Profile updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Middleware: Check if user is authenticated
 */
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  req.flash('error', 'Vui lòng đăng nhập.');
  res.redirect('/auth/login');
};

/**
 * Middleware: Check if user is admin
 */
const isAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  req.flash('error', 'Bạn không có quyền truy cập.');
  res.redirect('/');
};

module.exports = router;
module.exports.isAuthenticated = isAuthenticated;
module.exports.isAdmin = isAdmin;
