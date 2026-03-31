const express = require('express');
const db = require('../db');

const router = express.Router();

function isAuthenticated(req, res, next) {
  if (!req.session.user) {
    req.flash('error', 'Vui lòng đăng nhập.');
    return res.redirect('/auth/login');
  }
  return next();
}

function isAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  req.flash('error', 'Bạn không có quyền truy cập trang admin.');
  return res.redirect('/');
}

router.use(isAuthenticated);
router.use(isAdmin);

router.get('/', (req, res) => {
  res.render('admin/dashboard');
});

// Products management
router.get('/products', async (req, res) => {
  try {
    const snapshot = await db.firestore.collection('products').orderBy('created_at', 'desc').get();
    const products = [];
    snapshot.forEach(doc => products.push({ id: doc.id, ...doc.data() }));
    res.render('admin/products', { products });
  } catch (err) {
    console.error('Admin products list error:', err);
    req.flash('error', 'Không thể tải danh sách sản phẩm.');
    res.redirect('/admin');
  }
});

router.get('/products/new', async (req, res) => {
  try {
    const snapshot = await db.firestore.collection('categories').orderBy('name', 'asc').get();
    let categories = [];
    snapshot.forEach(doc => categories.push({ id: doc.id, ...doc.data() }));

    // Nếu chưa có danh mục đã tải, lấy từ navCategories (middleware toàn cục)
    if (categories.length === 0 && res.locals.navCategories && res.locals.navCategories.length > 0) {
      categories = res.locals.navCategories;
    }

    console.log('[Debug] Categories for admin/products/new:', categories.map(c => c.name));
    res.render('admin/product-form', { product: null, categories });
  } catch (err) {
    console.error('Admin products new page error:', err);
    req.flash('error', 'Không thể tải form thêm sản phẩm.');
    res.redirect('/admin/products');
  }
});

router.post('/products', async (req, res) => {
  const { name, description, price, category, image_url } = req.body;
  if (!name || !price || !category) {
    req.flash('error', 'Vui lòng nhập đủ thông tin sản phẩm');
    return res.redirect('/admin/products/new');
  }

  try {
    await db.firestore.collection('products').add({
      name,
      description: description || '',
      price: Number(price),
      category,
      image_url: image_url || '/images/products/default.jpg',
      created_at: new Date(),
      updated_at: new Date(),
    });
    req.flash('success', 'Thêm sản phẩm thành công.');
    res.redirect('/admin/products');
  } catch (err) {
    console.error('Admin add product error:', err);
    req.flash('error', 'Thêm sản phẩm thất bại.');
    res.redirect('/admin/products/new');
  }
});

router.get('/products/:productId/edit', async (req, res) => {
  const { productId } = req.params;
  try {
    const doc = await db.firestore.collection('products').doc(productId).get();
    if (!doc.exists) {
      req.flash('error', 'Không tìm thấy sản phẩm.');
      return res.redirect('/admin/products');
    }
    const categorySnapshot = await db.firestore.collection('categories').orderBy('name', 'asc').get();
    const categories = [];
    categorySnapshot.forEach(cat => categories.push({ id: cat.id, ...cat.data() }));
    res.render('admin/product-form', { product: { id: doc.id, ...doc.data() }, categories });
  } catch (err) {
    console.error('Admin edit product page error:', err);
    req.flash('error', 'Không thể mở trang sửa sản phẩm.');
    res.redirect('/admin/products');
  }
});

router.post('/products/:productId/update', async (req, res) => {
  const { productId } = req.params;
  const { name, description, price, category, image_url } = req.body;
  try {
    await db.firestore.collection('products').doc(productId).update({
      name,
      description: description || '',
      price: Number(price),
      category,
      image_url: image_url || '/images/products/default.jpg',
      updated_at: new Date(),
    });
    req.flash('success', 'Cập nhật sản phẩm thành công.');
    res.redirect('/admin/products');
  } catch (err) {
    console.error('Admin update product error:', err);
    req.flash('error', 'Cập nhật sản phẩm thất bại.');
    res.redirect(`/admin/products/${productId}/edit`);
  }
});

router.post('/products/:productId/delete', async (req, res) => {
  const { productId } = req.params;
  try {
    await db.firestore.collection('products').doc(productId).delete();
    req.flash('success', 'Xóa sản phẩm thành công.');
    res.redirect('/admin/products');
  } catch (err) {
    console.error('Admin delete product error:', err);
    req.flash('error', 'Xóa sản phẩm thất bại.');
    res.redirect('/admin/products');
  }
});

