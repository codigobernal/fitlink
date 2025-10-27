import React, { useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AuthBackground from '@/components/auth/AuthBackground';

export default function Connect() {
  const scale = 1;

  const [connected, setConnected] = useState(false);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <AuthBackground>
        <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 24, flexGrow: 1, justifyContent: 'center' }}>
          <Text style={[styles.title, { fontSize: 32 * scale, marginTop: 10, marginBottom: 10 }]}>Conexión</Text>
          <View style={{ backgroundColor: '#1C1C1E', borderRadius: 13, padding: 16, marginTop: 10 }}>
          <Text style={{ color: 'white', fontFamily: 'SFProRounded-Semibold', marginBottom: 10, fontSize: 14 * scale }}>Conecte el dispositivo mediante wifi</Text>
          <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
            <View style={{ width: 80, height: 80, borderRadius: 999, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: 40, height: 26, backgroundColor: '#111', borderRadius: 4, opacity: 0.9 }} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: 'white', marginBottom: 8, fontFamily: 'SFProRounded-Semibold' }}>Estatus:</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1, height: 28, backgroundColor: connected ? '#16A34A' : '#0B3D1E', borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: 'white', fontSize: 12 * scale }}>Conectado</Text>
                </View>
                <View style={{ flex: 1, height: 28, backgroundColor: connected ? '#5B1212' : '#EF4444', borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: 'white', fontSize: 12 * scale }}>Desconectado</Text>
                </View>
              </View>
            </View>
          </View>
          <Text style={{ color: '#BDBDBD', opacity: 0.8, fontSize: 10 * scale, marginTop: 8 }}>(Presione el botón para iniciar el emparejamiento)</Text>

          <Pressable onPress={() => setConnected(v => !v)} style={({ pressed }) => [{ marginTop: 12, alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: pressed ? '#374151' : '#2D2D2D' }]}>
            <Text style={{ color: 'white' }}>{connected ? 'Desconectar' : 'Intentar conectar'}</Text>
          </Pressable>
          </View>

          {/* CTA */}
          <Pressable disabled={!connected} onPress={() => router.replace('(tabs)')} style={({ pressed }) => [{ backgroundColor: '#A6FF00', height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 14, opacity: !connected ? 0.4 : pressed ? 0.9 : 1 }]}>
            <Text style={{ color: 'black', fontFamily: 'SFProRounded-Semibold', fontSize: 18 * scale }}>Continuar</Text>
          </Pressable>
        </ScrollView>
      </AuthBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'black' },
  container: { flex: 1, backgroundColor: 'black' },
  title: { position: 'absolute', color: 'white', fontFamily: 'SFProRounded-Semibold' },
});
