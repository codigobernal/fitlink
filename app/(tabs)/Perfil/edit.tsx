import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View, TextInput, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function EditProfile() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <Pressable hitSlop={12} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.h1}>Perfil</Text>
        </View>

        <View style={[styles.card, { alignItems: 'center' }]}> 
          <View style={styles.avatarWrap}>
            <Image source={{ uri: 'https://placehold.co/100x100' }} style={styles.avatar} />
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={14} color="#FFFFFF" />
            </View>
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Usuario:</Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="Usuario"
              placeholderTextColor="#9E9EA0"
              style={styles.input}
            />
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Correo electronico:</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="correo@ejemplo.com"
              placeholderTextColor="#9E9EA0"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
          </View>

          <Pressable style={({ pressed }) => [styles.primaryBtn, { opacity: pressed ? 0.9 : 1 }]}>
            <Text style={styles.primaryText}>Confirmar</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'black' },
  scroll: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  h1: { color: 'white', fontSize: 32, fontFamily: 'SFProRounded-Semibold' },
  card: { backgroundColor: '#1C1C1E', borderRadius: 18, padding: 20 },
  avatarWrap: { width: 104, height: 104, borderRadius: 52, marginBottom: 16, position: 'relative' },
  avatar: { width: '100%', height: '100%', borderRadius: 52, backgroundColor: '#FFFFFF' },
  cameraBadge: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6B7280',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldBlock: { alignSelf: 'stretch', marginBottom: 14 },
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
    marginTop: 8,
    alignSelf: 'stretch',
    height: 46,
    borderRadius: 18,
    backgroundColor: '#A6FF00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: '#111', fontFamily: 'SFProRounded-Semibold', fontSize: 16 },
});

