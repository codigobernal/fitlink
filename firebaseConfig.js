import { initializeApp } from "firebase/app";
import { getAuth, getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";


const firebaseConfig = {
  apiKey: "AIzaSyDQuDInfRuFi8Hw1ZuSW71N7HnJrQn47xo",
  authDomain: "fitlink9a.firebaseapp.com",
  databaseURL: "https://fitlink9a-default-rtdb.firebaseio.com",
  projectId: "fitlink9a",
  storageBucket: "fitlink9a.firebasestorage.app",
  messagingSenderId: "272620836039",
  appId: "1:272620836039:web:e112d3774df77019989ae2",
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app); 

let auth; // Declaración simple de variable (permite que sea 'any' en JS)

try {
  // Usar persistencia nativa si AsyncStorage está disponible
  const ReactNativeAsyncStorage = require('@react-native-async-storage/async-storage').default;
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
} catch (e) {
  auth = getAuth(app);
  console.error("Error al inicializar Auth con persistencia nativa:", e);
}

// Exportamos auth y db
export { auth, db };