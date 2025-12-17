// firebase_config.js

const firebaseConfig = {
    apiKey: "AIzaSyDxCmpsdWUlsOw1CWTLe5qqG_oOnumIyfQ", 
    authDomain: "game-45533.firebaseapp.com",
    databaseURL: "https://game-45533-default-rtdb.firebaseio.com",
    projectId: "game-45533",
    storageBucket: "game-45533.firebasestorage.app",
    messagingSenderId: "34264478697",
    appId: "1:34264478697:web:f6bcd90fed40f720ae9178",
    measurementId: "G-N73RXH0ZX8"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
