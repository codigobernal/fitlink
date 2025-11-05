import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";

// AsyncStorage optional loader with in-memory fallback
type StorageLike = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

let Storage: StorageLike;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const AS = require("@react-native-async-storage/async-storage").default as StorageLike;
  Storage = AS;
} catch (_err) {
  const mem = new Map<string, string>();
  Storage = {
    async getItem(key) { return mem.has(key) ? mem.get(key)! : null; },
    async setItem(key, value) { mem.set(key, value); },
    async removeItem(key) { mem.delete(key); },
  };
}

interface User {
uid: string;
username: string;
email: string;
}

interface AuthContextType {
user: User | null;
loading: boolean;
setUser: React.Dispatch<React.SetStateAction<User | null>>;
logout: () => Promise<void>;
login: (userData: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
const context = useContext(AuthContext);
if (!context) throw new Error("useAuth debe usarse dentro de un AuthProvider");
return context;
};

export function AuthProvider({ children }: { children: ReactNode }) {
const [user, setUser] = useState<User | null>(null);
const [loading, setLoading] = useState(true);

// Cargar usuario al iniciar
useEffect(() => {
const loadUserFromStorage = async () => {
  try {
const storedUser = await Storage.getItem("user");
if (storedUser) setUser(JSON.parse(storedUser));
  } catch (error) {
console.error("Error al cargar usuario:", error);
  } finally {
setLoading(false);
  }
};
loadUserFromStorage();
}, []);

// Guardar usuario cada vez que cambie
useEffect(() => {
const persistUser = async () => {
  try {
if (user) await Storage.setItem("user", JSON.stringify(user));
else await Storage.removeItem("user");
  } catch (error) {
console.error("Error al guardar usuario:", error);
  }
};
if (!loading) persistUser();
}, [user, loading]);

const login = async (userData: User) => {
setUser(userData);
await Storage.setItem("user", JSON.stringify(userData));
};

const logout = async () => {
setUser(null);
await Storage.removeItem("user");
};

return (
<AuthContext.Provider value={{ user, loading, setUser, logout, login }}>
{children}
</AuthContext.Provider>
);
}
