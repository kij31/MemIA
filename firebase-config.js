// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDv0R9bHD_7xoFbXPW-zHq8eyBbBsZCNbQ",
  authDomain: "soussoumemia.firebaseapp.com",
  projectId: "soussoumemia",
  storageBucket: "soussoumemia.firebasestorage.app",
  messagingSenderId: "1034660174850",
  appId: "1:1034660174850:web:bd8c4454e9793383c95b1b"
};

// Initialiser Firebase
firebase.initializeApp(firebaseConfig);

// Initialiser les services
const db = firebase.firestore();
const storage = firebase.storage();

console.log('🔥 Firebase initialisé avec succès!');
