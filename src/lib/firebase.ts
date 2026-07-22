// src/lib/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore,doc,setDoc,getDoc,updateDoc,arrayUnion,addDoc, serverTimestamp,collection,runTransaction} from "firebase/firestore"; // Database
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";           // Authentication
import { getStorage } from "firebase/storage";     // File Storage
import { create } from "domain";
import { get } from "http";
import { add } from "date-fns";

// Your NEW configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ""
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and Export Services
export const db = getFirestore(app);
export const userDB=getFirestore(app,"users");
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Auth persistence error:", error);
});
export const storage = getStorage(app);

export async function getNextEventId() {
  const counterRef = doc(userDB, "counters", "events");
  return runTransaction(userDB, async (transaction) => {
    const counterSnap = await transaction.get(counterRef);
    const current = counterSnap.exists() ? counterSnap.data().current : 0;
    const next = Number(current) + 1;
    transaction.set(counterRef, { current: next }, { merge: true });
    return next.toString();
  });
}

export function normalizePhoneNumber(phone) {
  if (typeof phone !== "string") {
    return "";
  }
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

export async function createReport(eventId, phoneNumber, eventData) {
  const cleanedPhone = normalizePhoneNumber(phoneNumber);

  // create event doc
  await setDoc(doc(userDB, "events", eventId), {
    ...eventData,
    userId: cleanedPhone,
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
