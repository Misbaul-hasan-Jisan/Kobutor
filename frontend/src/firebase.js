// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBqZXerJpxxtkzfGUQJHAKzKOowTHwQbvE",
  authDomain: "shopper-pro1.firebaseapp.com",
  projectId: "shopper-pro1",
  storageBucket: "shopper-pro1.firebasestorage.app",
  messagingSenderId: "749122879504",
  appId: "1:749122879504:web:fc691085e916d35ae9ca95",
  measurementId: "G-QBL8802LXV"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Optional: Configure Google provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Export the signInWithPopup function
export { signInWithPopup };