import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDbtq3AgwgHaw4j1BEVFhTHm85jmi7sqyQ",
  authDomain: "examinerid-8f39f.firebaseapp.com",
  projectId: "examinerid-8f39f",
  storageBucket: "examinerid-8f39f.firebasestorage.app",
  messagingSenderId: "323767674075",
  appId: "1:323767674075:web:7d8ffa3869b3b4866d98fe",
  measurementId: "G-JGL7WT6DVF"
};

// Initialize Firebase
// Using compat app to support compat auth while allowing modular firestore
const app = firebase.initializeApp(firebaseConfig);

// Initialize Auth (Compat)
export const auth = app.auth();

// Initialize Firestore (Modular)
// Casting app to any to satisfy type checker if there's a mismatch between compat App and modular FirebaseApp
export const db = getFirestore(app as any);