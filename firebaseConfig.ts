import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// @ts-ignore - The types might be missing but the export exists at runtime
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyADdvJb7OUVdf6YJWRK_Bst0i_jZOfnxSQ",
  authDomain: "teen-patti-34955.firebaseapp.com",
  projectId: "teen-patti-34955",
  storageBucket: "teen-patti-34955.firebasestorage.app",
  messagingSenderId: "410977110543",
  appId: "1:410977110543:web:bb4e87752b6cbdce7f317a",
  measurementId: "G-L7CXMN6YQL"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
