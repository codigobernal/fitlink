// Configuración para la conexión a Firebase
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

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
const auth = getAuth(app);

export { db, auth };
