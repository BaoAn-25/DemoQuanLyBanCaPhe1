// Firebase initialization for client-side (browser)
// This file should be included in your EJS templates using a script tag

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDOYDvy56l4A0dYuJxV5qZr3Rprb0GRWRE",
    authDomain: "coffee-management-a4895.firebaseapp.com",
    projectId: "coffee-management-a4895",
    storageBucket: "coffee-management-a4895.firebasestorage.app",
    messagingSenderId: "85511026758",
    appId: "1:85511026758:web:7054f6446ec59754927247",
    measurementId: "G-8W2TF09Q8N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Monitor authentication state
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User logged in:", user.email);
        // User is signed in
    } else {
        console.log("User logged out");
        // User is signed out
    }
});

// Export for use in other modules (if using bundler)
export { app, auth, db };
