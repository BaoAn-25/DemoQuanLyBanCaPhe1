const db = require('./db');

async function migrateProductsToFirestore() {
  try {
    console.log('🚀 Bắt đầu migrate products từ MySQL sang Firestore...');

    // Lấy tất cả products từ MySQL
    const [products] = await db.mysqlPool.execute('SELECT * FROM products ORDER BY id');

    console.log(`📊 Tìm thấy ${products.length} sản phẩm trong MySQL`);

    if (products.length === 0) {
      console.log('⚠️  Không có sản phẩm nào để migrate');
      return;
    }

    // Migrate từng sản phẩm sang Firestore
    const batch = db.firestore.batch();
    const productsRef = db.firestore.collection('products');

    for (const product of products) {
      const productRef = productsRef.doc(product.id.toString());
      batch.set(productRef, {
        id: product.id,
        name: product.name,
        category: product.category,
        description: product.description,
        price: product.price,
        image_url: product.image_url,
        created_at: product.created_at || new Date(),
      });
      console.log(`➕ Đã thêm sản phẩm: ${product.name}`);
    }

    // Commit batch
    await batch.commit();
    console.log('✅ Đã migrate thành công tất cả sản phẩm sang Firestore!');

  } catch (error) {
    console.error('❌ Lỗi khi migrate:', error);
  } finally {
    process.exit(0);
  }
}

migrateProductsToFirestore();