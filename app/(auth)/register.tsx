import React, { useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, Pressable, TextInput, Image, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';

export default function Register() {
  const { width, height } = useWindowDimensions();
  const baseW = 360;
  const baseH = 800;
  const sW = width / baseW;
  const sH = height / baseH;
  const scale = Math.min(Math.max(sW, 0.75), 1.25);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <View style={styles.container}>
        {/* Imágenes decorativas */}
        <Image source={{ uri: 'https://placehold.co/108x103' }} style={{ position: 'absolute', left: 37 * sW, top: 222 * sH, width: 108 * sW, height: 103 * sH }} />
        <Image source={{ uri: 'https://placehold.co/101x101' }} style={{ position: 'absolute', left: 59 * sW, top: 70 * sH, width: 101 * sW, height: 101 * sH }} />
        <Image source={{ uri: 'https://placehold.co/93x102' }} style={{ position: 'absolute', left: 336 * sW, top: 630 * sH, width: 93 * sW, height: 102 * sH, transform: [{ rotate: '180deg' }] }} />
        <Image source={{ uri: 'https://placehold.co/94x94' }} style={{ position: 'absolute', left: 44 * sW, top: 617 * sH, width: 94 * sW, height: 94 * sH }} />
        <Image source={{ uri: 'https://placehold.co/100x104' }} style={{ position: 'absolute', left: 336 * sW, top: 235 * sH, width: 100 * sW, height: 104 * sH, transform: [{ rotate: '180deg' }] }} />
        <Image source={{ uri: 'https://placehold.co/107x107' }} style={{ position: 'absolute', left: 196 * sW, top: 685 * sH, width: 107 * sW, height: 107 * sH }} />

        {/* Título */}
        <Text style={[styles.title, { left: 30 * sW, top: 198 * sH, fontSize: 32 * scale }]}>Crea tu cuenta</Text>

        {/* Card */}
        <View style={[styles.card, { left: 30 * sW, top: 246 * sH, width: 299 * sW, height: 359 * sH, borderRadius: 13 * scale }]} />

        {/* Campos */}
        <Text style={[styles.label, { left: 52 * sW, top: 260 * sH, fontSize: 14 * scale }]}>Usuario:</Text>
        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder="Tu usuario"
          placeholderTextColor="#9E9EA0"
          style={[styles.input, { left: 52 * sW, top: 289 * sH, width: 257 * sW, height: 41 * sH, borderRadius: 16 * scale }]}
        />

        <Text style={[styles.label, { left: 51 * sW, top: 337 * sH, fontSize: 14 * scale }]}>Correo electrónico:</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="correo@ejemplo.com"
          placeholderTextColor="#9E9EA0"
          style={[styles.input, { left: 51 * sW, top: 366 * sH, width: 257 * sW, height: 41 * sH, borderRadius: 16 * scale }]}
        />

        <Text style={[styles.label, { left: 51 * sW, top: 414 * sH, fontSize: 14 * scale }]}>Contraseña:</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
          placeholderTextColor="#9E9EA0"
          style={[styles.input, { left: 51 * sW, top: 443 * sH, width: 257 * sW, height: 41 * sH, borderRadius: 16 * scale }]}
        />

        <Text style={[styles.label, { left: 51 * sW, top: 494 * sH, fontSize: 14 * scale }]}>Confirmar contraseña:</Text>
        <TextInput
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          placeholder="••••••••"
          placeholderTextColor="#9E9EA0"
          style={[styles.input, { left: 51 * sW, top: 523 * sH, width: 257 * sW, height: 41 * sH, borderRadius: 16 * scale }]}
        />

        {/* CTA */}
        <Pressable
          onPress={() => router.push('/(auth)/photo')}
          style={({ pressed }) => [
            styles.primaryBtn,
            {
              left: 30 * sW,
              top: 621 * sH,
              width: 299 * sW,
              height: 43 * sH,
              borderRadius: 16 * scale,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <Text style={[styles.primaryText, { fontSize: 18 * scale }]}>Continuar</Text>
        </Pressable>

        {/* Enlace a login */}
        <Pressable style={{ position: 'absolute', left: 70 * sW, top: 574 * sH, width: 239 * sW }} onPress={() => router.push('/(auth)/login')}>
          <Text style={[styles.link, { fontSize: 11 * scale }]}>¿Ya tienes cuenta? Inicia sesión</Text>
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
  card: { position: 'absolute', backgroundColor: '#1C1C1E' },
  label: { position: 'absolute', color: 'white', fontFamily: 'SFProRounded-Semibold', lineHeight: 22 },
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
  primaryText: { color: 'black', fontFamily: 'SFProRounded-Semibold', lineHeight: 22 },
  link: { textAlign: 'right', color: 'white', fontFamily: 'SFProRounded-Semibold', lineHeight: 22 },
});