// Orders management
router.get('/orders', async (req, res) => {
  try {
    const snapshot = await db.firestore.collection('orders').orderBy('created_at', 'desc').get();
    const orders = [];
    snapshot.forEach(doc => orders.push({ id: doc.id, ...doc.data() }));
    res.render('admin/orders', { orders });
  } catch (err) {
    console.error('Admin orders list error:', err);
    req.flash('error', 'Không thể tải danh sách đơn hàng.');
    res.redirect('/admin');
  }
});

// Alias for backwards compatibility
router.get('/order/:orderId', async (req, res) => {
  const { orderId } = req.params;
  try {
    const doc = await db.firestore.collection('orders').doc(orderId).get();
    if (!doc.exists) {
      req.flash('error', 'Đơn hàng không tồn tại.');
      return res.redirect('/admin/orders');
    }
    res.render('admin/order-detail', { order: { id: doc.id, ...doc.data() } });
  } catch (err) {
    console.error('Admin order detail alias error:', err);
    req.flash('error', 'Không thể tải chi tiết đơn hàng.');
    res.redirect('/admin/orders');
  }
});

router.get('/orders/:orderId', async (req, res) => {
  const { orderId } = req.params;
  try {
    const doc = await db.firestore.collection('orders').doc(orderId).get();
    if (!doc.exists) {
      req.flash('error', 'Đơn hàng không tồn tại.');
      return res.redirect('/admin/orders');
    }
    res.render('admin/order-detail', { order: { id: doc.id, ...doc.data() } });
  } catch (err) {
    console.error('Admin order detail error:', err);
    req.flash('error', 'Không thể tải chi tiết đơn hàng.');
    res.redirect('/admin/orders');
  }
});

router.post('/orders/:orderId/update-status', async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;
  const valid = ['pending', 'processing', 'shipped', 'completed', 'cancelled'];
  if (!valid.includes(status)) {
    req.flash('error', 'Trạng thái không hợp lệ.');
    return res.redirect(`/admin/orders/${orderId}`);
  }

  try {
    await db.firestore.collection('orders').doc(orderId).update({
      status,
      updated_at: new Date(),
    });
    req.flash('success', 'Cập nhật trạng thái đơn hàng thành công.');
    res.redirect(`/admin/orders/${orderId}`);
  } catch (err) {
    console.error('Admin update order status error:', err);
    req.flash('error', 'Cập nhật trạng thái thất bại.');
    res.redirect(`/admin/orders/${orderId}`);
  }
});

// Categories management
router.get('/categories', async (req, res) => {
  try {
    const snapshot = await db.firestore.collection('categories').orderBy('created_at', 'desc').get();
    const categories = [];
    snapshot.forEach(doc => categories.push({ id: doc.id, ...doc.data() }));
    res.render('admin/categories', { categories });
  } catch (err) {
    console.error('Admin categories list error:', err);
    req.flash('error', 'Không thể tải danh sách danh mục.');
    res.redirect('/admin');
  }
});

router.get('/categories/new', (req, res) => {
  res.render('admin/category-form', { category: null });
});

router.post('/categories', async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    req.flash('error', 'Vui lòng nhập tên danh mục');
    return res.redirect('/admin/categories/new');
  }

  try {
    await db.firestore.collection('categories').add({
      name,
      description: description || '',
      image_url: '/images/categories/default.jpg',
      created_at: new Date(),
      updated_at: new Date(),
    });
    req.flash('success', 'Thêm danh mục thành công.');
    res.redirect('/admin/categories');
  } catch (err) {
    console.error('Admin add category error:', err);
    req.flash('error', 'Thêm danh mục thất bại.');
    res.redirect('/admin/categories/new');
  }
});

router.get('/categories/:categoryId/edit', async (req, res) => {
  const { categoryId } = req.params;
  try {
    const doc = await db.firestore.collection('categories').doc(categoryId).get();
    if (!doc.exists) {
      req.flash('error', 'Không tìm thấy danh mục.');
      return res.redirect('/admin/categories');
    }
    res.render('admin/category-form', { category: { id: doc.id, ...doc.data() } });
  } catch (err) {
    console.error('Admin edit category page error:', err);
    req.flash('error', 'Không thể mở trang sửa danh mục.');
    res.redirect('/admin/categories');
  }
});

