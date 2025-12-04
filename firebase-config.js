// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyD37uQo84IEC0Gr6g5w6pUvfzWjB0F_Iz0",
    authDomain: "match-result-5cd9e.firebaseapp.com",
    databaseURL: "https://match-result-5cd9e-default-rtdb.firebaseio.com",
    projectId: "match-result-5cd9e",
    storageBucket: "match-result-5cd9e.firebasestorage.app",
    messagingSenderId: "599821826768",
    appId: "1:599821826768:web:c2e1164051cb3987c2bcd5",
    measurementId: "G-SPQDP73EGW"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
