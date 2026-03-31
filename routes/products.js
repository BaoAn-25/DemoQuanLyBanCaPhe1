const express = require('express');
const db = require('../db');

const router = express.Router();

const fallbackFeatured = [
  {
    id: '1',
    name: 'Cà phê Espresso',
    description: 'Ly espresso đậm đặc, hương thơm nồng nàn của cà phê rang xay.',
    price: 49000,
    category: 'Espresso',
    image_url: '/images/products/espresso.jpg',
  },
  {
    id: '2',
    name: 'Cà phê Latte',
    description: 'Latte kem sữa mịn màng, hòa quyện cùng cà phê rang xay.',
    price: 62000,
    category: 'Latte',
    image_url: '/images/products/latte.jpg',
  },
  {
    id: '3',
    name: 'Cold Brew',
    description: 'Cold brew pha lạnh 12 giờ, vị êm dịu và rất dễ uống.',
    price: 68000,
    category: 'Cold Brew',
    image_url: '/images/products/cold-brew.jpg',
  },
  {
    id: '4',
    name: 'Cà phê Cappuccino',
    description: 'Cappuccino với lớp bọt sữa mịn mềm cùng bột cacao.',
    price: 63000,
    category: 'Cappuccino',
    image_url: '/images/products/cappuccino.jpg',
  },
];

function findFallbackProduct(productId) {
  return fallbackFeatured.find((p) => String(p.id) === String(productId));
}

function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  }

  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(401).json({
      success: false,
      message: 'Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.',
      redirect: '/auth/login',
    });
  }

  req.flash('error', 'Vui lòng đăng nhập để truy cập trang này.');
  res.redirect('/auth/login');
}

// Hàm lấy danh mục từ collection categories (ưu tiên) rồi fallback sang products
async function getCategories() {
  try {
    const categoriesRef = db.firestore.collection('categories').orderBy('name', 'asc');
    const snapshot = await categoriesRef.get();
    const categories = [];
    snapshot.forEach(doc => {
      const cat = doc.data();
      categories.push({ id: doc.id, name: cat.name, image_url: cat.image_url || '/images/categories/default.jpg' });
    });

    if (categories.length > 0) {
      return categories;
    }

    // Nếu không có category collection, lấy từ product
    const productsRef = db.firestore.collection('products');
    const productSnapshot = await productsRef.get();
    const fallbackSet = new Set();
    productSnapshot.forEach(doc => {
      const product = doc.data();
      if (product.category) {
        fallbackSet.add(product.category);
      }
    });
    return Array.from(fallbackSet).sort().map(name => ({ id: name, name, image_url: '/images/categories/default.jpg'}));
  } catch (error) {
    console.error('Lỗi khi lấy danh mục:', error);
    return [
      { id: 'Espresso', name: 'Espresso', image_url: '/images/categories/espresso.jpg' },
      { id: 'Latte', name: 'Latte', image_url: '/images/categories/latte.jpg' },
      { id: 'Cold Brew', name: 'Cold Brew', image_url: '/images/categories/cold-brew.jpg' },
      { id: 'Cappuccino', name: 'Cappuccino', image_url: '/images/categories/cappuccino.jpg' }
    ];
  }
}

// Trang dùng thử
router.get('/test', (req, res) => {
  res.redirect('/');
});

// Trang xem tất cả món
router.get('/', async (req, res) => {
  const { category } = req.query;

  try {
    const productsRef = db.firestore.collection('products');
    let query = productsRef.orderBy('created_at', 'desc');

    if (category) {
      query = query.where('category', '==', category);
    }

    const snapshot = await query.get();
    const products = [];

    snapshot.forEach(doc => {
      const product = doc.data();
      products.push({
        id: doc.id,
        ...product,
        created_at: product.created_at ? product.created_at.toDate() : new Date()
      });
    });

    const categories = await getCategories();

    res.render('products', {
      products,
      categoryFilter: category,
      searchQuery: null,
      categories
    });
  } catch (err) {
    console.error('Lỗi khi tải sản phẩm:', err);
    req.flash('error', 'Không thể tải danh sách sản phẩm.');
    res.redirect('/');
  }
});

// Tìm kiếm món
router.get('/search', async (req, res) => {
  const { q } = req.query;

  try {
    const productsRef = db.firestore.collection('products');
    const snapshot = await productsRef.orderBy('created_at', 'desc').get();
    const allProducts = [];

    snapshot.forEach(doc => {
      const product = doc.data();
      allProducts.push({
        id: doc.id,
        ...product,
        created_at: product.created_at ? product.created_at.toDate() : new Date()
      });
    });

    const normalizedQ = q ? q.toLowerCase().trim() : '';
    const products = allProducts.filter(product => {
      if (!normalizedQ) return false;
      return product.name.toLowerCase().trim() === normalizedQ;
    });

    const categories = await getCategories();
    const noResultsMessage = normalizedQ && products.length === 0 ? 'Không tìm thấy sản phẩm theo tên bạn nhập.' : null;

    res.render('products', {
      products,
      searchQuery: q,
      categoryFilter: null,
      categories,
      noResultsMessage
    });
  } catch (err) {
    console.error('Lỗi khi tìm kiếm sản phẩm:', err);
    req.flash('error', 'Không thể tìm kiếm sản phẩm.');
    res.redirect('/products');
  }
});