router.post('/categories/:categoryId/update', async (req, res) => {
  const { categoryId } = req.params;
  const { name, description } = req.body;

  try {
    await db.firestore.collection('categories').doc(categoryId).update({
      name,
      description: description || '',
      updated_at: new Date(),
    });
    req.flash('success', 'Cập nhật danh mục thành công.');
    res.redirect('/admin/categories');
  } catch (err) {
    console.error('Admin update category error:', err);
    req.flash('error', 'Cập nhật danh mục thất bại.');
    res.redirect(`/admin/categories/${categoryId}/edit`);
  }
});

router.post('/categories/:categoryId/delete', async (req, res) => {
  const { categoryId } = req.params;
  try {
    await db.firestore.collection('categories').doc(categoryId).delete();
    req.flash('success', 'Xóa danh mục thành công.');
    res.redirect('/admin/categories');
  } catch (err) {
    console.error('Admin delete category error:', err);
    req.flash('error', 'Xóa danh mục thất bại.');
    res.redirect('/admin/categories');
  }
});

// Warehouse management
router.get('/warehouse', async (req, res) => {
  try {
    const snapshot = await db.firestore.collection('warehouse').orderBy('updated_at', 'desc').get();
    const items = [];
    snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
    res.render('admin/warehouse', { items });
  } catch (err) {
    console.error('Admin warehouse list error:', err);
    req.flash('error', 'Không thể tải danh sách kho.');
    res.redirect('/admin');
  }
});

// Aliases for warehouse route to avoid 404 if users use plural or trailing slash
router.get('/warehouses', (req, res) => {
  res.redirect('/admin/warehouse');
});

router.get('/warehouse/', (req, res) => {
  res.redirect('/admin/warehouse');
});

router.get('/warehouse/new', (req, res) => {
  res.render('admin/warehouse-form', { item: null });
});

router.post('/warehouse', async (req, res) => {
  const { sku, name, product_id, quantity, min_stock, location, notes } = req.body;
  if (!name || quantity == null || sku == null) {
    req.flash('error', 'Vui lòng nhập SKU, tên và số lượng.');
    return res.redirect('/admin/warehouse/new');
  }
  try {
    await db.firestore.collection('warehouse').add({
      sku,
      name,
      product_id: product_id || '',
      quantity: Number(quantity),
      min_stock: Number(min_stock || 0),
      location: location || '',
      notes: notes || '',
      created_at: new Date(),
      updated_at: new Date(),
    });
    req.flash('success', 'Thêm mục kho thành công.');
    res.redirect('/admin/warehouse');
  } catch (err) {
    console.error('Admin add warehouse item error:', err);
    req.flash('error', 'Thêm mục kho thất bại.');
    res.redirect('/admin/warehouse/new');
  }
});

router.get('/warehouse/:itemId/edit', async (req, res) => {
  const { itemId } = req.params;
  try {
    const doc = await db.firestore.collection('warehouse').doc(itemId).get();
    if (!doc.exists) {
      req.flash('error', 'Không tìm thấy mục kho.');
      return res.redirect('/admin/warehouse');
    }
    res.render('admin/warehouse-form', { item: { id: doc.id, ...doc.data() } });
  } catch (err) {
    console.error('Admin edit warehouse item error:', err);
    req.flash('error', 'Không thể mở trang sửa kho.');
    res.redirect('/admin/warehouse');
  }
});

router.post('/warehouse/:itemId/update', async (req, res) => {
  const { itemId } = req.params;
  const { sku, name, product_id, quantity, min_stock, location, notes } = req.body;
  if (!name || quantity == null || sku == null) {
    req.flash('error', 'Vui lòng nhập SKU, tên và số lượng.');
    return res.redirect(`/admin/warehouse/${itemId}/edit`);
  }
  try {
    await db.firestore.collection('warehouse').doc(itemId).update({
      sku,
      name,
      product_id: product_id || '',
      quantity: Number(quantity),
      min_stock: Number(min_stock || 0),
      location: location || '',
      notes: notes || '',
      updated_at: new Date(),
    });
    req.flash('success', 'Cập nhật mục kho thành công.');
    res.redirect('/admin/warehouse');
  } catch (err) {
    console.error('Admin update warehouse item error:', err);
    req.flash('error', 'Cập nhật mục kho thất bại.');
    res.redirect(`/admin/warehouse/${itemId}/edit`);
  }
});

