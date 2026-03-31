## ✅ Firebase Setup Checklist

Use this checklist to track your Firebase integration progress:

### Phase 1: Firebase Console Setup
- [ ] Log in to [Firebase Console](https://console.firebase.google.com/)
- [ ] Select project: **coffee-management-a4895**
- [ ] Enable **Authentication** service
  - [ ] Email/Password provider enabled
  - [ ] Add authorized domains (your website URL)
- [ ] Enable **Cloud Firestore** database
  - [ ] Select **production mode** for now
  - [ ] Select region: **asia-southeast1** (closest to Vietnam)
- [ ] Enable **Cloud Storage**
  - [ ] Create storage bucket
  - [ ] Set security rules for uploads
- [ ] Enable **Google Analytics** (optional)

### Phase 2: Download Credentials
- [ ] Go to **Settings** (⚙️) in Firebase Console
- [ ] Open **Service Accounts** tab
- [ ] Click **Generate New Private Key**
- [ ] Save as `firebase-service-account.json` in project root
- [ ] Open `.gitignore` and add:
  ```
  firebase-service-account.json
  .env
  node_modules/
  ```
- [ ] Commit `.gitignore` changes

### Phase 3: Project Setup
- [ ] Run `npm install` to install dependencies
- [ ] Create `.env` file in project root with:
  ```env
  FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
  FIREBASE_PROJECT_ID=coffee-management-a4895
  ```
- [ ] Verify files exist:
  - [ ] `js/firebase-config.js`
  - [ ] `public/js/firebase-client.js`
  - [ ] `routes/firebase-auth-example.js`
  - [ ] `FIREBASE_SETUP.md`
  - [ ] `FIREBASE_EXAMPLES.js`

### Phase 4: Backend Integration
- [ ] Update `server.js` with Firebase Admin SDK:
  ```javascript
  const admin = require('firebase-admin');
  const serviceAccount = require('./firebase-service-account.json');
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'coffee-management-a4895'
  });
  ```
- [ ] Update `routes/auth.js` to use Firebase Auth
  - [ ] Move register logic from MySQL to Firebase
  - [ ] Move login logic from MySQL to Firebase
  - [ ] Remove MySQL user creation code
- [ ] Test authentication routes:
  - [ ] Sign up with email/password ✓
  - [ ] Sign in with email/password ✓
  - [ ] Sign out ✓
  - [ ] Check Firestore console to see new users

### Phase 5: Firestore Database Setup
- [ ] Review schema in `FIREBASE_SETUP.md`
- [ ] Create collections in Firestore:
  - [ ] `users` - User profiles
  - [ ] `products` - Product catalog
  - [ ] `orders` - Customer orders
  - [ ] `wallets` - User wallets
  - [ ] `transactions` - Transaction logs
- [ ] Set security rules (copy from `FIREBASE_SETUP.md`):
  - [ ] Go to **Firestore** → **Rules** tab
  - [ ] Replace existing rules with provided rules
  - [ ] Publish rules
- [ ] Test Firestore permissions:
  - [ ] Auth user can read their own data
  - [ ] Users can only see own orders
  - [ ] Only admin can modify products

### Phase 6: Migrate Products (Optional)
- [ ] Review existing MySQL products
- [ ] Choose migration method:
  - [ ] **Manual**: Add products via Firebase Console
  - [ ] **Script**: Write Node.js script to migrate from MySQL
- [ ] Verify products appear in Firestore
- [ ] Update `routes/products.js` to read from Firestore:
  ```javascript
  const db = admin.firestore();
  const products = await db.collection('products').get();
  ```

### Phase 7: Cloud Storage Setup
- [ ] Go to **Cloud Storage** in Firebase Console
- [ ] Upload test image file
- [ ] Test upload from application:
  - [ ] Product image upload works
  - [ ] User avatar upload works
- [ ] Verify security rules prevent:
  - [ ] Unauthorized file access
  - [ ] Large file uploads (set max size)

### Phase 8: Frontend Integration
- [ ] Include Firebase client in views:
  ```html
  <script src="/js/firebase-client.js"></script>
  ```
- [ ] Update login/register forms to use Firebase:
  - [ ] Check email availability before signup
  - [ ] Show real-time validation errors
- [ ] Set up auth state listener:
  ```javascript
  import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js';
  
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // User logged in - update UI
    } else {
      // User logged out - redirect to login
    }
  });
  ```

### Phase 9: Testing
- [ ] Test authentication flow:
  - [ ] Register new user ✓
  - [ ] Verify user in Firestore
  - [ ] Login with valid credentials ✓
  - [ ] Login with invalid credentials (should fail) ✓
  - [ ] Logout ✓
  
- [ ] Test product operations:
  - [ ] View products ✓
  - [ ] Add new product (admin) ✓
  - [ ] Update product ✓
  - [ ] Delete product ✓
  
- [ ] Test orders:
  - [ ] Create order ✓
  - [ ] View user's orders ✓
  - [ ] Update order status ✓
  - [ ] Delete order ✓
  
- [ ] Test wallet:
  - [ ] Deposit money ✓
  - [ ] Withdraw money ✓
  - [ ] View transaction history ✓

### Phase 10: Security Hardening
- [ ] Enable **Multi-factor Authentication** (MFA) in Firebase Console
- [ ] Enable **Google Cloud Armor** for DDoS protection
- [ ] Set up **Firestore backups** (automatic daily)
- [ ] Monitor **Firebase Usage** quota
- [ ] Review **Firebase Security Advisories**
- [ ] Enable **Cloud Audit Logs** for compliance
- [ ] Test security rules thoroughly:
  - [ ] Unauthorized access blocked ✓
  - [ ] Users can't access others' data ✓
  - [ ] Admins have full access ✓

### Phase 11: Monitoring & Analytics
- [ ] Set up **Firebase Console Monitoring**
  - [ ] View real-time user count
  - [ ] Monitor authentication stats
  - [ ] Check database performance
  - [ ] Review error rates
- [ ] Configure **Google Analytics events**:
  - [ ] Track user signup
  - [ ] Track user login
  - [ ] Track product views
  - [ ] Track orders created
- [ ] Set up **Alerts** for issues:
  - [ ] High error rate
  - [ ] High latency
  - [ ] Quota exceeded

### Phase 12: Production Deployment
- [ ] Test in staging environment first
- [ ] Review all security rules one final time
- [ ] Set up **Firebase Hosting** (optional):
  - [ ] Install Firebase tools: `npm install -g firebase-tools`
  - [ ] Run `firebase init`
  - [ ] Deploy with `firebase deploy`
- [ ] Update authorized domains in Firebase Console
- [ ] Configure CORS if using separate frontend domain
- [ ] Enable **Firestore backups** (automated daily)
- [ ] Test production environment completely
- [ ] Set up **uptime monitoring** and alerts

### Phase 13: Migration Cleanup (After Verified)
- [ ] *Only after testing is complete and successful:*
- [ ] [ ] Backup MySQL database
- [ ] [ ] Remove MySQL user queries from auth.js
- [ ] [ ] Remove/archive old MySQL routes
- [ ] [ ] Delete unused MySQL database queries
- [ ] [ ] Update documentation to reference Firestore instead

---

## 📊 Progress Summary

**Completed** ✅
- Firebase config created
- Client SDK initialized
- Example routes provided
- Documentation written
- Security rules documented

**Pending** ⏳
- Download service account key
- Enable Firebase services in console
- Migrate data from MySQL to Firestore
- Test authentication flow
- Deploy to production

**Blocked** 🚫
- Waiting for service account download

---

## 🆘 Troubleshooting

### "firebase-service-account.json not found"
**Solution**: Download from Firebase Console → Settings → Service Accounts → Generate New Private Key

### "Admin SDK not initialized"
**Solution**: Add initialization code to `server.js`

### "Firestore permission denied"
**Solution**: Check security rules in Firebase Console → Firestore → Rules

### "Authentication failing"
**Solution**: Verify Email/Password provider is enabled in Firebase Console → Authentication

---

## 📝 Notes

Use this section to track what you've completed:

```
[Date] [Action Completed]
________________________________________
________________________________________
________________________________________
________________________________________
```

---

## 🎯 Next Steps

1. **Right now**: Download firebase-service-account.json
2. **Next**: Enable Firebase services in console
3. **Then**: Update server.js with admin SDK
4. **After**: Test authentication flow
5. **Finally**: Migrate to production

---

**Good luck with Firebase! 🔥**
