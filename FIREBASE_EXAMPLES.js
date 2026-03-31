// Firebase Integration Examples for Coffee Shop App
// This file contains code snippets for common Firebase operations

// ========================================
// 1. AUTHENTICATION EXAMPLES
// ========================================

// Frontend: Sign Up with Email/Password
async function signUp(email, password, username) {
  try {
    const response = await fetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, username })
    });
    const data = await response.json();
    if (response.ok) {
      console.log('Sign up successful');
      window.location.href = '/auth/login';
    }
  } catch (error) {
    console.error('Sign up error:', error);
  }
}

// Frontend: Sign In
async function signIn(email, password) {
  try {
    const response = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (response.ok) {
      console.log('Login successful');
      window.location.href = '/';
    }
  } catch (error) {
    console.error('Login error:', error);
  }
}

// Frontend: Sign Out
async function signOut() {
  try {
    const response = await fetch('/auth/logout', {
      method: 'POST'
    });
    if (response.ok) {
      window.location.href = '/';
    }
  } catch (error) {
    console.error('Logout error:', error);
  }
}

// ========================================
// 2. FIRESTORE - PRODUCTS
// ========================================

// Backend: Add Product to Firestore
async function addProductToFirestore(productData) {
  const admin = require('firebase-admin');
  const db = admin.firestore();

  try {
    const docRef = await db.collection('products').add({
      name: productData.name,
      category: productData.category,
      description: productData.description,
      price: productData.price,
      imageUrl: productData.imageUrl,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  }
}

// Backend: Get All Products
async function getAllProducts() {
  const admin = require('firebase-admin');
  const db = admin.firestore();

  try {
    const snapshot = await db.collection('products').get();
    const products = [];
    snapshot.forEach(doc => {
      products.push({ id: doc.id, ...doc.data() });
    });
    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}

// Backend: Update Product
async function updateProduct(productId, updates) {
  const admin = require('firebase-admin');
  const db = admin.firestore();

  try {
    await db.collection('products').doc(productId).update({
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
}

// Backend: Delete Product
async function deleteProduct(productId) {
  const admin = require('firebase-admin');
  const db = admin.firestore();

  try {
    await db.collection('products').doc(productId).delete();
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
}

// ========================================
// 3. FIRESTORE - ORDERS
// ========================================

// Backend: Create Order
async function createOrder(userId, orderData) {
  const admin = require('firebase-admin');
  const db = admin.firestore();

  try {
    const orderRef = await db.collection('orders').add({
      userId: userId,
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      customerAddress: orderData.customerAddress,
      items: orderData.items,
      total: orderData.total,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update user's balance
    const userRef = db.collection('users').doc(userId);
    await userRef.update({
      balance: admin.firestore.FieldValue.increment(-orderData.total)
    });

    // Record transaction
    await db.collection('wallet_transactions').add({
      userId: userId,
      amount: orderData.total,
      type: 'payment',
      description: `Order #${orderRef.id}`,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return orderRef.id;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}

// Backend: Get User Orders
async function getUserOrders(userId) {
  const admin = require('firebase-admin');
  const db = admin.firestore();

  try {
    const snapshot = await db.collection('orders')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();
    
    const orders = [];
    snapshot.forEach(doc => {
      orders.push({ id: doc.id, ...doc.data() });
    });
    return orders;
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
}

// Backend: Update Order Status
async function updateOrderStatus(orderId, newStatus) {
  const admin = require('firebase-admin');
  const db = admin.firestore();

  try {
    await db.collection('orders').doc(orderId).update({
      status: newStatus,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating order:', error);
    throw error;
  }
}

// ========================================
// 4. FIRESTORE - WALLET/BALANCE
// ========================================

// Backend: Get User Balance
async function getUserBalance(userId) {
  const admin = require('firebase-admin');
  const db = admin.firestore();

  try {
    const userDoc = await db.collection('users').doc(userId).get();
    return userDoc.data()?.balance || 0;
  } catch (error) {
    console.error('Error fetching balance:', error);
    throw error;
  }
}

// Backend: Deposit Money
async function depositMoney(userId, amount, bankName, accountNumber) {
  const admin = require('firebase-admin');
  const db = admin.firestore();

  try {
    // Update balance
    await db.collection('users').doc(userId).update({
      balance: admin.firestore.FieldValue.increment(amount)
    });

    // Record transaction
    await db.collection('wallet_transactions').add({
      userId: userId,
      amount: amount,
      type: 'deposit',
      description: `Deposit from ${bankName} (${accountNumber})`,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return true;
  } catch (error) {
    console.error('Error depositing money:', error);
    throw error;
  }
}

// Backend: Get Transaction History
async function getTransactionHistory(userId) {
  const admin = require('firebase-admin');
  const db = admin.firestore();

  try {
    const snapshot = await db.collection('wallet_transactions')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();
    
    const transactions = [];
    snapshot.forEach(doc => {
      transactions.push({ id: doc.id, ...doc.data() });
    });
    return transactions;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
}

// ========================================
// 5. CLOUD STORAGE - IMAGES
// ========================================

// Frontend: Upload Product Image
async function uploadProductImage(file) {
  try {
    const storage = firebase.storage();
    const storageRef = storage.ref('products/' + file.name);
    
    const uploadTask = storageRef.put(file);
    
    return new Promise((resolve, reject) => {
      uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED,
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('Upload progress:', progress + '%');
        },
        (error) => {
          console.error('Upload error:', error);
          reject(error);
        },
        async () => {
          const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
          resolve(downloadURL);
        }
      );
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

// Backend: Delete Image from Storage
async function deleteProductImage(imageUrl) {
  const admin = require('firebase-admin');
  const storage = admin.storage();

  try {
    const bucket = storage.bucket();
    
    // Extract path from URL
    const filePath = decodeURIComponent(imageUrl.split('/o/')[1].split('?')[0]);
    
    await bucket.file(filePath).delete();
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
}

// ========================================
// 6. REAL-TIME LISTENERS (Frontend)
// ========================================

// Listen to Product Changes in Real-time
function listenToProducts(callback) {
  const db = firebase.firestore();
  
  db.collection('products').onSnapshot((snapshot) => {
    const products = [];
    snapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() });
    });
    callback(products);
  });
}

// Listen to Order Status Changes in Real-time
function listenToUserOrders(userId, callback) {
  const db = firebase.firestore();
  
  db.collection('orders')
    .where('userId', '==', userId)
    .onSnapshot((snapshot) => {
      const orders = [];
      snapshot.forEach((doc) => {
        orders.push({ id: doc.id, ...doc.data() });
      });
      callback(orders);
    });
}

// ========================================
// 7. ADMIN OPERATIONS
// ========================================

// Backend: Set Admin Role
async function setAdminRole(uid) {
  const admin = require('firebase-admin');
  const auth = admin.auth();
  const db = admin.firestore();

  try {
    // Set custom claims
    await auth.setCustomUserClaims(uid, { admin: true });

    // Update Firestore
    await db.collection('users').doc(uid).update({
      role: 'admin'
    });
  } catch (error) {
    console.error('Error setting admin role:', error);
    throw error;
  }
}

// Backend: Get All Users (Admin Only)
async function getAllUsers() {
  const admin = require('firebase-admin');
  const db = admin.firestore();

  try {
    const snapshot = await db.collection('users').get();
    const users = [];
    snapshot.forEach(doc => {
      users.push({ uid: doc.id, ...doc.data() });
    });
    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

// Backend: Delete User Account
async function deleteUserAccount(uid) {
  const admin = require('firebase-admin');
  const auth = admin.auth();
  const db = admin.firestore();

  try {
    // Delete from Auth
    await auth.deleteUser(uid);

    // Delete from Firestore
    await db.collection('users').doc(uid).delete();
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

// ========================================
// 8. ERROR HANDLING
// ========================================

// Firebase Error Code Mapping
const firebaseErrors = {
  'auth/email-already-in-use': 'Email này đã được đăng ký',
  'auth/weak-password': 'Mật khẩu quá yếu',
  'auth/invalid-email': 'Email không hợp lệ',
  'auth/user-not-found': 'Tài khoản không tồn tại',
  'auth/wrong-password': 'Mật khẩu sai',
  'permission-denied': 'Bạn không có quyền thực hiện hành động này',
};

function getErrorMessage(errorCode) {
  return firebaseErrors[errorCode] || 'Có lỗi xảy ra. Vui lòng thử lại.';
}

// ========================================
// EXPORT
// ========================================

module.exports = {
  // Auth
  signUp, signIn, signOut,
  
  // Products
  addProductToFirestore, getAllProducts, updateProduct, deleteProduct,
  
  // Orders
  createOrder, getUserOrders, updateOrderStatus,
  
  // Wallet
  getUserBalance, depositMoney, getTransactionHistory,
  
  // Storage
  uploadProductImage, deleteProductImage,
  
  // Admin
  setAdminRole, getAllUsers, deleteUserAccount,
  
  // Utilities
  getErrorMessage
};
