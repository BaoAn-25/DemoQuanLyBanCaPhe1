const db = require('./db');

async function seedProducts() {
  try {
    console.log('🚀 Bắt đầu tạo dữ liệu mẫu products trong Firestore...');

    const productsRef = db.firestore.collection('products');

    const sampleProducts = [
      {
        name: 'Cà phê Espresso',
        category: 'Espresso',
        description: 'Ly espresso đậm đặc, hương thơm nồng nàn của cà phê rang xay.',
        price: 49000,
        image_url: '/images/products/espresso.jpg',
        created_at: new Date(),
      },
      {
        name: 'Cà phê Latte',
        category: 'Latte',
        description: 'Latte kem sữa mịn màng, hòa quyện cùng cà phê rang xay.',
        price: 62000,
        image_url: '/images/products/latte.jpg',
        created_at: new Date(),
      },
      {
        name: 'Cold Brew',
        category: 'Cold Brew',
        description: 'Cold brew pha lạnh 12 giờ, vị êm dịu và rất dễ uống.',
        price: 68000,
        image_url: '/images/products/cold-brew.jpg',
        created_at: new Date(),
      },
      {
        name: 'Cappuccino',
        category: 'Cappuccino',
        description: 'Cappuccino với lớp bọt sữa mịn mềm cùng bột cacao.',
        price: 63000,
        image_url: '/images/products/cappuccino.jpg',
        created_at: new Date(),
      },
      {
        name: 'Cà phê sữa đá',
        category: 'Sữa đá',
        description: 'Cà phê sữa đá truyền thống, thơm vị sữa đặc và cà phê rang đậm.',
        price: 45000,
        image_url: 'https://images.unsplash.com/photo-1527169402691-a0b06755c784?auto=format&fit=crop&w=800&q=80',
        created_at: new Date(),
      },
      {
        name: 'Americano',
        category: 'Americano',
        description: 'Americano pha theo kiểu Ý, đậm đà và tinh tế.',
        price: 52000,
        image_url: '/images/products/americano.jpg',
        created_at: new Date(),
      },
      {
        name: 'Mocha',
        category: 'Mocha',
        description: 'Mocha với sô-cô-la đen và kem sữa, ngọt ngào quyến rũ.',
        price: 65000,
        image_url: '/images/products/mocha.jpg',
        created_at: new Date(),
      },
      {
        name: 'Macchiato',
        category: 'Macchiato',
        description: 'Macchiato với một chút sữa, vị cà phê nguyên bản.',
        price: 58000,
        image_url: '/images/products/macchiato.jpg',
        created_at: new Date(),
      }
    ];

    // Kiểm tra xem đã có products chưa
    const existingSnapshot = await productsRef.limit(1).get();
    if (!existingSnapshot.empty) {
      console.log('⚠️  Products đã tồn tại trong Firestore. Bỏ qua tạo dữ liệu mẫu.');
      return;
    }

    // Thêm products vào Firestore
    const batch = db.firestore.batch();

    for (let i = 0; i < sampleProducts.length; i++) {
      const productRef = productsRef.doc((i + 1).toString());
      batch.set(productRef, sampleProducts[i]);
      console.log(`➕ Đã thêm sản phẩm: ${sampleProducts[i].name}`);
    }

    await batch.commit();
    console.log('✅ Đã tạo thành công dữ liệu mẫu products trong Firestore!');

  } catch (error) {
    console.error('❌ Lỗi khi tạo dữ liệu mẫu:', error);
  } finally {
    process.exit(0);
  }
}

seedProducts();