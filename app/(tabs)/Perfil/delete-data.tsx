import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View, TextInput, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function DeleteData() {
  const [confirm, setConfirm] = useState('');
  const enabled = confirm.trim().toUpperCase() === 'ELIMINAR';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <Pressable hitSlop={12} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.h1}>Borrar datos</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.body}>
            {`Al continuar, se eliminaran todos los datos almacenados en tu cuenta FitLink, incluyendo historiales y configuraciones. Esta accion no se puede deshacer.

Escribe ELIMINAR para confirmar:`}
          </Text>
          <TextInput
            value={confirm}
            onChangeText={setConfirm}
            placeholder="ELIMINAR"
            placeholderTextColor="#9E9EA0"
            style={styles.input}
          />
          <Pressable
            disabled={!enabled}
            style={({ pressed }) => [
              styles.primaryBtn,
              { opacity: enabled ? (pressed ? 0.9 : 1) : 0.4 },
            ]}
          >
            <Text style={styles.primaryText}>Confirmar</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'black' },
  scroll: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  h1: { color: 'white', fontSize: 32, fontFamily: 'SFProRounded-Semibold', marginTop: 10, marginBottom: 10 },
  card: { backgroundColor: '#1C1C1E', borderRadius: 18, padding: 20 },
  body: { color: 'white', fontFamily: 'SFProRounded-Regular', fontSize: 13, lineHeight: 18 },
  input: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: 'white',
    fontFamily: 'SFProRounded-Regular',
  },
  primaryBtn: {
    marginTop: 14,
    height: 46,
    borderRadius: 18,
    backgroundColor: '#A6FF00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: '#111', fontFamily: 'SFProRounded-Semibold', fontSize: 16 },
});