router.post('/warehouse/:itemId/delete', async (req, res) => {
  const { itemId } = req.params;
  try {
    await db.firestore.collection('warehouse').doc(itemId).delete();
    req.flash('success', 'Xóa mục kho thành công.');
    res.redirect('/admin/warehouse');
  } catch (err) {
    console.error('Admin delete warehouse item error:', err);
    req.flash('error', 'Xóa mục kho thất bại.');
    res.redirect('/admin/warehouse');
  }
});

// Revenue management - statistical dashboard from orders
router.get('/revenue', async (req, res) => {
  try {
    const ordersSnapshot = await db.firestore.collection('orders').get();
    const orders = [];
    ordersSnapshot.forEach(doc => {
      const data = doc.data();
      orders.push({ id: doc.id, ...data });
    });

    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.status === 'completed');
    const totalRevenue = completedOrders.reduce((sum,o) => sum + Number(o.total_amount || 0), 0);
    const revenueByPayment = {};
    const revenueByCategory = {};
    const productSales = {};
    const statusCount = {};

    orders.forEach(order => {
      const payment = order.payment_method || 'unknown';
      revenueByPayment[payment] = (revenueByPayment[payment] || 0) + Number(order.total_amount || 0);
      const status = order.status || 'unknown';
      statusCount[status] = (statusCount[status] || 0) + 1;

      if (Array.isArray(order.items)) {
        order.items.forEach(item => {
          const category = item.category || 'Chưa phân loại';
          const categoryAmount = Number(item.subTotal || (item.price || 0) * (item.quantity || 0));
          revenueByCategory[category] = (revenueByCategory[category] || 0) + categoryAmount;

          const productKey = item.name || item.productId || 'Không rõ';
          const quantity = Number(item.quantity || 0);
          if (!productSales[productKey]) {
            productSales[productKey] = { quantity: 0, revenue: 0 };
          }
          productSales[productKey].quantity += quantity;
          productSales[productKey].revenue += categoryAmount;
        });
      }
    });

    const topProducts = Object.entries(productSales)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a,b) => b.quantity - a.quantity)
      .slice(0, 10);

    const paymentData = Object.entries(revenueByPayment).map(([method, amount]) => ({ method, amount }));
    const categoryData = Object.entries(revenueByCategory).map(([category, amount]) => ({ category, amount }));

    const monthlyRevenue = {};
    completedOrders.forEach(order => {
      const date = order.created_at && order.created_at.toDate ? order.created_at.toDate() : new Date(order.created_at || new Date());
      const monthKey = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
      monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + Number(order.total_amount || 0);
    });

    const monthlyData = Object.entries(monthlyRevenue)
      .sort((a,b) => a[0].localeCompare(b[0]))
      .map(([month, amount]) => ({ month, amount }));

    res.render('admin/revenue', {
      totalOrders,
      completedOrdersCount: completedOrders.length,
      totalRevenue,
      paymentData,
      categoryData,
      topProducts,
      statusCount,
      monthlyData,
      orders,
    });
  } catch (err) {
    console.error('Admin revenue list error:', err);
    req.flash('error', 'Không thể tải báo cáo doanh thu.');
    res.redirect('/admin');
  }
});

// Alias for old links and report page
router.get('/revenue/report', (req, res) => {
  res.redirect('/admin/revenue');
});

router.get('/revenue/overview', (req, res) => {
  res.redirect('/admin/revenue');
});

router.get('/revenue/list', (req, res) => {
  res.redirect('/admin/revenue');
});

router.get('/revenue/new', (req, res) => {
  res.render('admin/revenue-form', { revenue: null });
});

router.post('/revenue', async (req, res) => {
  const { date, amount, description } = req.body;
  if (!date || !amount) {
    req.flash('error', 'Vui lòng nhập ngày và số tiền doanh thu.');
    return res.redirect('/admin/revenue/new');
  }
  try {
    await db.firestore.collection('revenues').add({
      date: new Date(date),
      amount: Number(amount),
      description: description || '',
      created_at: new Date(),
      updated_at: new Date(),
    });
    req.flash('success', 'Thêm doanh thu thành công.');
    res.redirect('/admin/revenue');
  } catch (err) {
    console.error('Admin add revenue error:', err);
    req.flash('error', 'Thêm doanh thu thất bại.');
    res.redirect('/admin/revenue/new');
  }
});

