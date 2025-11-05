import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";

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
const storedUser = await AsyncStorage.getItem("user");
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
if (user) await AsyncStorage.setItem("user", JSON.stringify(user));
else await AsyncStorage.removeItem("user");
} catch (error) {
console.error("Error al guardar usuario:", error);
}
};
if (!loading) persistUser();
}, [user, loading]);

const login = async (userData: User) => {
setUser(userData);
await AsyncStorage.setItem("user", JSON.stringify(userData));
};

const logout = async () => {
setUser(null);
await AsyncStorage.removeItem("user");
};

return (
<AuthContext.Provider value={{ user, loading, setUser, logout, login }}>
{children}
</AuthContext.Provider>
);
}
