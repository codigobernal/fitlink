import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { EmailAuthProvider, getAuth, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { fonts } from '../../../constants/fonts';
import { useAuth } from '../../../context/AuthContext';
 
export default function ChangePassword() {
  const { user } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
 
  const validatePasswords = (): string | null => {
    if (next.length < 8) return 'La nueva contraseña debe tener al menos 8 caracteres';
    if (!/[A-Z]/.test(next)) return 'Debe incluir al menos una letra mayúscula';
    if (!/[a-z]/.test(next)) return 'Debe incluir al menos una letra minúscula';
    if (!/[0-9]/.test(next)) return 'Debe incluir al menos un número';
    if (!/[!@#$%^&*]/.test(next)) return 'Debe incluir al menos un carácter especial (!@#$%^&*)';
    if (next !== confirm) return 'Las contraseñas no coinciden';
    return null;
  };
 
  const onSubmit = async () => {
    const validationError = validatePasswords();
    if (validationError) { setError(validationError); return; }
 
    setError(null);
    setSuccess(null);
    setLoading(true);
 
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      const email = user?.email ?? currentUser?.email ?? null;
      if (!currentUser || !email) throw new Error('No se encontró usuario autenticado.');
 
      const credential = EmailAuthProvider.credential(email, current);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, next);
 
      setSuccess('Tu contraseña se actualizó correctamente.');
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err: any) {
      console.error('Error al cambiar la contraseña:', err);
      if (err.code === 'auth/wrong-password') {
        setError('La contraseña actual es incorrecta.');
      } else if (err.code === 'auth/weak-password') {
        setError('La nueva contraseña es demasiado débil.');
      } else {
        setError('No se pudo actualizar la contraseña. Inténtalo nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <Pressable hitSlop={12} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.h1}><Text style={styles.boldText}>Modificar contraseña</Text></Text>
        </View>
 
        <View style={styles.card}>
          <Field label="Ingrese su contraseña actual:" value={current} onChangeText={setCurrent} />
          <Field label="Contraseña nueva:" value={next} onChangeText={setNext} />
          <Field label="Confirme su contraseña nueva:" value={confirm} onChangeText={setConfirm} />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {success ? <Text style={styles.success}>{success}</Text> : null}
          <Pressable
            disabled={!current || !next || !confirm || loading}
            onPress={onSubmit}
            style={({ pressed }) => [
              styles.primaryBtn,
              { opacity: current && next && confirm ? (pressed ? 0.9 : 1) : 0.4 },
            ]}
          >
            {loading ? <ActivityIndicator color="#111" /> : <Text style={styles.primaryText}>Confirmar</Text>}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
 
type FieldProps = { label: string; value: string; onChangeText: (text: string) => void };
 
function Field({ label, value, onChangeText }: FieldProps) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry
        placeholder="••••••"
        placeholderTextColor="#9E9EA0"
        style={styles.input}
      />
    </View>
  );
}
 
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'black' },
  scroll: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  h1: { color: 'white', fontSize: 32, fontFamily: fonts.semibold, marginTop: 10, marginBottom: 10 },
  card: { backgroundColor: '#1C1C1E', borderRadius: 18, padding: 20 },
  fieldBlock: { marginBottom: 16 },
  label: { color: 'white', fontFamily: fonts.semibold, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: 'white',
    fontFamily: fonts.regular,
  },
  primaryBtn: {
    marginTop: 6,
    height: 46,
    borderRadius: 18,
    backgroundColor: '#A6FF00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: '#111', fontFamily: fonts.semibold, fontSize: 16 },
  error: { color: '#f04d4d', marginBottom: 12, fontFamily: fonts.regular, fontWeight: 'bold', fontSize: 14 },
  success: { color: '#A6FF00', marginBottom: 12, fontFamily: fonts.regular, fontWeight: 'bold', fontSize: 14 },
  boldText: { fontWeight: 'bold' },
});