router.get('/revenue/:revenueId/edit', async (req, res) => {
  const { revenueId } = req.params;
  try {
    const doc = await db.firestore.collection('revenues').doc(revenueId).get();
    if (!doc.exists) {
      req.flash('error', 'Không tìm thấy mục doanh thu.');
      return res.redirect('/admin/revenue');
    }
    res.render('admin/revenue-form', { revenue: { id: doc.id, ...doc.data() } });
  } catch (err) {
    console.error('Admin edit revenue page error:', err);
    req.flash('error', 'Không thể mở trang sửa doanh thu.');
    res.redirect('/admin/revenue');
  }
});

router.post('/revenue/:revenueId/update', async (req, res) => {
  const { revenueId } = req.params;
  const { date, amount, description } = req.body;
  if (!date || !amount) {
    req.flash('error', 'Vui lòng nhập ngày và số tiền doanh thu.');
    return res.redirect(`/admin/revenue/${revenueId}/edit`);
  }
  try {
    await db.firestore.collection('revenues').doc(revenueId).update({
      date: new Date(date),
      amount: Number(amount),
      description: description || '',
      updated_at: new Date(),
    });
    req.flash('success', 'Cập nhật doanh thu thành công.');
    res.redirect('/admin/revenue');
  } catch (err) {
    console.error('Admin update revenue error:', err);
    req.flash('error', 'Cập nhật doanh thu thất bại.');
    res.redirect(`/admin/revenue/${revenueId}/edit`);
  }
});

router.post('/revenue/:revenueId/delete', async (req, res) => {
  const { revenueId } = req.params;
  try {
    await db.firestore.collection('revenues').doc(revenueId).delete();
    req.flash('success', 'Xóa doanh thu thành công.');
    res.redirect('/admin/revenue');
  } catch (err) {
    console.error('Admin delete revenue error:', err);
    req.flash('error', 'Xóa doanh thu thất bại.');
    res.redirect('/admin/revenue');
  }
});

// Users management
router.get('/users', async (req, res) => {
  try {
    const snapshot = await db.firestore.collection('users').orderBy('created_at', 'desc').get();
    const users = [];
    snapshot.forEach(doc => {
      const userData = doc.data();
      users.push({
        id: doc.id,
        ...userData,
        created_at: userData.created_at ? userData.created_at.toDate() : new Date()
      });
    });
    res.render('admin/users', { users });
  } catch (err) {
    console.error('Admin users list error:', err);
    req.flash('error', 'Không thể tải danh sách tài khoản.');
    res.redirect('/admin');
  }
});

router.get('/users/:userId/edit', async (req, res) => {
  const { userId } = req.params;
  try {
    const doc = await db.firestore.collection('users').doc(userId).get();
    if (!doc.exists) {
      req.flash('error', 'Không tìm thấy tài khoản.');
      return res.redirect('/admin/users');
    }
    res.render('admin/user-form', { user: { id: doc.id, ...doc.data() } });
  } catch (err) {
    console.error('Admin edit user page error:', err);
    req.flash('error', 'Không thể mở trang sửa tài khoản.');
    res.redirect('/admin/users');
  }
});

router.post('/users/:userId/update', async (req, res) => {
  const { userId } = req.params;
  const { username, email, role } = req.body;
  try {
    await db.firestore.collection('users').doc(userId).update({
      username,
      email,
      role: role || 'user',
      updated_at: new Date(),
    });
    req.flash('success', 'Cập nhật tài khoản thành công.');
    res.redirect('/admin/users');
  } catch (err) {
    console.error('Admin update user error:', err);
    req.flash('error', 'Cập nhật tài khoản thất bại.');
    res.redirect(`/admin/users/${userId}/edit`);
  }
});

router.post('/users/:userId/delete', async (req, res) => {
  const { userId } = req.params;
  try {
    await db.firestore.collection('users').doc(userId).delete();
    req.flash('success', 'Xóa tài khoản thành công.');
    res.redirect('/admin/users');
  } catch (err) {
    console.error('Admin delete user error:', err);
    req.flash('error', 'Xóa tài khoản thất bại.');
    res.redirect('/admin/users');
  }
});

module.exports = router;
