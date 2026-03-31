## 🔥 Firebase Quick Start Guide

### Configuration Status: ✅ READY

Your Firebase configuration is already set up in the project:
- **Project ID**: coffee-management-a4895
- **Config File**: `/js/firebase-config.js`
- **Client Config**: `/public/js/firebase-client.js`

---

## 🚀 Get Started in 5 Steps

### Step 1: Download Firebase Service Account

1. Visit [Firebase Console](https://console.firebase.google.com/)
2. Select project: **coffee-management-a4895**
3. Go to **Settings** (⚙️) → **Service Accounts**
4. Click **"Generate New Private Key"**
5. Save the JSON file as **`firebase-service-account.json`** in your project root

### Step 2: Update .env File

Add these to your `.env` file:

```env
# Firebase Service Account (relative path)
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json

# Firebase Web Config (optional - for client-side)
FIREBASE_API_KEY=AIzaSyDOYDvy56l4A0dYuJxV5qZr3Rprb0GRWRE
FIREBASE_PROJECT_ID=coffee-management-a4895
FIREBASE_AUTH_DOMAIN=coffee-management-a4895.firebaseapp.com
```

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Update server.js

Make sure `server.js` initializes Firebase Admin SDK:

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'coffee-management-a4895'
});
```

### Step 5: Update Route Files

Update your route files to use Firebase instead of MySQL:
- See `/routes/firebase-auth-example.js` for Firebase authentication
- See `FIREBASE_EXAMPLES.js` for all available functions

---

## 📁 Project Structure

```
DemoQuanLyBanCaPhe/
├── js/
│   └── firebase-config.js          # Backend Firebase Admin init
├── public/js/
│   └── firebase-client.js          # Frontend Firebase init
├── routes/
│   ├── firebase-auth-example.js    # Firebase auth routes (reference)
│   ├── auth.js                     # Current auth routes
│   ├── products.js
│   ├── orders.js
│   ├── wallet.js
│   └── admin.js
├── FIREBASE_SETUP.md               # Detailed Firebase setup
├── FIREBASE_EXAMPLES.js            # Code examples for all operations
└── firebase-service-account.json    # ⚠️ Keep this PRIVATE!
```

---

## 🔐 Security Checklist

- ✅ Service account key stored locally (never commit to Git)
- ✅ Add to `.gitignore`:
  ```
  firebase-service-account.json
  .env
  ```
- ✅ Set Firestore security rules (see FIREBASE_SETUP.md)
- ✅ Enable authentication in Firebase Console
- ✅ Set authorized domains (add your domain to Firebase)

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| `FIREBASE_SETUP.md` | Complete Firebase setup & configuration |
| `FIREBASE_EXAMPLES.js` | Code snippets for all Firebase operations |
| `routes/firebase-auth-example.js` | Firebase authentication example routes |
| `js/firebase-config.js` | Backend Firebase initialization |
| `public/js/firebase-client.js` | Frontend Firebase initialization |

---

## 🎯 Common Tasks

### Add a Product
```javascript
const db = admin.firestore();
await db.collection('products').add({
  name: 'Espresso',
  price: 49000,
  category: 'Espresso',
  description: '...',
  imageUrl: '...'
});
```

### Create an Order
```javascript
const orderId = await createOrder(userId, {
  customerName: 'John',
  customerPhone: '0123456789',
  customerAddress: 'Street',
  items: [{...}],
  total: 100000
});
```

### Deposit Money to Wallet
```javascript
await depositMoney(userId, 500000, 'Vietcombank', '1234567890');
```

### Get User Orders (Real-time)
```javascript
listenToUserOrders(userId, (orders) => {
  console.log('Orders:', orders);
});
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot find module firebase-service-account.json" | Download service account from Firebase Console |
| "Firebase Admin SDK is not initialized" | Ensure service account is loaded in server.js |
| "Permission denied" | Check Firestore security rules in Firebase Console |
| "CORS error" | Add your domain to Firebase → Authentication → Authorized domains |

---

## 🔗 Useful Links

- 📗 [Firebase Documentation](https://firebase.google.com/docs)
- 🔑 [Firebase Console](https://console.firebase.google.com/)
- 🛡️ [Firebase Security Best Practices](https://firebase.google.com/docs/rules/rules-behavior)
- 💻 [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- ⚡ [Firestore Guide](https://firebase.google.com/docs/firestore)

---

## ✨ Features Available

### Authentication
- ✅ Sign up with email/password
- ✅ Sign in with email/password
- ✅ Sign out
- ✅ Update profile
- ✅ Admin role management
- ✅ Custom claims/permissions

### Firestore Database
- ✅ Users collection
- ✅ Products collection
- ✅ Orders collection
- ✅ Wallet transactions
- ✅ Real-time listeners
- ✅ Complex queries

### Cloud Storage
- ✅ Upload product images
- ✅ Upload user avatars
- ✅ Delete files
- ✅ Manage file permissions

### Analytics
- ✅ User behavior tracking
- ✅ Custom events
- ✅ Performance monitoring

---

## 🎓 Learning Path

1. **Beginner**: Read FIREBASE_SETUP.md
2. **Intermediate**: Review FIREBASE_EXAMPLES.js
3. **Advanced**: Implement custom Firestore rules & triggers
4. **Expert**: Deploy to Firebase Hosting & Functions

---

## ⚡ Quick Commands

```bash
# Start development server
npm run dev

# Run production server
npm start

# View Firebase logs
npm install -g firebase-tools
firebase init
firebase deploy --only functions
```

---

## 🎉 You're all set!

Your Firebase integration is ready. Start building amazing features! 

**Next Step**: Download your Firebase Service Account and complete Step 1 above.

---

For questions or support, refer to the [Firebase Documentation](https://firebase.google.com/docs) or the detailed guides in this project.

Happy coding! 🔥
