
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";


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
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// Export services for use in other files
export { app, analytics, auth, db, firebaseConfig };