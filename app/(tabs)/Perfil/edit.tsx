import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, Pressable, View, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { auth, db } from '../../../firebaseConfig';
import { updateProfile } from 'firebase/auth';
import { onValue, ref, update } from 'firebase/database';
import { fonts } from '../../../constants/fonts';

const COLORS = [
  '#FF9F0A','#FF453A','#BF5AF2','#34C759','#0A84FF','#30B0C7','#FFD60A','#FF2D55',
  '#32D74B','#64D2FF','#8E8E93','#D0D3D4','#FF9ECD','#5AC8FA','#7B7FFF'
];

const ICONS: (keyof typeof Ionicons.glyphMap)[] = [
  'person','happy','body','fitness','walk','run','bicycle','football','basketball','tennisball',
  'barbell','medkit','bandage','leaf','water','flame','pulse','trail-sign','map','navigate',
  'rocket','planet','moon','sunny','camera','color-palette','book','school','code-slash','construct',
  'hammer','briefcase','wallet','heart','star','shield-checkmark','snow','ice-cream','bicycle','car'
];

export default function EditProfile() {
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [icon, setIcon] = useState<(keyof typeof Ionicons.glyphMap)>('person');

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    setUsername(user.displayName ?? '');
    setEmail(user.email ?? '');
    const userRef = ref(db, `users/${user.uid}`);
    const unsubscribe = onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
      if (typeof data.username === 'string') setUsername(data.username);
      if (typeof data.email === 'string') setEmail(data.email);
      if (data.profileIcon?.color) setColor(data.profileIcon.color);
      if (data.profileIcon?.name) setIcon(data.profileIcon.name);
    });
    return () => unsubscribe();
  }, []);

  const preview = useMemo(() => (
    <View style={[styles.preview, { backgroundColor: color }]}> 
      <Ionicons name={icon} size={32} color="#111" />
    </View>
  ), [color, icon]);

  const onSave = async () => {
    const trimmedName = username.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName) {
      Alert.alert('Nombre requerido', 'Ingresa un nombre para continuar.');
      return;
    }
    if (!trimmedEmail) {
      Alert.alert('Correo requerido', 'Ingresa un correo válido.');
      return;
    }
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Sesión expirada', 'Inicia sesión de nuevo.');
      router.replace('/(auth)/login');
      return;
    }
    try {
      await update(ref(db, `users/${user.uid}`), {
        username: trimmedName,
        email: trimmedEmail,
        profileIcon: { name: icon, color },
        theme: { accent: color },
      });
      if (user.displayName !== trimmedName) {
        await updateProfile(user, { displayName: trimmedName });
      }
      Alert.alert('Perfil actualizado', 'Tus cambios se guardaron correctamente.');
      router.back();
    } catch (error) {
      console.error('update profile', error);
      Alert.alert('Error', 'No pudimos guardar los cambios. Inténtalo nuevamente.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: 24 + insets.bottom }]}>
        <View style={styles.headerRow}>
          <Pressable hitSlop={12} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.h1}>Perfil</Text>
        </View>

        <View style={styles.card}> 
          <View style={{ alignItems:'center', marginBottom: 18 }}>{preview}</View>

          <Text style={[styles.label, { marginBottom: 8 }]}>Color</Text>
          <View style={styles.colorRow}>
            {COLORS.map((c, i) => (
              <Pressable
                key={`${c}-${i}`}
                onPress={() => setColor(c)}
                style={({ pressed }) => [
                  styles.colorDot,
                  {
                    backgroundColor: c,
                    borderWidth: c === color ? 2 : 0,
                    borderColor: '#FFF',
                    transform: [{ scale: pressed ? 0.95 : c === color ? 1.05 : 1 }],
                  },
                ]}
              />
            ))}
          </View>

          <Text style={[styles.label, { marginTop: 10, marginBottom: 8 }]}>Icono</Text>
          <View style={styles.iconGrid}>
            {ICONS.map((name, idx) => (
              <Pressable
                key={`${String(name)}-${idx}`}
                onPress={() => setIcon(name)}
                style={[styles.iconCell, { borderColor: name === icon ? '#FFFFFF' : 'transparent' }]}
              >
                <View style={styles.iconCircle}>
                  <Ionicons name={name} size={18} color="#CFCFCF" />
                </View>
              </Pressable>
            ))}
          </View>

          <View style={styles.fieldBlock}>
            <Text style={[styles.label, { marginTop: 12 }]}>Usuario</Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="Tu usuario"
              placeholderTextColor="#9E9EA0"
              style={styles.input}
            />
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Correo electrónico</Text>
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

          <Pressable onPress={onSave} style={({ pressed }) => [styles.primaryBtn, { opacity: pressed ? 0.9 : 1 }]}>
            <Text style={styles.primaryText}>Confirmar</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'black' },
  scroll: { paddingHorizontal: 20, paddingTop: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  h1: { color: 'white', fontSize: 32, fontFamily: fonts.semibold, marginLeft: 12 },
  card: { backgroundColor: '#1F1F22', borderRadius: 18, padding: 20, borderWidth: 1, borderColor: '#2A2A32' },
  preview: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 },
  colorDot: { width: 30, height: 30, borderRadius: 15, marginRight: 10, marginBottom: 10 },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  iconCell: { width: '16.66%', padding: 6, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 12, marginBottom: 6 },
  iconCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#2B2B2E', alignItems: 'center', justifyContent: 'center' },
  fieldBlock: { alignSelf: 'stretch', marginTop: 6 },
  label: { color: 'white', fontFamily: fonts.semibold },
  input: {
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: 'white',
    fontFamily: fonts.regular,
    marginTop: 6,
  },
  primaryBtn: {
    marginTop: 16,
    height: 46,
    borderRadius: 18,
    backgroundColor: '#A6FF00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: '#111', fontFamily: fonts.semibold, fontSize: 16 },
});


