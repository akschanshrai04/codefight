import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";


const firebaseConfig = {
  apiKey: "AIzaSyDBrnQo-QHY7mGWVCi2foB9u5QFOp4XAl4",
  authDomain: "asymmetric-moon-446511-g6.firebaseapp.com",
  projectId: "asymmetric-moon-446511-g6",
  storageBucket: "asymmetric-moon-446511-g6.firebasestorage.app",
  messagingSenderId: "183196555453",
  appId: "1:183196555453:web:86ad2011c18e240911bfd4",
  measurementId: "G-VXVLTNWTKV"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(); 

export { auth };