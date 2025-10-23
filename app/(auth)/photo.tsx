import React, { useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, Image, Pressable, useWindowDimensions, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AuthBackground from '@/components/auth/AuthBackground';

export default function Photo() {
  const { width, height } = useWindowDimensions();
  const baseW = 360;
  const baseH = 800;
  const sW = width / baseW;
  const sH = height / baseH;
  const scale = Math.min(Math.max(sW, 0.75), 1.25);

  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const handlePick = async () => {
    setPhotoUri('https://placehold.co/200x200');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <AuthBackground>
        <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 24, flexGrow: 1, justifyContent: 'center' }}>
          <Text style={[styles.title, { fontSize: 32 * scale, marginTop: 10, marginBottom: 10 }]}>Foto de perfil</Text>
          <View style={{ backgroundColor: '#1C1C1E', borderRadius: 13 * scale, padding: 20, marginTop: 10 }}>
            <Pressable onPress={handlePick} style={{ alignSelf: 'center', width: 160, height: 160, borderRadius: 999, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white' }}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={{ width: '100%', height: '100%' }} />
              ) : (
                <Text style={{ color: '#555' }}>Toca para seleccionar</Text>
              )}
            </Pressable>
          </View>
          <Pressable disabled={!photoUri} onPress={() => router.replace('/(auth)/connect')} style={({ pressed }) => [{ backgroundColor: '#A6FF00', height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 14, opacity: !photoUri ? 0.4 : pressed ? 0.9 : 1 }]}>
            <Text style={styles.primaryText}>Continuar</Text>
          </Pressable>
        </ScrollView>
      </AuthBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'black' },
  title: { color: 'white', fontFamily: 'SFProRounded-Semibold' },
  primaryText: { color: 'black', fontFamily: 'SFProRounded-Semibold' },
});
