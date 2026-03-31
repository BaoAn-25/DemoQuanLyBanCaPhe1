# Firebase Setup Guide - Coffee Shop Web App

## 📱 Firebase Configuration

Your project is configured with **Firebase** for the following services:

### Firebase Project Details
- **Project ID**: coffee-management-a4895
- **API Key**: AIzaSyDOYDvy56l4A0dYuJxV5qZr3Rprb0GRWRE
- **Auth Domain**: coffee-management-a4895.firebaseapp.com
- **Storage Bucket**: coffee-management-a4895.firebasestorage.app

---

## 🔧 Setup Instructions

### 1️⃣ Install Firebase Dependencies

Firebase dependencies are already in `package.json`. Install them:

```bash
npm install
```

### 2️⃣ Backend Firebase Setup (Node.js/Express)

#### Server-side Firebase (firebase-admin)

File: `js/firebase-config.js`

This file initializes Firebase Admin SDK for your Node.js backend:

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const firestore = admin.firestore();
```

#### Get Firebase Service Account

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **coffee-management-a4895**
3. Settings (⚙️) → Service Accounts
4. Click "Generate New Private Key"
5. Save as `firebase-service-account.json` in project root
6. **⚠️ Add to `.gitignore`**:
   ```
   firebase-service-account.json
   ```

### 3️⃣ Client-side Firebase Setup (Browser)

File: `public/js/firebase-client.js`

Use this in your EJS templates:

```html
<script type="module" src="/js/firebase-client.js"></script>
```

---

## 📚 Firebase Services Enabled

### Authentication
```javascript
import { getAuth } from "firebase/auth";
const auth = getAuth(app);
```

**Use for:**
- User login/registration
- Password reset
- Social login (Google, GitHub, etc.)
- Email verification

### Firestore Database
```javascript
import { getFirestore } from "firebase/firestore";
const db = getFirestore(app);
```

**Use for:**
- Store user profiles
- Store orders
- Real-time data sync
- User preferences

### Cloud Storage
```javascript
import { getStorage } from "firebase/storage";
const storage = getStorage(app);
```

**Use for:**
- Store product images
- User avatars
- Order receipts

### Analytics
```javascript
import { getAnalytics } from "firebase/analytics";
const analytics = getAnalytics(app);
```

**Use for:**
- Track user behavior
- Monitor app performance

---

## 🔐 Security Rules

### Firestore Security Rules

Set rules in Firebase Console → Firestore Database → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Allow public read of products
    match /products/{document=**} {
      allow read: if true;
      allow write: if request.auth.token.admin == true;
    }
    
    // Orders: users can read their own, admins can read all
    match /orders/{document=**} {
      allow read: if request.auth.uid == resource.data.userId || request.auth.token.admin == true;
      allow write: if request.auth != null;
    }
  }
}
```

### Storage Security Rules

Set rules in Firebase Console → Storage → Rules:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow public read of all images
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
  }
}
```

---

## 💻 Usage Examples

### 1. User Authentication (Frontend)

```javascript
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

const auth = getAuth();

// Sign up
createUserWithEmailAndPassword(auth, email, password)
  .then((userCredential) => {
    console.log("User created:", userCredential.user);
  })
  .catch((error) => {
    console.error("Sign up error:", error.message);
  });

// Sign in
signInWithEmailAndPassword(auth, email, password)
  .then((userCredential) => {
    console.log("Logged in:", userCredential.user.email);
  })
  .catch((error) => {
    console.error("Login error:", error.message);
  });

// Sign out
signOut(auth);
```

### 2. Firestore Operations (Backend via Firebase Admin)

```javascript
const admin = require('firebase-admin');
const db = admin.firestore();

// Add document
db.collection('users').doc(uid).set({
  email: email,
  name: name,
  createdAt: admin.firestore.FieldValue.serverTimestamp()
});

// Read document
db.collection('users').doc(uid).get()
  .then(doc => console.log(doc.data()));

// Update document
db.collection('users').doc(uid).update({
  lastLogin: admin.firestore.FieldValue.serverTimestamp()
});

// Delete document
db.collection('users').doc(uid).delete();

// Query
db.collection('orders')
  .where('userId', '==', uid)
  .get()
  .then(snapshot => {
    snapshot.forEach(doc => console.log(doc.data()));
  });
```

### 3. Real-time Listeners (Frontend)

```javascript
import { getFirestore, collection, onSnapshot } from "firebase/firestore";

const db = getFirestore();

// Listen to collection
onSnapshot(collection(db, "products"), (snapshot) => {
  const products = [];
  snapshot.forEach((doc) => {
    products.push({ id: doc.id, ...doc.data() });
  });
  console.log("Products:", products);
});
```

### 4. Upload Images (Frontend)

```javascript
import { getStorage, ref, uploadBytes } from "firebase/storage";

const storage = getStorage();

// Upload file
const fileInput = document.getElementById('imageInput');
const file = fileInput.files[0];
const storageRef = ref(storage, 'products/' + file.name);

uploadBytes(storageRef, file).then((snapshot) => {
  console.log('Uploaded!', snapshot);
});
```

---

## 🚀 Enable Firebase Services

Go to [Firebase Console](https://console.firebase.google.com/) → Project: **coffee-management-a4895**

### ✅ Already Enabled
- Authentication
- Firestore Database
- Cloud Storage
- Analytics

### Optional Services to Enable
- **Cloud Functions** - Backend functions
- **Hosting** - Deploy web app
- **Cloud Messaging** - Push notifications
- **Extensions** - Pre-built extensions

---

## 📝 Environment Variables

Add to `.env` file:

```env
FIREBASE_API_KEY=AIzaSyDOYDvy56l4A0dYuJxV5qZr3Rprb0GRWRE
FIREBASE_AUTH_DOMAIN=coffee-management-a4895.firebaseapp.com
FIREBASE_PROJECT_ID=coffee-management-a4895
FIREBASE_STORAGE_BUCKET=coffee-management-a4895.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=85511026758
FIREBASE_APP_ID=1:85511026758:web:7054f6446ec59754927247
FIREBASE_MEASUREMENT_ID=G-8W2TF09Q8N
```

---

## 🔗 Useful Links

- [Firebase Console](https://console.firebase.google.com/)
- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Cloud Storage Docs](https://firebase.google.com/docs/storage)
- [Firebase Admin SDK](https://firebase.google.com/docs/database/admin/start)

---

## ⚠️ Important Notes

1. **Service Account**: Keep `firebase-service-account.json` **private**
2. **API Key**: The API key in config is meant to be public (frontend config)
3. **Security Rules**: Review and set appropriate rules in Firebase Console
4. **No Real Credit Card**: Firebase free tier doesn't require valid payment method

---

## 🐛 Troubleshooting

### Error: "Cannot find module firebase-service-account.json"
**Solution**: Download service account from Firebase Console and add to project root

### Error: "Permission denied" in Firestore
**Solution**: Check security rules in Firebase Console → Firestore → Rules tab

### Error: CORS issues
**Solution**: Add your domain to Firebase Console → Authentication → Authorized domains

### Firebase not initializing
**Solution**: Ensure config file is loaded before using Firebase services

---

## 🎯 Next Steps

1. ✅ Download Firebase Service Account key
2. ✅ Set environment variables in `.env`
3. ✅ Set Firestore security rules
4. ✅ Implement user authentication
5. ✅ Create Firestore collections for: users, products, orders
6. ✅ Test backend and frontend Firebase integration

---

**Happy coding with Firebase! 🔥**
