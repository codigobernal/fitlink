import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import AuthBackground from '@/components/auth/AuthBackground';
import { auth, db } from '../../firebaseConfig';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { fonts } from '../../constants/fonts';

export default function Register() {
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (value: string): string | null => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? null : 'Ingresa un correo electrónico válido';
  };

  const validatePassword = (value: string): string | null => {
    if (value.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
    if (!/[A-Z]/.test(value)) return 'La contraseña debe incluir al menos una letra mayúscula';
    if (!/[a-z]/.test(value)) return 'La contraseña debe incluir al menos una letra minúscula';
    if (!/[0-9]/.test(value)) return 'La contraseña debe incluir al menos un número';
    if (!/[!@#$%^&*]/.test(value)) return 'La contraseña debe incluir al menos un carácter especial (!@#$%^&*)';
    return null;
  };

  const onSubmit = async () => {
    if (!username.trim()) { setError('Ingresa un usuario'); return; }
    const emailErr = validateEmail(email.trim());
    if (emailErr) { setError(emailErr); return; }
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return; }
    const passErr = validatePassword(password);
    if (passErr) { setError(passErr); return; }

    try {
      setLoading(true);
      setError(null);
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(cred.user, { displayName: username.trim() });
      await set(ref(db, `users/${cred.user.uid}`), {
        username: username.trim(),
        email: cred.user.email,
        createdAt: Date.now(),
        profileIcon: { name: 'person', color: '#A6FF00' },
        theme: { accent: '#A6FF00' },
      });
      router.replace('/(auth)/connect');
    } catch (e: any) {
      const msg = mapFirebaseError(e?.code) || 'Ocurrió un error al registrar';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <AuthBackground>
        <ScrollView contentContainerStyle={[styles.scrollCentered, { paddingBottom: 24 + insets.bottom }]}> 
          <Text style={styles.title}>Crea tu cuenta</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Usuario:</Text>
            <TextInput value={username} onChangeText={setUsername} placeholder="Tu usuario" placeholderTextColor="#9E9EA0" style={styles.input} />
            <Text style={[styles.label, { marginTop: 10 }]}>Correo electrónico:</Text>
            <TextInput value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="correo@ejemplo.com" placeholderTextColor="#9E9EA0" style={styles.input} />
            <Text style={[styles.label, { marginTop: 10 }]}>Contraseña:</Text>
            <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="********" placeholderTextColor="#9E9EA0" style={styles.input} />
            <Text style={[styles.label, { marginTop: 10 }]}>Confirmar contraseña:</Text>
            <TextInput value={confirm} onChangeText={setConfirm} secureTextEntry placeholder="********" placeholderTextColor="#9E9EA0" style={styles.input} />
            <Pressable onPress={() => router.push('/(auth)/login')} style={{ alignSelf: 'flex-end', marginTop: 8 }}>
              <Text style={styles.link}>¿Ya tienes cuenta? Inicia sesión</Text>
            </Pressable>
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable disabled={loading} onPress={onSubmit} style={({ pressed }) => [styles.primaryBtn, { marginTop: 12, opacity: loading ? 0.5 : pressed ? 0.9 : 1 }]}>
            <Text style={styles.primaryText}>Continuar</Text>
          </Pressable>
        </ScrollView>
      </AuthBackground>
    </SafeAreaView>
  );
}

function mapFirebaseError(code?: string): string | null {
  switch (code) {
    case 'auth/invalid-email': return 'Correo electrónico inválido';
    case 'auth/email-already-in-use': return 'El correo ya está en uso';
    case 'auth/weak-password': return 'La contraseña es muy débil';
    default: return null;
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'black' },
  scrollCentered: { padding: 20, paddingTop: 24, flexGrow: 1, justifyContent: 'center' },
  title: { color: 'white', fontFamily: fonts.semibold, fontSize: 32, marginTop: 10, marginBottom: 10 },
  card: { backgroundColor: '#1C1C1E', borderRadius: 16, padding: 16 },
  label: { color: 'white', fontFamily: fonts.semibold, marginBottom: 10 },
  input: { borderWidth: 1, borderColor: 'white', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 10, color: 'white', fontFamily: fonts.regular },
  primaryBtn: { backgroundColor: '#A6FF00', height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: 'black', fontFamily: fonts.semibold, fontSize: 16 },
  link: { color: 'white', fontFamily: fonts.semibold, fontSize: 11 },
  error: { color: '#FF6B6B', marginTop: 8, fontFamily: fonts.regular },
});

