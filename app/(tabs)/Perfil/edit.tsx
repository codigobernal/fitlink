import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ref, update } from "firebase/database"; // 👈 en lugar de firestore
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "../../../context/AuthContext";
import { db } from "../../../firebaseConfig"; // 👈 tu Realtime DB

export default function EditProfile() {
  const { user, loading, setUser } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/(auth)/login");
    }
  }, [user, loading]);

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setEmail(user.email);
    }
  }, [user]);

  // 📝 Guardar cambios en Realtime Database
  const handleUpdateProfile = async () => {
    if (!user) return;

    if (!username.trim() || !email.trim()) {
      Alert.alert("Campos incompletos", "Por favor llena todos los campos.");
      return;
    }

    try {
      setSaving(true);

      // 👇 Actualiza el nodo del usuario en la RTDB
      const userRef = ref(db, `users/${user.uid}`);
      await update(userRef, {
        username,
        email,
      });

      // 🔄 Actualiza el contexto local
      setUser((prev) =>
        prev ? { ...prev, username, email } : { uid: user.uid, username, email }
      );

      Alert.alert("Éxito", "Tu perfil ha sido actualizado.");
      router.back();
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      Alert.alert("Error", "No se pudo actualizar tu perfil.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: 24 + insets.bottom }]}>
        <View style={styles.headerRow}>
          <Pressable hitSlop={12} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.h1}>
            <Text style={styles.boldText}>Perfil </Text>
          </Text>
        </View>

        <View style={[styles.card, { alignItems: "center" }]}>
          <View style={styles.avatarWrap}>
            <Image
              source={{ uri: "https://placehold.co/100x100" }}
              style={styles.avatar}
            />
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={14} color="#FFFFFF" />
            </View>
          </View>

          <View style={styles.fieldBlock}>
            <Text style={[styles.label, { marginTop: 12 }]}>Usuario</Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="Tu usuario"
              placeholderTextColor="#9E9EA0"
              style={styles.input}
            />
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Correo electrónico:</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="correo@ejemplo.com"
              placeholderTextColor="#9E9EA0"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.primaryBtn,
              { opacity: pressed || saving ? 0.8 : 1 },
            ]}
            onPress={handleUpdateProfile}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#111" />
            ) : (
              <Text style={styles.primaryText}>Confirmar</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "black" },
  scroll: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 24 },
<<<<<<< Updated upstream
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  h1: { color: 'white', fontSize: 32, fontFamily: 'SFProRounded-Semibold', marginTop: 10, marginBottom: 10 },
  card: { backgroundColor: '#1C1C1E', borderRadius: 18, padding: 20 },
  avatarWrap: { width: 104, height: 104, borderRadius: 52, marginBottom: 16, position: 'relative' },
  avatar: { width: '100%', height: '100%', borderRadius: 52, backgroundColor: '#FFFFFF' },
=======
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  h1: {
    color: "white",
    fontSize: 32,
    fontFamily: "SFProRounded-Semibold",
    marginTop: 10,
    marginBottom: 10,
  },
  card: { backgroundColor: "#1C1C1E", borderRadius: 18, padding: 20 },
  avatarWrap: {
    width: 104,
    height: 104,
    borderRadius: 52,
    marginBottom: 16,
    position: "relative",
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 52,
    backgroundColor: "#FFFFFF",
  },
>>>>>>> Stashed changes
  cameraBadge: {
    position: "absolute",
    right: 6,
    bottom: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#6B7280",
    alignItems: "center",
    justifyContent: "center",
  },
  fieldBlock: { alignSelf: "stretch", marginBottom: 14 },
  label: {
    color: "white",
    fontFamily: "SFProRounded-Semibold",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "white",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "white",
    fontFamily: "SFProRounded-Regular",
  },
  primaryBtn: {
    marginTop: 8,
    alignSelf: "stretch",
    height: 46,
    borderRadius: 18,
    backgroundColor: "#A6FF00",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: {
    color: "#111",
    fontFamily: "SFProRounded-Semibold",
    fontSize: 16,
  },
  boldText: { fontWeight: "bold" },
});


