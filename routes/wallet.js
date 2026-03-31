const express = require('express');
const db = require('../db');

const router = express.Router();

console.log('✅ Wallet routes loaded and initialized');

// Middleware: Check user đã login
function isAuthenticated(req, res, next) {
  console.log(`🔐 Checking auth for ${req.path}...`, req.session.user ? 'Authorized' : 'Not logged in');
  if (req.session.user) {
    return next();
  }
  req.flash('error', 'Vui lòng đăng nhập.');
  res.redirect('/auth/login');
}

// GET: Trang nạp tiền
router.get('/deposit', isAuthenticated, (req, res) => {
  res.render('wallet/deposit', { user: req.session.user });
});

// POST: Nạp tiền
router.post('/deposit', isAuthenticated, async (req, res) => {
  const { amount, paymentMethod, bankAccount, bankName } = req.body;
  const userId = req.session.user.uid;

  // Validate
  if (!amount || isNaN(amount) || amount <= 0) {
    req.flash('error', 'Số tiền không hợp lệ.');
    return res.redirect('/wallet/deposit');
  }

  // Validate ngân hàng nếu chọn tài khoản ngân hàng
  if (paymentMethod === 'Tài khoản ngân hàng' && (!bankAccount || !bankName)) {
    req.flash('error', 'Vui lòng nhập tên ngân hàng và số tài khoản.');
    return res.redirect('/wallet/deposit');
  }

  const depositAmount = parseInt(amount);

  try {
    // Lấy user hiện tại từ Firestore
    const usersCollection = db.firestore.collection('users');
    const userDoc = await usersCollection.doc(userId).get();

    if (!userDoc.exists) {
      req.flash('error', 'Không tìm thấy người dùng.');
      return res.redirect('/wallet/deposit');
    }

    const userData = userDoc.data();
    const currentBalance = userData.wallet_balance || 0;
    const newBalance = currentBalance + depositAmount;

    // Cập nhật ví
    await usersCollection.doc(userId).update({
      wallet_balance: newBalance,
      updated_at: new Date(),
    });

    // Lưu giao dịch
    const transactionsCollection = db.firestore.collection('wallet_transactions');
    let description = `Nạp tiền ${paymentMethod || 'khác'}`;
    
    // Cập nhật description để bao gồm tên ngân hàng nếu có
    if (paymentMethod === 'Tài khoản ngân hàng' && bankName) {
      description = `Nạp tiền qua ${bankName}`;
    }
    
    const transactionData = {
      user_id: userId,
      username: userData.username,
      amount: depositAmount,
      type: 'deposit',
      payment_method: paymentMethod || 'Unknown',
      description: description,
      balance_before: currentBalance,
      balance_after: newBalance,
      created_at: new Date(),
      status: 'completed',
    };

    // Thêm thông tin ngân hàng nếu thanh toán bằng tài khoản ngân hàng
    if (paymentMethod === 'Tài khoản ngân hàng' && bankAccount && bankName) {
      transactionData.bank_name = bankName;
      transactionData.bank_account = bankAccount;
    }

    await transactionsCollection.add(transactionData);

    // Cập nhật session
    req.session.user.wallet_balance = newBalance;

    req.flash(
      'success',
      `Nạp tiền thành công! Số dư hiện tại: ₫${newBalance.toLocaleString('vi-VN')}`
    );
    // Quay lại trang trước hoặc /profile nếu không có referrer
    res.redirect('/profile');
  } catch (err) {
    console.error('❌ Wallet deposit error:', err.message);
    req.flash('error', 'Nạp tiền thất bại. Vui lòng thử lại.');
    res.redirect('/wallet/deposit');
  }
});

// GET: Lịch sử giao dịch (ĐÃ SỬA LỖI VĂNG)
router.get('/history', isAuthenticated, async (req, res) => {
  const userId = req.session.user.uid;

  try {
    const transactionsCollection = db.firestore.collection('wallet_transactions');
    
    // Bỏ lệnh orderBy đi để tránh bị Firestore chặn
    const snapshot = await transactionsCollection
      .where('user_id', '==', userId)
      .get();

    const transactions = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      transactions.push({
        id: doc.id,
        ...data,
        // Dịch thời gian sang dạng đọc được
        created_at: data.created_at && data.created_at.toDate ? data.created_at.toDate() : new Date()
      });
    });

    // Tự sắp xếp giao dịch mới nhất lên đầu bằng JavaScript
    transactions.sort((a, b) => b.created_at - a.created_at);

    // Cắt lấy 20 giao dịch gần nhất
    const recentTransactions = transactions.slice(0, 20);

    res.render('wallet/history', {
      user: req.session.user,
      transactions: recentTransactions,
    });
  } catch (err) {
    console.error('❌ Wallet history error:', err.message);
    req.flash('error', 'Không thể tải lịch sử giao dịch.');
    res.redirect('/profile');
  }
});

module.exports = router;