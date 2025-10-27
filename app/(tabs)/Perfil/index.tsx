import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { auth, db } from '../../../firebaseConfig';
import { onValue, ref } from 'firebase/database';
import { signOut } from 'firebase/auth';

const OPTION_STYLES = {
  change: { background: '#3d300eff', color: '#FFD166' },
  delete: { background: '#3d0c0cff', color: '#FF6B6B' },
  about: { background: '#093a09ff', color: '#A6FF00' },
  help: { background: '#0c243eff', color: '#7AD7FF' },
} as const;

export default function Informacion() {
  const [name, setName] = useState<string | null>(auth.currentUser?.displayName ?? null);
  const [email, setEmail] = useState<string | null>(auth.currentUser?.email ?? null);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const userRef = ref(db, `users/${uid}`);
    const unsub = onValue(userRef, (snap) => {
      const data = snap.val();
      if (data?.username) setName(String(data.username));
      if (data?.email) setEmail(String(data.email));
    });
    return () => unsub();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.h1}>Informacion</Text>

        <Pressable onPress={() => router.push('/(tabs)/Perfil/edit')} style={({ pressed }) => [styles.card, styles.row, { opacity: pressed ? 0.92 : 1 }]}> 
          <View style={styles.avatar} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{name || '<usuario aqui>'}</Text>
            <Text style={styles.email}>{email || '<correo aqui>'}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
        </Pressable>

        <Option icon="key" label="Modificar contrasena" background={OPTION_STYLES.change.background} color={OPTION_STYLES.change.color} onPress={() => router.push('/(tabs)/Perfil/change-password')} />
        <Option icon="trash" label="Borrar datos" background={OPTION_STYLES.delete.background} color={OPTION_STYLES.delete.color} onPress={() => router.push('/(tabs)/Perfil/delete-data')} />
        <Option icon="information-circle" label="Acerca de nosotros" background={OPTION_STYLES.about.background} color={OPTION_STYLES.about.color} onPress={() => router.push('/(tabs)/Perfil/about')} />
        <Option icon="help-circle" label="Ayuda" background={OPTION_STYLES.help.background} color={OPTION_STYLES.help.color} onPress={() => router.push('/(tabs)/Perfil/help')} />
        <Option icon="document-text" label="Aviso de privacidad" background="rgba(58, 68, 13, 1)" color="#fff700ff" onPress={() => router.push('/(tabs)/Perfil/privacy')} />
        <Option
          icon="log-out"
          label="Cerrar sesión"
          background="#3a0b3cff"
          color="#ff6bd5ff"
          onPress={() => {
            Alert.alert('Cerrar sesión', '¿Deseas cerrar sesión?', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Cerrar sesión', style: 'destructive', onPress: async () => { try { await signOut(auth); router.replace('/(auth)/login'); } catch {} } },
            ]);
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

type OptionProps = { icon: keyof typeof Ionicons.glyphMap; label: string; onPress?: () => void; background: string; color: string };

function Option({ icon, label, onPress, background, color }: OptionProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, styles.row, { opacity: pressed ? 0.85 : 1 }]}>
      <View style={[styles.optIcon, { backgroundColor: background }]}> 
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={styles.optionLabel}>{label}</Text>
      <View style={{ flex: 1 }} />
      <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'black' },
  scroll: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 24 },
  h1: { color: 'white', fontSize: 32, fontFamily: 'SFProRounded-Semibold', marginTop: 10, marginBottom: 16 },
  card: { backgroundColor: '#1C1C1E', borderRadius: 18, marginBottom: 12 },
  row: { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFF' },
  name: { color: 'white', fontFamily: 'SFProRounded-Semibold', fontSize: 16 },
  email: { color: '#9E9EA0', fontFamily: 'SFProRounded-Regular', fontSize: 13 },
  optIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  optionLabel: { color: 'white', fontFamily: 'SFProRounded-Regular', fontSize: 17 },
});
