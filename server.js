const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const walletRoutes = require('./routes/wallet');
const ordersRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const db = require('./db');

// Ngăn trang web bị sập hoàn toàn nếu có lỗi ngầm
process.on('unhandledRejection', (err) => {
  console.error('Lỗi ngầm chưa xử lý:', err);
});
process.on('uncaughtException', (err) => {
  console.error('Lỗi sập hệ thống:', err);
});

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Cuốn sổ ghi nhớ thông tin khách hàng
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'coffee-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 2, // Nhớ trong 2 tiếng
    },
  })
);
app.use(flash());

app.use((req, res, next) => {
  res.locals.bodyClass = req.path.startsWith('/auth') ? 'auth-page' : '';
  next();
});

// Khu vực kiểm tra và tính tiền giỏ hàng mỗi khi tải trang - ĐÃ TỐI ƯU SIÊU TỐC
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.successMsg = req.flash('success');
  res.locals.errorMsg = req.flash('error');
  res.locals.cart = req.session.cart || [];

  let cartTotal = 0;
  if (req.session.cart && req.session.cart.length > 0) {
    for (const line of req.session.cart) {
      cartTotal += (line.price || 0) * line.quantity;
    }
  }
  res.locals.cartTotal = cartTotal;

  next();
});

app.use(async (req, res, next) => {
  try {
    const snapshot = await db.firestore.collection('categories').orderBy('name').get();
    const categories = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      categories.push({ id: doc.id, name: data.name, image_url: data.image_url || '/images/categories/default.jpg' });
    });
    res.locals.navCategories = categories;
  } catch (err) {
    console.error('Lỗi lấy danh sách danh mục cho navbar:', err);
    res.locals.navCategories = [
      { id: 'espresso', name: 'Espresso' },
      { id: 'latte', name: 'Latte' },
      { id: 'cold-brew', name: 'Cold Brew' },
      { id: 'cappuccino', name: 'Cappuccino' }
    ];
  }
  next();
});

app.use('/auth', authRoutes);
app.use('/products', productRoutes);
app.use('/wallet', walletRoutes);
app.use('/orders', ordersRoutes);
app.use('/admin', adminRoutes);

const fallbackFeatured = [
  {
    id: 1,
    name: 'Cà phê Espresso',
    description: 'Ly espresso đậm đặc, hương thơm nồng nàn của cà phê rang xay.',
    price: 49000,
    category: 'Espresso',
    image_url: '/images/products/espresso.jpg',
  },
  {
    id: 2,
    name: 'Cà phê Latte',
    description: 'Latte kem sữa mịn màng, hòa quyện cùng cà phê rang xay.',
    price: 62000,
    category: 'Latte',
    image_url: '/images/products/latte.jpg',
  },
  {
    id: 3,
    name: 'Cold Brew',
    description: 'Cold brew pha lạnh 12 giờ, vị êm dịu và rất dễ uống.',
    price: 68000,
    category: 'Cold Brew',
    image_url: '/images/products/cold-brew.jpg',
  },
  {
    id: 4,
    name: 'Cappuccino',
    description: 'Cappuccino với lớp bọt sữa mịn mềm cùng bột cacao.',
    price: 63000,
    category: 'Cappuccino',
    image_url: '/images/products/cappuccino.jpg',
  },
];

app.get('/', async (req, res) => {
  try {
    const db = require('./db');
    const productsRef = db.firestore.collection('products');
    const snapshot = await productsRef.orderBy('created_at', 'desc').limit(4).get();

    const featured = [];
    snapshot.forEach(doc => {
      const product = doc.data();
      featured.push({
        id: doc.id,
        ...product,
        created_at: product.created_at ? product.created_at.toDate() : new Date()
      });
    });

    res.render('index', { featured });
  } catch (err) {
    console.error('Lỗi khi tải sản phẩm nổi bật:', err);
    res.render('index', { featured: fallbackFeatured });
  }
});

// Trang thông tin cá nhân (ĐÃ SỬA LỖI NGÀY THÁNG VÀ SẮP XẾP)
app.get('/profile', async (req, res) => {
  if (!req.session.user) {
    req.flash('error', 'Vui lòng đăng nhập.');
    return res.redirect('/auth/login');
  }

  try {
    const userId = req.session.user.uid;
    const ordersCollection = db.firestore.collection('orders');
    
    // Bỏ lệnh sắp xếp của kho để không bị chặn
    const snapshot = await ordersCollection
      .where('user_id', '==', userId)
      .get();

    const orders = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      orders.push({
        id: doc.id,
        ...data,
        // Mở hộp ngày tháng của kho để web đọc được
        created_at: data.created_at && data.created_at.toDate ? data.created_at.toDate() : new Date(),
        updated_at: data.updated_at && data.updated_at.toDate ? data.updated_at.toDate() : new Date()
      });
    });

    // Tự mình sắp xếp đơn hàng mới nhất lên trên
    orders.sort((a, b) => b.created_at - a.created_at);

    res.render('profile', { orders });
  } catch (err) {
    console.error('❌ Lỗi tải thông tin cá nhân:', err);
    res.render('profile', { orders: [] });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    const snapshot = await db.firestore.collection('categories').orderBy('name').get();
    const categories = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      categories.push({
        id: doc.id,
        name: data.name,
        image_url: data.image_url || '/images/categories/default.jpg',
      });
    });
    return res.json({ categories });
  } catch (err) {
    console.error('Lỗi API lấy danh mục:', err);
    return res.status(500).json({ error: 'Không thể lấy danh mục' });
  }
});

app.get('*', (req, res) => {
  res.status(404).render('404');
});

app.listen(PORT, () => {
  console.log(`Trang web đang chạy tại http://localhost:${PORT}`);
});