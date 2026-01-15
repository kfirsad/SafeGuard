// src/lib/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore,doc,setDoc,getDoc,updateDoc,arrayUnion,addDoc, serverTimestamp,collection} from "firebase/firestore"; // Database
import { getAuth } from "firebase/auth";           // Authentication
import { getStorage } from "firebase/storage";     // File Storage
import { create } from "domain";
import { get } from "http";
import { add } from "date-fns";

// Your NEW configuration
const firebaseConfig = {
  apiKey: "VITE_FIREBASE_API_KEY_PLACEHOLDER",
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
export const userDB=getFirestore(app,"users");
export const auth = getAuth(app);
export const storage = getStorage(app);

function normalizePhoneNumber(phone) {
  let cleaned = phone.replace(/\D/g, ''); 
  
  if (cleaned.startsWith('972')) {
    cleaned = '0' + cleaned.substring(3);
  }
  return cleaned;
}
export async function addUser(phoneNumber){
  const cleanedPhone = normalizePhoneNumber(phoneNumber);
  try{
    await setDoc(doc(userDB, "users", cleanedPhone), 
    { 
      phone: cleanedPhone,
      createdAt: new Date(),
      firstName:"",
      lastName:"",
      mainAddress:"",
      knownAllergies:[],
      medicalConditions:[],
      emergencyContacts:[],
      Events:[],
      lastActiveEvent:null,
      isOnActiveEvent: false,
      isVerified: false
     });
  }catch(e){
    console.error("Error adding document: ", e);
  }
}
export async function findUser(phoneNumber){
  const cleanedPhone = normalizePhoneNumber(phoneNumber);
  const docRef = doc(userDB, "users", cleanedPhone);
  const docSnap = await getDoc(docRef);
  return docSnap.exists();
}

// export async function addEmergencyEvent(phoneNumber,eventData){
//   const cleanedPhone = normalizePhoneNumber(phoneNumber);
//   const userRef = doc(userDB, "report", cleanedPhone);
//   try{
//     await updateDoc(userRef, {
//       Events:arrayUnion(eventData.id),
//       lastActiveEvent: eventData.id,
//       isOnActiveEvent: true
//     });
//     console.log("event successfully updated!");
//   }catch(e){
//     console.error("Error updating document: ", e);
//   }
// }

export async function createReport(eventId, phoneNumber, eventData) {
  const cleanedPhone = normalizePhoneNumber(phoneNumber);

  // create event doc
  await setDoc(doc(userDB, "events", eventId), {
    ...eventData,
    userId: cleanedPhone,
    createdAt: serverTimestamp(),
  });

  // create report doc
  await setDoc(doc(userDB, "reports", eventId), {
    userId: cleanedPhone,
    status: "active",
    type: eventData.type,
    severity: eventData.severity,
    location: eventData.location,
    createdAt: serverTimestamp(),
  });

  await addDoc(collection(userDB, "reports", eventId, "messages"), {
    text: "Emergency alert received. A responder will join shortly.",
    sender: "system",
    type: "text",
    createdAt: serverTimestamp(),
  });

  await addDoc(collection(userDB, "events", eventId, "messages"), {
    text: "Emergency alert received. A responder will join shortly.",
    sender: "system",
    type: "text",
    createdAt: serverTimestamp(),
  });
}


export async function linkEventToUser(phoneNumber, eventId) {
  const cleanedPhone = normalizePhoneNumber(phoneNumber);

  await setDoc(
    doc(userDB, "users", cleanedPhone),
    {
      Events: arrayUnion(eventId),
      lastActiveEvent: eventId,
      isOnActiveEvent: true,
    },
    { merge: true }
  );
}
