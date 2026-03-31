const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');

const router = express.Router();

// Helper function để get Firestore collection
const getUsersCollection = () => {
  if (!db.firestore) {
    console.error('❌ Firestore not initialized');
    return null;
  }
  return db.firestore.collection('users');
};

router.get('/login', (req, res) => {
  res.render('login', { bodyClass: 'auth-page' });
});

router.get('/register', (req, res) => {
  res.render('register', { bodyClass: 'auth-page' });
});

router.post('/register', async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;
  if (!username || !email || !password || !confirmPassword) {
    req.flash('error', 'Vui lòng điền đầy đủ thông tin.');
    return res.redirect('/auth/register');
  }
  if (password !== confirmPassword) {
    req.flash('error', 'Mật khẩu xác nhận không khớp.');
    return res.redirect('/auth/register');
  }

  const usersCollection = getUsersCollection();
  if (!usersCollection) {
    req.flash('error', 'Chưa cấu hình Firebase. Vui lòng kiểm tra lại dịch vụ.');
    return res.redirect('/auth/register');
  }

  try {
    // Kiểm tra tồn tại theo username hoặc email trong Firestore
    const usernameQuery = await usersCollection.where('username', '==', username).get();
    const emailQuery = await usersCollection.where('email', '==', email).get();

    if (!usernameQuery.empty || !emailQuery.empty) {
      req.flash('error', 'Tên đăng nhập hoặc email đã được sử dụng.');
      return res.redirect('/auth/register');
    }

    // ✅ BƯỚC 1: Tạo user trong Firebase Authentication
    const userRecord = await db.admin.auth().createUser({
      email: email,
      password: password,
      displayName: username,
    });

    // ✅ BƯỚC 2: Hash password để lưu trữ (cho verification)
    const hashed = await bcrypt.hash(password, 10);

    // ✅ BƯỚC 3: Lưu profile vào Firestore
    await usersCollection.doc(userRecord.uid).set({
      uid: userRecord.uid,
      username,
      email,
      displayName: username,
      role: 'user',
      password_hash: hashed, // Dùng để verify khi login
      wallet_balance: 0, // Khởi tạo ví lúc tạo tài khoản
      created_at: new Date(),
    });

    req.flash('success', 'Đăng ký thành công! Vui lòng đăng nhập.');
    res.redirect('/auth/login');
  } catch (err) {
    console.error('❌ Register error:', err.message);
    
    // Xử lý lỗi Firebase Auth
    if (err.code === 'auth/email-already-exists') {
      req.flash('error', 'Email đã được đăng ký.');
    } else if (err.code === 'auth/invalid-email') {
      req.flash('error', 'Email không hợp lệ.');
    } else if (err.code === 'auth/weak-password') {
      req.flash('error', 'Mật khẩu phải có ít nhất 6 ký tự.');
    } else {
      req.flash('error', 'Đăng ký thất bại. Vui lòng thử lại sau.');
    }
    return res.redirect('/auth/register');
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    req.flash('error', 'Vui lòng điền đầy đủ thông tin.');
    return res.redirect('/auth/login');
  }

  const usersCollection = getUsersCollection();
  if (!usersCollection) {
    req.flash('error', 'Chưa cấu hình Firebase. Vui lòng kiểm tra lại dịch vụ.');
    return res.redirect('/auth/login');
  }

  try {
    // Tìm user trong Firestore theo username
    const userQuery = await usersCollection.where('username', '==', username).limit(1).get();
    if (userQuery.empty) {
      req.flash('error', 'Tên đăng nhập hoặc mật khẩu không đúng.');
      return res.redirect('/auth/login');
    }

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();

    // ✅ Xác thực password thông qua Firebase Authentication
    try {
      await db.admin.auth().getUser(userData.uid);
      // Nếu user tồn tại trong Auth, signin được cấp phép
      // (Lưu ý: Backend không thể verify password trực tiếp)
      // Nên ta vẫn dùng hash để verify
      
      // Kiểm tra password hash nếu còn tồn tại (cho backward compatibility)
      if (userData.password_hash) {
        const match = await bcrypt.compare(password, userData.password_hash);
        if (!match) {
          req.flash('error', 'Tên đăng nhập hoặc mật khẩu không đúng.');
          return res.redirect('/auth/login');
        }
      }
    } catch (authErr) {
      req.flash('error', 'User không tồn tại trong hệ thống xác thực.');
      return res.redirect('/auth/login');
    }

    // ✅ Đăng nhập thành công
    req.session.user = {
      uid: userData.uid,
      username: userData.username,
      email: userData.email,
      displayName: userData.displayName,
      role: userData.role || 'user',
      wallet_balance: userData.wallet_balance || 0, // Tải số dư ví từ Firestore
    };

    req.flash('success', 'Đăng nhập thành công!');
    if (req.session.user.role === 'admin') {
      return res.redirect('/admin');
    }
    res.redirect('/');
  } catch (err) {
    console.error('❌ Login error:', err.message);
    req.flash('error', 'Đăng nhập thất bại. Vui lòng thử lại sau.');
    return res.redirect('/auth/login');
  }
});

router.get('/create-admin', async (req, res) => {
  const username = 'admin';
  const email = 'admin@example.com';
  const password = 'Admin@123';

  const usersCollection = getUsersCollection();
  if (!usersCollection) {
    req.flash('error', 'Chưa cấu hình Firebase. Vui lòng kiểm tra lại.');
    return res.redirect('/auth/login');
  }

  const existing = await usersCollection.where('username', '==', username).limit(1).get();
  if (!existing.empty) {
    req.flash('info', 'Tài khoản admin đã tồn tại. Vui lòng đăng nhập.');
    return res.redirect('/auth/login');
  }

  try {
    const userRecord = await db.admin.auth().createUser({
      email: email,
      password: password,
      displayName: username,
    });

    const hashed = await bcrypt.hash(password, 10);
    await usersCollection.doc(userRecord.uid).set({
      uid: userRecord.uid,
      username,
      email,
      displayName: username,
      role: 'admin',
      password_hash: hashed,
      wallet_balance: 0,
      created_at: new Date(),
    });

    req.flash('success', 'Admin đã được tạo. Username admin / password Admin@123');
    return res.redirect('/auth/login');
  } catch (err) {
    console.error('Lỗi tạo admin:', err);
    req.flash('error', 'Tạo admin thất bại. Vui lòng kiểm tra logs.');
    return res.redirect('/auth/login');
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

module.exports = router;
