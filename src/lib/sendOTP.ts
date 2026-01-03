import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {

  apiKey: "AIzaSyDd8xBzvxbt6IcE7gx2MvzTu0q__qvaD8g",

  authDomain: "help-bridge-921b0.firebaseapp.com",

  projectId: "help-bridge-921b0",

  storageBucket: "help-bridge-921b0.firebasestorage.app",

  messagingSenderId: "384034194378",

  appId: "1:384034194378:web:458eb451cfcf09c9f0c533",

  measurementId: "G-4X4HY2MYKF"

};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
