import AuthBackground from '@/components/auth/AuthBackground';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import React, { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { auth, db } from '../../firebaseConfig';
 
export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (email: string): string | null => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Ingresa un correo electrónico válido';
    }
    return null;
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'La contraseña debe tener al menos 8 caracteres';
    }
    if (!/[A-Z]/.test(password)) {
      return 'La contraseña debe incluir al menos una letra mayúscula';
    }
    if (!/[a-z]/.test(password)) {
      return 'La contraseña debe incluir al menos una letra minúscula';
    }
    if (!/[0-9]/.test(password)) {
      return 'La contraseña debe incluir al menos un número';
    }

    if (!/[!@#$%^&*]/.test(password)) {
      return 'La contraseña debe incluir al menos un carácter especial (!@#$%^&*)';
    }
    return null;
  };
 
  const onSubmit = async () => {
    if (!username.trim()) {
      setError('Ingresa un usuario');
      return;
    }

    const emailError = validateEmail(email.trim());
    if (emailError) {
      setError(emailError);
    }

    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;

    }
 
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
 
    try {
      setLoading(true);
      setError(null);
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(cred.user, { displayName: username.trim() });
      await set(ref(db, `users/${cred.user.uid}`), {
        username: username.trim(),
        email: cred.user.email,
        createdAt: Date.now(),
      });
      router.replace('/photo');
    } catch (e: any) {
    const firebaseErrorMessage = getFirebaseErrorMessage(e?.code);
    setError(firebaseErrorMessage || 'Ocurrió un error al registrar');
  } finally {
    setLoading(false);
  }
};

const getFirebaseErrorMessage = (errorCode: string): string | null => {
  switch (errorCode) {
    case 'auth/invalid-email':
      return 'Correo electrónico inválido';
    case 'auth/email-already-in-use':
      return 'El correo electrónico ya está en uso';
    case 'auth/weak-password':
      return 'La contraseña es muy débil';
    default:
      return null;
  }
};
 
  return (
        <SafeAreaView style={styles.safe}>
        <StatusBar style="light" />
        <AuthBackground>
        <ScrollView contentContainerStyle={styles.scrollCentered}>
        <Text style={styles.title}>
        <Text style={styles.boldText}>Crear tu cuenta</Text>
        </Text>
        <View style={styles.card}>
        <Text style={styles.label}>Usuario:</Text>
        <TextInput 
          value={username}
          onChangeText={setUsername}
          placeholder="Tu usuario"
          placeholderTextColor="#9E9EA0"
          style={styles.input}
          />
        <Text style={[styles.label, { marginTop: 10 }]}>Correo electrónico:</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="correo@ejemplo.com"
          placeholderTextColor="#9E9EA0"
          style={styles.input}
        />
        <Text style={[styles.label, { marginTop: 10 }]}>Contraseña:</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
          placeholderTextColor="#9E9EA0"
          style={styles.input}
          />
        <Text style={[styles.label, { marginTop: 10 }]}>Confirmar contraseña:</Text>
        <TextInput
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          placeholder="••••••••"
          placeholderTextColor="#9E9EA0"
          style={styles.input}
          />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable onPress={() => router.push('/(auth)/login')} style={{ alignSelf: 'flex-end', marginTop: 8 }}>
          
        <Text style={styles.link}>¿Ya tienes cuenta? Inicia sesión</Text>
        </Pressable>
        </View>
        <Pressable
          disabled={loading}
          onPress={onSubmit}
          style={({ pressed }) => [
          styles.primaryBtn,
          {opacity: loading ? 0.5 : pressed ? 0.9 : 1 },
         ]}
        >
        <Text style={styles.primaryText}>Continuar</Text>
        </Pressable>
        </ScrollView>
        </AuthBackground>
        </SafeAreaView>

  );

}
 
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'black' },
  container: { flex: 1, backgroundColor: 'black' },
  scroll: { padding: 20, paddingTop: 24 },
  scrollCentered: { padding: 20, paddingTop: 24, flexGrow: 1, justifyContent: 'center' },
  title: { color: 'white', fontFamily: 'SFProRounded-Semibold', fontSize: 32, marginTop: 10, marginBottom: 10 },
  card: { backgroundColor: '#1C1C1E', borderRadius: 16, padding: 16 },
  label: { color: 'white', fontFamily: 'SFProRounded-Semibold' },
  input: {
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: 'white',
    fontFamily: 'SFProRounded-Regular',
  },
  primaryBtn: { backgroundColor: '#A6FF00', height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: 'black', fontFamily: 'SFProRounded-Semibold', fontSize: 16 },
  link: { color: 'white', fontFamily: 'SFProRounded-Semibold', fontSize: 11 },
  error: { color: '#f04d4dff', marginBottom: 2, fontFamily: 'SFProRounded-Regular', fontWeight: 'bold', fontSize: 12 },
  boldText: { fontWeight: 'bold' },
});
 