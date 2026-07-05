import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDMwz-Gsd_7ivLHkS2NITG3LErhTV6S7sY",
  authDomain: "aesthetic-tech-store.firebaseapp.com",
  projectId: "aesthetic-tech-store",
  storageBucket: "aesthetic-tech-store.firebasestorage.app",
  messagingSenderId: "1048206524443",
  appId: "1:1048206524443:web:d6ea781ceeba577b0db8be",
  measurementId: "G-1PR4Z69QX1"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, googleProvider };