// Thêm vào giỏ hàng (ĐÃ TỐI ƯU VÀ CHUẨN HÓA CÁCH ĐẾM SỐ LƯỢNG)
router.post('/add-to-cart', isAuthenticated, async (req, res) => {
  try {
    const rawProductId = req.body.productId || req.body.id;

    if (!rawProductId) {
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(400).json({ success: false, message: 'Lỗi: Nút bấm không gửi mã sản phẩm.' });
      }
      req.flash('error', 'Không thể thêm: Nút bấm bị lỗi.');
      return res.redirect('/products');
    }

    const maSanPham = String(rawProductId).trim(); 

    if (!req.session.cart) {
      req.session.cart = [];
    }

    const existing = req.session.cart.find((item) => String(item.productId).trim() === maSanPham);
    
    if (!existing) {
      const productDoc = await db.firestore.collection('products').doc(maSanPham).get().catch(() => null);
      let productData;
      
      if (productDoc && productDoc.exists) {
        productData = productDoc.data();
      } else {
        productData = findFallbackProduct(maSanPham);
      }

      const item = {
        productId: maSanPham,
        quantity: 1, 
        name: productData ? productData.name : 'Sản phẩm đang cập nhật',
        price: productData ? productData.price : 0,
        image_url: productData ? productData.image_url : '/images/products/default.jpg'
      };
      req.session.cart.push(item);
    } else {
      existing.quantity = parseInt(existing.quantity || 0) + 1;
    }

    const cart = req.session.cart;
    let totalAmount = 0;

    for (const item of cart) {
      totalAmount += parseInt(item.price || 0) * parseInt(item.quantity || 0);
    }

    const cartCount = cart.reduce((sum, item) => sum + (parseInt(item.quantity || 0) || 0), 0);

    req.session.save((err) => {
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(200).json({
          success: true,
          message: 'Đã thêm vào giỏ hàng.',
          cartCount, // Tổng số lượng sản phẩm theo quantity
          cartTotal: totalAmount
        });
      }

      req.flash('success', 'Đã thêm vào giỏ hàng.');
      res.redirect('/products');
    });

  } catch (err) {
    console.error('Lỗi add-to-cart:', err);
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(500).json({ success: false, message: 'Lỗi khi thêm vào giỏ hàng.' });
    }
    req.flash('error', 'Lỗi khi thêm vào giỏ hàng. Vui lòng thử lại.');
    res.redirect('/products');
  }
});

// Mua ngay
router.post('/buy-now', (req, res) => {
  const rawProductId = req.body.productId || req.body.id;
  
  if (!rawProductId) {
    req.flash('error', 'Không tìm thấy sản phẩm để mua.');
    return res.redirect('/products');
  }

  const maSanPham = String(rawProductId).trim(); 

  req.session.cart = [{ productId: maSanPham, quantity: 1 }];

  req.session.save(() => {
    req.flash('success', 'Đã thêm sản phẩm. Đang chuyển đến thanh toán...');
    res.redirect('/orders/checkout');
  });
});

// Xem trang giỏ hàng 
router.get('/cart', isAuthenticated, (req, res) => {
  const cart = req.session.cart || [];

  if (cart.length === 0) {
    return res.render('cart', { items: [], total: 0 });
  }

  try {
    const items = [];
    let total = 0;

    for (const line of cart) {
      const maSanPham = String(line.productId).trim(); 
      const subTotal = parseInt(line.price || 0) * parseInt(line.quantity);
      
      items.push({
        id: maSanPham,
        name: line.name || `Sản phẩm (Mã: ${maSanPham})`,
        price: line.price || 0,
        image_url: line.image_url || '/images/products/default.jpg',
        quantity: parseInt(line.quantity),
        subTotal: subTotal,
      });

      total += subTotal;
    }

    res.render('cart', { items, total });
  } catch (err) {
    console.error('Lỗi khi tải giỏ hàng:', err);
    req.flash('error', 'Có lỗi khi tải giỏ hàng. Vui lòng thử lại.');
    res.render('cart', { items: [], total: 0 });
  }
});

// Xóa 1 món khỏi giỏ
router.post('/cart/remove', isAuthenticated, (req, res) => {
  const { productId } = req.body;
  const idCanXoa = String(productId).trim();
  req.session.cart = (req.session.cart || []).filter((item) => String(item.productId).trim() !== idCanXoa);
  
  req.session.save(() => {
    req.flash('success', 'Đã xóa sản phẩm khỏi giỏ hàng.');
    res.redirect('/products/cart');
  });
});

// Tăng giảm số lượng 
router.post('/cart/update', isAuthenticated, (req, res) => {
  const { productId, action } = req.body;
  const cart = req.session.cart || [];
  const idCanSua = String(productId).trim();

  const itemIndex = cart.findIndex((item) => String(item.productId).trim() === idCanSua);
  if (itemIndex !== -1) {
    if (action === 'increase') {
      cart[itemIndex].quantity = parseInt(cart[itemIndex].quantity) + 1;
      req.flash('success', 'Đã tăng số lượng sản phẩm.');
    } else if (action === 'decrease') {
      cart[itemIndex].quantity = parseInt(cart[itemIndex].quantity) - 1;
      if (cart[itemIndex].quantity <= 0) {
        cart.splice(itemIndex, 1);
        req.flash('success', 'Đã xóa sản phẩm khỏi giỏ hàng.');
      } else {
        req.flash('success', 'Đã giảm số lượng sản phẩm.');
      }
    }
  }

  req.session.save(() => {
    res.redirect('/products/cart');
  });
});

// Xóa sạch giỏ
router.post('/cart/clear', isAuthenticated, (req, res) => {
  req.session.cart = [];
  
  req.session.save(() => {
    req.flash('success', 'Đã xóa tất cả sản phẩm khỏi giỏ hàng.');
    res.redirect('/products/cart');
  });
});

module.exports = router;