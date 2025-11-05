import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { deleteUser, getAuth } from 'firebase/auth';
import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../../../firebaseConfig';
import { fonts } from '../../../constants/fonts';

export default function DeleteData() {
  const [confirm, setConfirm] = useState('');
  const enabled = confirm === 'ELIMINAR';
  const currentEmail = useMemo(() => auth.currentUser?.email ?? '', []);

  const handleDeleteAccount = async () => {
    try {
      const authInstance = getAuth();
      const user = authInstance.currentUser;
      if (user) {
        await deleteUser(user);
        Alert.alert('Cuenta eliminada', 'Tu cuenta ha sido eliminada correctamente.');
        router.replace('/(auth)');
      }
    } catch (error: any) {
      console.error('Error al eliminar la cuenta:', error);
      if (error?.code === 'auth/requires-recent-login') {
        Alert.alert(
          'Vuelve a iniciar sesión',
          'Por seguridad necesitamos que vuelvas a iniciar sesión antes de eliminar tu cuenta.'
        );
      } else {
        Alert.alert('Error', 'No se pudo eliminar la cuenta. Inténtalo nuevamente.');
      }
    }
  };

  const handleConfirmPress = () => {
    if (!enabled) return;
    Alert.alert(
      'Confirmar eliminación',
      'Se eliminará tu cuenta y todos los datos asociados. Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: handleDeleteAccount },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <Pressable hitSlop={12} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.h1}>
            <Text style={styles.boldText}>Borrar datos</Text>
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.body}>
            {`Al continuar, se eliminarán todos los datos almacenados en tu cuenta FitLink, incluyendo historiales y configuraciones. Esta acción no se puede deshacer.`}
          </Text>
          <Text style={[styles.body, { marginTop: 12 }]}>
            Escribe <Text style={styles.boldText}>ELIMINAR</Text> para confirmar:
          </Text>
          <TextInput
            value={confirm}
            onChangeText={setConfirm}
            placeholder="ELIMINAR"
            placeholderTextColor="#9E9EA0"
            style={styles.input}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <Text style={[styles.helper, { color: confirm && !enabled ? '#FF6B6B' : '#9E9EA0' }]}>
            Debe coincidir exactamente en mayúsculas.
          </Text>
          <Pressable
            disabled={!enabled}
            onPress={handleConfirmPress}
            style={({ pressed }) => [
              styles.primaryBtn,
              { opacity: enabled ? (pressed ? 0.9 : 1) : 0.4 },
            ]}
          >
            <Text style={styles.primaryText}>Confirmar</Text>
          </Pressable>
        </View>

        {currentEmail ? (
          <View style={[styles.card, { marginTop: 16 }]}>
            <Text style={[styles.body, { opacity: 0.6 }]}>
              Sesión actual: {currentEmail}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'black' },
  scroll: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  h1: { color: 'white', fontSize: 32, fontFamily: fonts.semibold, marginTop: 10, marginBottom: 10 },
  card: { backgroundColor: '#1C1C1E', borderRadius: 18, padding: 20 },
  body: { color: 'white', fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  input: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: 'white',
    fontFamily: fonts.regular,
    letterSpacing: 1,
  },
  helper: { marginTop: 6, fontSize: 11, fontFamily: fonts.regular },
  primaryBtn: {
    marginTop: 14,
    height: 46,
    borderRadius: 18,
    backgroundColor: '#A6FF00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: '#111', fontFamily: fonts.semibold, fontSize: 16 },
  boldText: { fontWeight: 'bold' },
});

