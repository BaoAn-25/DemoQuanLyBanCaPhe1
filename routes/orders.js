const express = require('express');
const db = require('../db');

const router = express.Router();

// Kiểm tra đã đăng nhập chưa
function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  }
  req.flash('error', 'Vui lòng đăng nhập.');
  res.redirect('/auth/login');
}

// GET: Trang checkout
router.get('/checkout', isAuthenticated, async (req, res) => {
  const cart = req.session.cart || [];

  if (cart.length === 0) {
    req.flash('error', 'Giỏ hàng trống. Vui lòng thêm sản phẩm.');
    return res.redirect('/products');
  }

  try {
    const items = [];

    for (const line of cart) {
      const productDoc = await db.firestore.collection('products').doc(String(line.productId)).get();
      if (productDoc.exists) {
        const product = productDoc.data();
        items.push({
          id: productDoc.id,
          ...product,
          quantity: line.quantity,
          subTotal: product.price * line.quantity,
        });
      }
    }

    const total = items.reduce((sum, item) => sum + item.subTotal, 0);

    res.render('checkout', {
      items,
      total,
      user: req.session.user,
    });
  } catch (err) {
    console.error('❌ Checkout error:', err.message);
    req.flash('error', 'Không thể tải giỏ hàng.');
    res.redirect('/products/cart');
  }
});

