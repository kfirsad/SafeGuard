import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// const firebaseConfig = {

//   apiKey: "AIzaSyDd8xBzvxbt6IcE7gx2MvzTu0q__qvaD8g",

//   authDomain: "help-bridge-921b0.firebaseapp.com",

//   projectId: "help-bridge-921b0",

//   storageBucket: "help-bridge-921b0.firebasestorage.app",

//   messagingSenderId: "384034194378",

//   appId: "1:384034194378:web:458eb451cfcf09c9f0c533",

//   measurementId: "G-4X4HY2MYKF"

// };

const firebaseConfig = {

  apiKey: "AIzaSyC5HKvaDtCrTf_w_OB0lEHeShdVfVAIg6I",

  authDomain: "cityshobapp-v2.firebaseapp.com",

  projectId: "cityshobapp-v2",

  storageBucket: "cityshobapp-v2.firebasestorage.app",

  messagingSenderId: "800106331910",

  appId: "1:800106331910:web:ad0c9b841b5f420cdb6887",

  measurementId: "G-SHXJ88GTE2"

};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
