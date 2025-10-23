import React, { useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, Image, Pressable, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function Connect() {
  const { width, height } = useWindowDimensions();
  const baseW = 360; const baseH = 800;
  const sW = width / baseW; const sH = height / baseH; const scale = Math.min(Math.max(sW, 0.75), 1.25);

  const [connected, setConnected] = useState(false);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <View style={styles.container}>
        {/* 6 imágenes decorativas */}
        <Image source={{ uri: 'https://placehold.co/108x103' }} style={{ position: 'absolute', left: 47 * sW, top: 180 * sH, width: 108 * sW, height: 103 * sH }} />
        <Image source={{ uri: 'https://placehold.co/100x104' }} style={{ position: 'absolute', left: 313 * sW, top: 170 * sH, width: 100 * sW, height: 104 * sH, transform: [{ rotate: '180deg' }] }} />
        <Image source={{ uri: 'https://placehold.co/94x94' }} style={{ position: 'absolute', left: 260 * sW, top: 650 * sH, width: 94 * sW, height: 94 * sH }} />
        <Image source={{ uri: 'https://placehold.co/107x107' }} style={{ position: 'absolute', left: 60 * sW, top: 690 * sH, width: 107 * sW, height: 107 * sH }} />
        <Image source={{ uri: 'https://placehold.co/90x90' }} style={{ position: 'absolute', left: 40 * sW, top: 730 * sH, width: 90 * sW, height: 90 * sH }} />
        <Image source={{ uri: 'https://placehold.co/101x101' }} style={{ position: 'absolute', left: 70 * sW, top: 70 * sH, width: 101 * sW, height: 101 * sH }} />

        {/* Título */}
        <Text style={[styles.title, { left: 30 * sW, top: 220 * sH, fontSize: 32 * scale }]}>Conexión</Text>

        {/* Card con estado */}
        <View style={{ position: 'absolute', left: 30 * sW, top: 270 * sH, width: 299 * sW, height: 230 * sH, backgroundColor: '#1C1C1E', borderRadius: 13 * scale, padding: 16 }}>
          <Text style={{ color: 'white', fontFamily: 'SFProRounded-Semibold', marginBottom: 10, fontSize: 14 * scale }}>Conecte el dispositivo mediante wifi</Text>
          <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
            <View style={{ width: 80 * sW, height: 80 * sW, borderRadius: 999, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: 40 * sW, height: 26 * sH, backgroundColor: '#111', borderRadius: 4, opacity: 0.9 }} />
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
        <Pressable
          disabled={!connected}
          onPress={() => router.replace('(tabs)')}
          style={({ pressed }) => [
            { position: 'absolute', left: 30 * sW, top: 520 * sH, width: 299 * sW, height: 43 * sH, borderRadius: 16 * scale, alignItems: 'center', justifyContent: 'center', backgroundColor: '#A6FF00', opacity: !connected ? 0.4 : pressed ? 0.9 : 1 },
          ]}
        >
          <Text style={{ color: 'black', fontFamily: 'SFProRounded-Semibold', fontSize: 18 * scale }}>Continuar</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'black' },
  container: { flex: 1, backgroundColor: 'black' },
  title: { position: 'absolute', color: 'white', fontFamily: 'SFProRounded-Semibold' },
});

