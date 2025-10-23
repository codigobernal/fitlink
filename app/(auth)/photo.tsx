import React, { useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, Image, Pressable, useWindowDimensions, Alert } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

export default function Photo() {
  const { width, height } = useWindowDimensions();
  const baseW = 360;
  const baseH = 800;
  const sW = width / baseW;
  const sH = height / baseH;
  const scale = Math.min(Math.max(sW, 0.75), 1.25);

  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const handlePick = async () => {
    // Desactivado por ahora: se configurará más adelante
    setPhotoUri('https://placehold.co/200x200');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <View style={styles.container}>
        {/* 6 imágenes decorativas */}
        <Image source={{ uri: 'https://placehold.co/101x101' }} style={{ position: 'absolute', left: 69 * sW, top: 70 * sH, width: 101 * sW, height: 101 * sH }} />
        <Image source={{ uri: 'https://placehold.co/108x103' }} style={{ position: 'absolute', left: 47 * sW, top: 253 * sH, width: 108 * sW, height: 103 * sH }} />
        <Image source={{ uri: 'https://placehold.co/100x104' }} style={{ position: 'absolute', left: 313 * sW, top: 226 * sH, width: 100 * sW, height: 104 * sH, transform: [{ rotate: '180deg' }] }} />
        <Image source={{ uri: 'https://placehold.co/93x102' }} style={{ position: 'absolute', left: 346 * sW, top: 661 * sH, width: 93 * sW, height: 102 * sH, transform: [{ rotate: '180deg' }] }} />
        <Image source={{ uri: 'https://placehold.co/94x94' }} style={{ position: 'absolute', left: 54 * sW, top: 644 * sH, width: 94 * sW, height: 94 * sH }} />
        <Image source={{ uri: 'https://placehold.co/107x107' }} style={{ position: 'absolute', left: 206 * sW, top: 716 * sH, width: 107 * sW, height: 107 * sH }} />

        {/* Título */}
        <Text style={[styles.title, { left: 30 * sW, top: 245 * sH, fontSize: 32 * scale }]}>Foto de perfil</Text>

        {/* Card contenedora */}
        <View style={{ position: 'absolute', left: 30 * sW, top: 293 * sH, width: 299 * sW, height: 256 * sH, backgroundColor: '#1C1C1E', borderRadius: 13 * scale }} />

        {/* Área circular de foto */}
        <Pressable
          onPress={handlePick}
          style={{ position: 'absolute', left: 108 * sW, top: 344 * sH, width: 144 * sW, height: 144 * sH, borderRadius: 999, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white' }}
        >
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={{ width: '100%', height: '100%' }} />
          ) : (
            <Text style={{ color: '#555' }}>Toca para seleccionar</Text>
          )}
        </Pressable>

        {/* Botón/icono de cámara (overlay) */}
        <Pressable onPress={handlePick} style={({ pressed }) => [
          {
            position: 'absolute', left: (108 + 144 - 34) * sW, top: (344 + 144 - 34) * sH,
            width: 34 * sW, height: 34 * sH, borderRadius: 999,
            backgroundColor: pressed ? '#777' : '#111',
            alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'white'
          }
        ]}>
          <Ionicons name="camera" size={18 * scale} color="white" />
        </Pressable>

        {/* CTA Continuar: solo si hay foto */}
        <Pressable
          disabled={!photoUri}
          onPress={() => router.push('/(auth)/connect')}
          style={({ pressed }) => [
            styles.primaryBtn,
            {
              left: 30 * sW, top: 564 * sH, width: 299 * sW, height: 43 * sH,
              borderRadius: 16 * scale,
              opacity: !photoUri ? 0.4 : pressed ? 0.9 : 1,
            },
          ]}
        >
          <Text style={[styles.primaryText, { fontSize: 18 * scale }]}>Continuar</Text>
        </Pressable>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'black' },
  container: { flex: 1, backgroundColor: 'black' },
  title: { position: 'absolute', color: 'white', fontFamily: 'SFProRounded-Semibold', lineHeight: 22 },
  primaryBtn: { position: 'absolute', backgroundColor: '#A6FF00', alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: 'black', fontFamily: 'SFProRounded-Semibold' },
});
