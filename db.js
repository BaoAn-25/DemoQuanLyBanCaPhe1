const admin = require('firebase-admin');

const path = require('path');
const fs = require('fs');

// Khởi tạo Firebase Admin (Firestore) để lưu tất cả dữ liệu
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
  ? path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
  : path.resolve(__dirname, 'firebase-service-account.json');

console.log('📂 Firebase Service Account Path:', serviceAccountPath);
console.log('📂 File exists:', fs.existsSync(serviceAccountPath));

let firestore = null;

try {
  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error(`File không tồn tại: ${serviceAccountPath}`);
  }

  const serviceAccount = require(serviceAccountPath);
  console.log('✅ Service account loaded:', serviceAccount.project_id);

  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
    console.log('✅ Firebase Admin SDK initialized');
  }

  firestore = admin.firestore();
  console.log('✅ Firestore initialized successfully');
} catch (error) {
  console.error('❌ Firebase Error:', error.message);
  console.error('❌ Stack:', error.stack);
}

module.exports = {
  firestore,
  admin,
};
