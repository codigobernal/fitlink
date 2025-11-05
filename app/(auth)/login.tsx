import AuthBackground from '@/components/auth/AuthBackground';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { signInWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { auth } from '../../firebaseConfig';
import { useAuth } from '../../context/AuthContext'; // 👈 importa tu contexto

export default function Login() {
  const { setUser } = useAuth(); // 👈 usamos el contexto
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await signInWithEmailAndPassword(auth, email.trim(), password);
      const firebaseUser = result.user;

      // 👇 Guarda usuario en tu contexto
      const newUser = {
        uid: firebaseUser.uid,
        username: firebaseUser.displayName ?? email.split('@')[0],
        email: firebaseUser.email ?? email,
      };
      setUser(newUser);

      router.replace('/(tabs)');
    } catch (e: any) {
      const msg = e?.message ?? 'Error al iniciar sesión';
      setError(msg);
      const code = (e?.code as string) || '';
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        Alert.alert('Contraseña incorrecta', 'Revisa tu correo y contraseña e inténtalo de nuevo');
      } else if (code === 'auth/user-not-found') {
        Alert.alert('Cuenta no encontrada', 'Verifica tu correo o regístrate.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <AuthBackground>
        <ScrollView contentContainerStyle={styles.scrollCentered}>
          <Text style={styles.title}>
            <Text style={styles.boldText}>Iniciar Sesión</Text>
          </Text>

          <View style={styles.card}>
            <Text style={styles.label}>Correo electrónico:</Text>
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
<<<<<<< Updated upstream
            <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" placeholderTextColor="#9E9EA0" style={styles.input} />
            <Pressable onPress={() => router.push('/register')} style={{ alignSelf: 'flex-end', marginTop: 8 }}>
              <Text style={styles.link}>¿No tienes cuenta? Registrate aqui</Text>
=======
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor="#9E9EA0"
              style={styles.input}
            />
            <Pressable
              onPress={() => router.push('/(auth)/register')}
              style={{ alignSelf: 'flex-end', marginTop: 8 }}
            >
              <Text style={styles.link}>¿No tienes cuenta? Regístrate aquí</Text>
>>>>>>> Stashed changes
            </Pressable>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            disabled={loading}
            onPress={onSubmit}
            style={({ pressed }) => [
              styles.primaryBtn,
              { opacity: loading ? 0.5 : pressed ? 0.9 : 1 },
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
<<<<<<< Updated upstream
  container: { flex: 1, backgroundColor: 'black' },
  scroll: { padding: 20, paddingTop: 24 },
  scrollCentered: { padding: 20, paddingTop: 24, flexGrow: 1, justifyContent: 'center' },
=======
  scrollCentered: { padding: 20, paddingTop: 24, gap: 14, flexGrow: 1, justifyContent: 'center' },
>>>>>>> Stashed changes
  title: { color: 'white', fontFamily: 'SFProRounded-Semibold', fontSize: 32, marginTop: 10, marginBottom: 10 },
  card: { backgroundColor: '#1C1C1E', borderRadius: 16, padding: 16 },
  label: { color: 'white', fontFamily: fonts.semibold },
  input: { borderWidth: 1, borderColor: 'white', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 10, color: 'white', fontFamily: fonts.regular },
  primaryBtn: { backgroundColor: '#A6FF00', height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: 'black', fontFamily: 'SFProRounded-Semibold', fontSize: 16 },
  link: { color: 'white', fontFamily: 'SFProRounded-Semibold', fontSize: 11 },
  error: { color: '#FF6B6B', marginBottom: 8, fontFamily: 'SFProRounded-Regular' },
  boldText: { fontWeight: 'bold' },
});