// POST: Xử lý thanh toán đơn hàng
router.post('/checkout', isAuthenticated, async (req, res) => {
  const cart = req.session.cart || [];

  if (cart.length === 0) {
    req.flash('error', 'Giỏ hàng trống.');
    return res.redirect('/products');
  }

  const userId = req.session.user.uid;

  try {
    const items = [];

    for (const line of cart) {
      const productDoc = await db.firestore.collection('products').doc(String(line.productId)).get();
      if (productDoc.exists) {
        const product = productDoc.data();
        items.push({
          productId: productDoc.id,
          name: product.name,
          price: product.price,
          image_url: product.image_url,
          quantity: line.quantity,
          subTotal: product.price * line.quantity,
        });
      }
    }

    const totalAmount = items.reduce((sum, item) => sum + item.subTotal, 0);

    const usersCollection = db.firestore.collection('users');
    const userDoc = await usersCollection.doc(userId).get();

    if (!userDoc.exists) {
      req.flash('error', 'Không tìm thấy người dùng.');
      return res.redirect('/products/cart');
    }

    const userData = userDoc.data();
    const currentBalance = userData.wallet_balance || 0;

    if (currentBalance < totalAmount) {
      req.flash(
        'error',
        `Số dư không đủ. Cần ₫${totalAmount.toLocaleString(
          'vi-VN'
        )} nhưng còn ₫${currentBalance.toLocaleString('vi-VN')}`
      );
      return res.redirect('/products/cart');
    }

    const newBalance = currentBalance - totalAmount;
    await usersCollection.doc(userId).update({
      wallet_balance: newBalance,
      updated_at: new Date(),
    });

    const ordersCollection = db.firestore.collection('orders');
    const orderRef = await ordersCollection.add({
      user_id: userId,
      username: userData.username,
      email: userData.email,
      items: items,
      total_amount: totalAmount,
      status: 'pending',
      payment_method: 'wallet',
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Tự động tạo báo cáo doanh thu từ đơn hàng vừa hoàn thành
    const revenueCollection = db.firestore.collection('revenues');
    await revenueCollection.add({
      order_id: orderRef.id,
      user_id: userId,
      username: userData.username,
      amount: totalAmount,
      payment_method: 'wallet',
      status: 'auto',
      description: `Doanh thu tự động cho đơn ${orderRef.id.substring(0, 8)}`,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const transactionsCollection = db.firestore.collection('wallet_transactions');
    await transactionsCollection.add({
      user_id: userId,
      username: userData.username,
      amount: totalAmount,
      type: 'payment',
      payment_method: 'wallet',
      description: `Thanh toán đơn hàng #${orderRef.id.substring(0, 8)}`,
      balance_before: currentBalance,
      balance_after: newBalance,
      created_at: new Date(),
      status: 'completed',
      order_id: orderRef.id,
    });

    req.session.user.wallet_balance = newBalance;
    req.session.cart = []; 

    req.session.save(() => {
        req.flash('success', `Thanh toán thành công! Mã đơn hàng: ${orderRef.id.substring(0, 8)}`);
        res.redirect('/orders/' + orderRef.id);
    });

  } catch (err) {
    console.error('❌ Order checkout error:', err.message);
    req.flash('error', 'Thanh toán thất bại. Vui lòng thử lại.');
    res.redirect('/products/cart');
  }
});

// GET: Xem chi tiết đơn hàng (ĐÃ SỬA LỖI NGÀY THÁNG VÀ CHỐNG VĂNG LỖI)
router.get('/:orderId', isAuthenticated, async (req, res) => {
  const { orderId } = req.params;
  const userId = req.session.user.uid;

  try {
    const ordersCollection = db.firestore.collection('orders');
    const orderDoc = await ordersCollection.doc(orderId).get();

    if (!orderDoc.exists) {
      req.flash('error', 'Không tìm thấy đơn hàng.');
      return res.redirect('/profile');
    }

    const data = orderDoc.data();
    const order = {
      id: orderId,
      ...data,
      // Bắt buộc mở hộp ngày tháng cho CẢ ngày tạo và ngày cập nhật
      created_at: data.created_at && data.created_at.toDate ? data.created_at.toDate() : new Date(),
      updated_at: data.updated_at && data.updated_at.toDate ? data.updated_at.toDate() : new Date()
    };

    if (order.user_id !== userId) {
      req.flash('error', 'Bạn không có quyền xem đơn hàng này.');
      return res.redirect('/profile');
    }

    res.render('order-detail', { order });
  } catch (err) {
    console.error('❌ Order detail error:', err);
    req.flash('error', 'Không thể tải chi tiết đơn hàng.');
    res.redirect('/profile');
  }
});

// GET: Danh sách đơn hàng của user (ĐÃ SỬA LỖI NGÀY THÁNG VÀ SẮP XẾP)
router.get('/', isAuthenticated, async (req, res) => {
  const userId = req.session.user.uid;

  try {
    const ordersCollection = db.firestore.collection('orders');
    
    const snapshot = await ordersCollection.where('user_id', '==', userId).get();

    let orders = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      orders.push({
        id: doc.id,
        ...data,
        // Xử lý ngày tháng an toàn
        created_at: data.created_at && data.created_at.toDate ? data.created_at.toDate() : new Date(),
        updated_at: data.updated_at && data.updated_at.toDate ? data.updated_at.toDate() : new Date()
      });
    });

    // Sắp xếp đơn hàng mới nhất lên đầu
    orders.sort((a, b) => b.created_at - a.created_at);

    res.render('orders', { orders });
  } catch (err) {
    console.error('❌ Orders list error:', err.message);
    req.flash('error', 'Không thể tải danh sách đơn hàng.');
    res.redirect('/profile');
  }
});


// POST: Xử lý hủy đơn hàng
router.post('/cancel/:orderId', isAuthenticated, async (req, res) => {
  const { orderId } = req.params;
  const userId = req.session.user.uid;

  try {
    const orderRef = db.firestore.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists || orderDoc.data().user_id !== userId) {
      req.flash('error', 'Không tìm thấy đơn hàng.');
      return res.redirect('/orders');
    }

    // Chỉ cho hủy khi đơn chưa hoàn tất
    if (orderDoc.data().status === 'completed') {
      req.flash('error', 'Đơn hàng đã hoàn tất, không thể hủy.');
      return res.redirect('/orders');
    }

    await orderRef.update({
      status: 'cancelled',
      updated_at: new Date()
    });

    req.flash('success', 'Đã hủy đơn hàng thành công.');
    res.redirect('/orders');
  } catch (err) {
    console.error('Lỗi hủy đơn:', err);
    req.flash('error', 'Có lỗi xảy ra khi hủy đơn.');
    res.redirect('/orders');
  }
});

module.exports = router;