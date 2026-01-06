// src/lib/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore,doc,setDoc,getDoc } from "firebase/firestore"; // Database
import { getAuth } from "firebase/auth";           // Authentication
import { getStorage } from "firebase/storage";     // File Storage
import { create } from "domain";

// Your NEW configuration
const firebaseConfig = {
  apiKey: "AIzaSyC5HKvaDtCrTf_w_OB0lEHeShdVfVAIg6I",
  authDomain: "cityshobapp-v2.firebaseapp.com",
  projectId: "cityshobapp-v2",
  storageBucket: "cityshobapp-v2.firebasestorage.app",
  messagingSenderId: "800106331910",
  appId: "1:800106331910:web:ad0c9b841b5f420cdb6887",
  measurementId: "G-SHXJ88GTE2"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and Export Services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export async function addUser(phoneNumber){
  const cleanedPhone = phoneNumber.replace(/\D/g, '');
  try{
    await setDoc(doc(db, "users", cleanedPhone), 
    { 
      phone: cleanedPhone,
      createdAt: new Date(),
      firstName:"",
      lastName:"",
      mainAdress:"",
      knownAlergies:[],
      medicalConditions:[],
      emergencyContacts:[],
      isVarified: false
     });
  }catch(e){
    console.error("Error adding document: ", e);
  }
}
export async function findUser(phoneNumber){
  const cleanedPhone = phoneNumber.replace(/\D/g, '');
  const docRef = doc(db, "users", cleanedPhone);
  const docSnap = await getDoc(docRef);
  return docSnap.exists();
}