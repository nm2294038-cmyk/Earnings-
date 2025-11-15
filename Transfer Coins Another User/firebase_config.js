// --- FIREBASE CONFIGURATION AND INITIALIZATION ---
// NOTE: Is file mein sirf Firebase ko initialize kiya ja raha hai.

const firebaseConfig = {
    // Apni asal keys yahan dalen
    apiKey: "AIzaSyDNYv9SNUjMAHlaPzfovyYefoBNDgx4Gd4", 
    authDomain: "traffic-exchange-62a58.firebaseapp.com",
    projectId: "traffic-exchange-62a58",
    storageBucket: "traffic-exchange-62a58.appspot.com",
    messagingSenderId: "474999317287",
    appId: "1:474999317287:web:8e28a2f5f1a959d8ce3f02",
    measurementId: "G-HJQ46RQNZS"
};

firebase.initializeApp(firebaseConfig);

// Global Variables for the app to use
const auth = firebase.auth();
const db = firebase.firestore();
