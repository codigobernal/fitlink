import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { auth } from '../../../firebaseConfig';
import { signOut } from 'firebase/auth';

const OPTION_STYLES = {
  change: { background: '#2F3136', color: '#FFD166' },
  delete: { background: '#3B0F0F', color: '#FF6B6B' },
  about: { background: '#2E3A2E', color: '#A6FF00' },
  help: { background: '#273442', color: '#7AD7FF' },
} as const;

export default function Informacion() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.h1}>Informacion</Text>

        <Pressable
          onPress={() => router.push('/(tabs)/Perfil/edit')}
          style={({ pressed }) => [styles.card, styles.row, { opacity: pressed ? 0.92 : 1 }]}
        >
          <View style={styles.avatar} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>&lt;usuario aqui&gt;</Text>
            <Text style={styles.email}>&lt;correo aqui&gt;</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
        </Pressable>

        <Option
          icon="key"
          label="Modificar contrasena"
          background={OPTION_STYLES.change.background}
          color={OPTION_STYLES.change.color}
          onPress={() => router.push('/(tabs)/Perfil/change-password')}
        />
        <Option
          icon="trash"
          label="Borrar datos"
          background={OPTION_STYLES.delete.background}
          color={OPTION_STYLES.delete.color}
          onPress={() => router.push('/(tabs)/Perfil/delete-data')}
        />
        <Option
          icon="information-circle"
          label="Acerca de nosotros"
          background={OPTION_STYLES.about.background}
          color={OPTION_STYLES.about.color}
          onPress={() => router.push('/(tabs)/Perfil/about')}
        />
        <Option
          icon="help-circle"
          label="Ayuda"
          background={OPTION_STYLES.help.background}
          color={OPTION_STYLES.help.color}
          onPress={() => router.push('/(tabs)/Perfil/help')}
        />
        <Option
          icon="log-out"
          label="Cerrar sesión"
          background="#3B0F0F"
          color="#FF6B6B"
          onPress={async () => { try { await signOut(auth); router.replace('/(auth)/login'); } catch {} }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

type OptionProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  background: string;
  color: string;
};

function Option({ icon, label, onPress, background, color }: OptionProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, styles.row, { opacity: pressed ? 0.85 : 1 }]}
    >
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
  h1: { color: 'white', fontSize: 32, fontFamily: 'SFProRounded-Semibold', marginTop: 10, marginBottom: 10 },
  card: { backgroundColor: '#1C1C1E', borderRadius: 18, marginBottom: 12 },
  row: { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFF' },
  name: { color: 'white', fontFamily: 'SFProRounded-Semibold' },
  email: { color: '#9E9EA0', fontFamily: 'SFProRounded-Regular', fontSize: 12 },
  optIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  optionLabel: { color: 'white', fontFamily: 'SFProRounded-Regular', fontSize: 15 },
});
