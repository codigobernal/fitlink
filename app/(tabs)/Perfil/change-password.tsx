import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View, TextInput, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function ChangePassword() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const enabled = next.length >= 6 && next === confirm && current.length > 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <Pressable hitSlop={12} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.h1}>Modificar contrasena</Text>
        </View>

        <View style={styles.card}>
          <Field
            label="Ingrese su contrasena:"
            value={current}
            onChangeText={setCurrent}
          />
          <Field label="Contrasena nueva:" value={next} onChangeText={setNext} />
          <Field label="Confirme su contrasena nueva:" value={confirm} onChangeText={setConfirm} />

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

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
};

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
  scroll: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  h1: { color: 'white', fontSize: 32, fontFamily: 'SFProRounded-Semibold' },
  card: { backgroundColor: '#1C1C1E', borderRadius: 18, padding: 20 },
  fieldBlock: { marginBottom: 16 },
  label: { color: 'white', fontFamily: 'SFProRounded-Semibold', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: 'white',
    fontFamily: 'SFProRounded-Regular',
  },
  primaryBtn: {
    marginTop: 6,
    height: 46,
    borderRadius: 18,
    backgroundColor: '#A6FF00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: '#111', fontFamily: 'SFProRounded-Semibold', fontSize: 16 },
});

