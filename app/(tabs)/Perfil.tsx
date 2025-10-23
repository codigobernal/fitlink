import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Informacion() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.h1}>Información</Text>

        {/* Usuario */}
        <View style={[styles.card, { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }]}> 
          <View style={styles.avatar} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>&lt;usuario aqui&gt;</Text>
            <Text style={styles.email}>&lt;correo aqui&gt;</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
        </View>

        {/* Opciones */}
        <Option icon="key" label="Modificar contraseña" />
        <Option icon="trash" label="Borrar datos" destructive />
        <Option icon="information-circle" label="Acerca de nosotros" />
        <Option icon="help-circle" label="Ayuda" />
      </ScrollView>
    </SafeAreaView>
  );
}

function Option({ icon, label, destructive }: { icon: any; label: string; destructive?: boolean }) {
  return (
    <Pressable style={({ pressed }) => [styles.card, { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, opacity: pressed ? 0.8 : 1 }]}>
      <View style={[styles.optIcon, { backgroundColor: destructive ? '#3B0F0F' : '#2A2A2C' }]}>
        <Ionicons name={icon} size={16} color={destructive ? '#FF6B6B' : '#A6FF00'} />
      </View>
      <Text style={styles.optionLabel}>{label}</Text>
      <View style={{ flex: 1 }} />
      <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'black' },
  scroll: { padding: 16 },
  h1: { color: 'white', fontSize: 32, fontFamily: 'SFProRounded-Semibold', marginBottom: 12 },
  card: { backgroundColor: '#1C1C1E', borderRadius: 18, marginBottom: 12 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFF' },
  name: { color: 'white', fontFamily: 'SFProRounded-Semibold' },
  email: { color: '#9E9EA0', fontFamily: 'SFProRounded-Regular', fontSize: 12 },
  optIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  optionLabel: { color: 'white', fontFamily: 'SFProRounded-Regular' },
});
