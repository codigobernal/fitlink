import React, { useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, Pressable, TextInput, Image, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function Login() {
  const { width, height } = useWindowDimensions();
  // Escalado relativo al diseño 360x800
  const baseW = 360;
  const baseH = 800;
  const sW = width / baseW;
  const sH = height / baseH;
  const scale = Math.min(Math.max(sW, 0.75), 1.25);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <SafeAreaView style={styles.safe}> 
      <StatusBar style="light" />
      <View style={styles.container}>
        {/* Imágenes decorativas */}
        <Image source={{ uri: 'https://placehold.co/108x103' }} style={{ position: 'absolute', left: 25 * sW, top: 222 * sH, width: 108 * sW, height: 103 * sH }} />
        <Image source={{ uri: 'https://placehold.co/101x101' }} style={{ position: 'absolute', left: 47 * sW, top: 70 * sH, width: 101 * sW, height: 101 * sH }} />
        <Image source={{ uri: 'https://placehold.co/93x102' }} style={{ position: 'absolute', left: 324 * sW, top: 630 * sH, width: 93 * sW, height: 102 * sH, transform: [{ rotate: '180deg' }] }} />
        <Image source={{ uri: 'https://placehold.co/100x104' }} style={{ position: 'absolute', left: 324 * sW, top: 225 * sH, width: 100 * sW, height: 104 * sH, transform: [{ rotate: '180deg' }] }} />
        <Image source={{ uri: 'https://placehold.co/94x94' }} style={{ position: 'absolute', left: 32 * sW, top: 617 * sH, width: 94 * sW, height: 94 * sH }} />
        <Image source={{ uri: 'https://placehold.co/107x107' }} style={{ position: 'absolute', left: 184 * sW, top: 685 * sH, width: 107 * sW, height: 107 * sH }} />

        {/* Título */}
        <Text style={[styles.title, { left: 30 * sW, top: 246 * sH, fontSize: 32 * scale }]}>Iniciar Sesión</Text>

        {/* Tarjeta de formulario */}
        <View style={[styles.card, { left: 30 * sW, top: 293 * sH, width: 299 * sW, height: 221 * sH, borderRadius: 13 * scale }]} />

        {/* Etiquetas y campos */}
        <Text style={[styles.label, { left: 51 * sW, top: 314 * sH, fontSize: 14 * scale }]}>Correo electrónico:</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="correo@ejemplo.com"
          placeholderTextColor="#9E9EA0"
          style={[styles.input, { left: 51 * sW, top: 346 * sH, width: 257 * sW, height: 41 * sH, borderRadius: 16 * scale }]}
        />

        <Text style={[styles.label, { left: 51 * sW, top: 397 * sH, fontSize: 14 * scale }]}>Contraseña:</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
          placeholderTextColor="#9E9EA0"
          style={[styles.input, { left: 51 * sW, top: 426 * sH, width: 257 * sW, height: 41 * sH, borderRadius: 16 * scale }]}
        />

        {/* CTA principal */}
        <Pressable
          onPress={() => router.replace('(tabs)')}
          style={({ pressed }) => [
            styles.primaryBtn,
            {
              left: 30 * sW,
              top: 528 * sH,
              width: 299 * sW,
              height: 43 * sH,
              borderRadius: 16 * scale,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <Text style={[styles.primaryText, { fontSize: 18 * scale }]}>Continuar</Text>
        </Pressable>

        {/* Enlace a registro */}
        <Pressable style={{ position: 'absolute', left: 69 * sW, top: 481 * sH, width: 239 * sW }} onPress={() => router.push('/(auth)/register')}>
          <Text style={[styles.link, { fontSize: 11 * scale }]}>¿No tienes cuenta? Registrate aqui</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'black' },
  container: { flex: 1, backgroundColor: 'black' },
  title: {
    position: 'absolute',
    color: 'white',
    fontFamily: 'SFProRounded-Semibold',
    lineHeight: 22,
  },
  card: {
    position: 'absolute',
    backgroundColor: '#1C1C1E',
  },
  label: {
    position: 'absolute',
    color: 'white',
    fontFamily: 'SFProRounded-Semibold',
    lineHeight: 22,
  },
  input: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'white',
    paddingHorizontal: 12,
    color: 'white',
    fontFamily: 'SFProRounded-Regular',
  },
  primaryBtn: {
    position: 'absolute',
    backgroundColor: '#A6FF00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: 'black',
    fontFamily: 'SFProRounded-Semibold',
    lineHeight: 22,
  },
  link: {
    textAlign: 'right',
    color: 'white',
    fontFamily: 'SFProRounded-Semibold',
    lineHeight: 22,
  },
});
