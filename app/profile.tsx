import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { updateProfile } from 'firebase/auth';
import { onValue, ref, update } from 'firebase/database';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts } from '../constants/fonts';
import { useAuth } from '../context/AuthContext';
import { auth, db } from '../firebaseConfig.js';

const COLORS = [
  '#A6FF00',
  '#7AD7FF',
  '#FF6B6B',
  '#FFD166',
  '#C084FC',
  '#34C759',
  '#0A84FF',
  '#FF9F0A'
] as const;

const ICONS = [
    'person', 
    'happy', 
    'walk-sharp', // Usamos el sufijo 'sharp' que es común
    'body',       // Reemplazo genérico para 'run'
    'bicycle', 
    'football',   // Reemplazo más genérico que 'football-sharp'
    'pulse', 
    'map', 
    'navigate', 
    'shield-checkmark', 
    'star', 
    'heart'
] as const; 

type CustomGlyph = (typeof ICONS)[number] & keyof typeof Ionicons.glyphMap;

export default function EditProfile() {
  const insets = useSafeAreaInsets();
  const { user, loading, setUser } = useAuth();
  const fallback = auth.currentUser;

  const uid = useMemo(() => user?.uid ?? fallback?.uid ?? null, [
    user?.uid,
    fallback?.uid
  ]);

  const [username, setUsername] = useState(
    user?.username ?? fallback?.displayName ?? ''
  );
  const [email, setEmail] = useState(
    user?.email ?? fallback?.email ?? ''
  );
  const [color, setColor] = useState<string>(COLORS[0]);
  const [icon, setIcon] = useState<CustomGlyph>('person');
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('');

  useEffect(() => {
    if (!loading && !uid) router.replace('/(auth)/login');
  }, [loading, uid]);

  useEffect(() => {
    if (!uid) return;

    const profileRef = ref(db, `users/${uid}`);
    const unsub = onValue(profileRef, (snap) => {
      const data = snap.val();
      if (data?.username) setUsername(String(data.username));
      if (data?.email) setEmail(String(data.email));
      if (data?.profileIcon?.color) setColor(String(data.profileIcon.color));
      if (data?.profileIcon?.name && ICONS.includes(data.profileIcon.name as CustomGlyph)) {
        setIcon(data.profileIcon.name as CustomGlyph);
      }
    });
    return () => unsub();
  }, [uid]);

  const handleSave = async () => {
    if (!uid) {
      Alert.alert('Sesión requerida', 'Inicia sesión para editar tu perfil.');
      return;
    }

    if (!username.trim() || !email.trim()) {
      setModalTitle('Campos incompletos');
      setModalMessage('Por favor llena todos los campos.');
      setModalVisible(true);
      return;
    }

    try {
      setSaving(true);

      await update(ref(db, `users/${uid}`), {
        username: username.trim(),
        email: email.trim(),
        profileIcon: { name: icon, color },
        theme: { accent: color }
      });

      setUser((prev) => {
        if (prev)
          return {
            ...prev,
            username: username.trim(),
            email: email.trim()
          };
        return { uid, username: username.trim(), email: email.trim() };
      });

      if (fallback && fallback.displayName !== username.trim()) {
        await updateProfile(fallback, {
          displayName: username.trim()
        }).catch(() => null);
      }

      setModalTitle('Guardado');
      setModalMessage('Tu perfil ha sido actualizado.');
      setModalVisible(true);
      router.back();
    } catch (error) {
      console.error('update profile', error);
      setModalTitle('Error');
      setModalMessage('No se pudo actualizar tu perfil.');
    } finally {
      setSaving(false);
    }
  };

  if (!uid) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: 24 + insets.bottom }
        ]}
      >
        <View style={styles.headerRow}>
          <Pressable hitSlop={12} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.h1}>
            <Text style={styles.boldText}>Perfil</Text>
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.avatarWrap}>
            <View style={[styles.avatar, { backgroundColor: color }]}>
              <Ionicons name={icon} size={60} color="#111" />
            </View>
          </View>

          <Text style={[styles.label, { alignSelf: 'flex-start' }]}>Color</Text>
          <View style={styles.colorRow}>
            {COLORS.map((c) => (
              <Pressable
                key={c}
                onPress={() => setColor(c)}
                style={[
                  styles.colorDot,
                  {
                    backgroundColor: c,
                    borderWidth: c === color ? 2 : 0,
                    borderColor: '#FFFFFF'
                  }
                ]}
              />
            ))}
          </View>

          <Text style={[styles.label, { alignSelf: 'flex-start', marginTop: 12 }]}>
            Icono
          </Text>
          <View style={styles.iconGrid}>
            {ICONS.map((name) => (
              <Pressable
                key={name}
                onPress={() => setIcon(name)}
                style={[
                  styles.iconCell,
                  { borderColor: name === icon ? '#FFFFFF' : 'transparent' }
                ]}
              >
                <View style={styles.iconCircle}>
                  <Ionicons name={name} size={20} color="#CFCFCF" />
                </View>
              </Pressable>
            ))}
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Usuario</Text>
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

          <Pressable
            style={({ pressed }) => [
              styles.primaryBtn,
              { opacity: pressed || saving ? 0.8 : 1 }
            ]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#111" />
            ) : (
              <Text style={styles.primaryText}>Confirmar</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>

      <Modal
              transparent
              animationType="fade"
              visible={modalVisible}
              onRequestClose={() => setModalVisible(false)}
            >
              <View style={styles.alertOverlay}>
                <View style={styles.alertBox}>
                  
                  {/* Botón X arriba */}
                  <Pressable style={styles.alertCloseButton} onPress={() => setModalVisible(false)}>
                    <Text style={styles.alertCloseButtonText}>✕</Text>
                  </Pressable>
                  {/* Título */}
                  <Text style={styles.alertTitle}>{modalTitle}</Text>
                  {/* Mensaje */}
                  <Text style={styles.alertMessage}>{modalMessage}
                  </Text>
                </View>
              </View>
            </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'black' },
  scroll: { paddingHorizontal: 20, paddingTop: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  h1: {
    color: 'white',
    fontSize: 32,
    fontFamily: fonts.semibold,
    marginTop: 10,
    marginBottom: 10
  },
  card: {
    backgroundColor: '#1C1C1E',
    borderRadius: 18,
    padding: 20
  },
  avatarWrap: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignSelf: 'center',
    marginBottom: 16
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center'
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignSelf: 'stretch',
    marginBottom: 12
  },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 10,
    marginBottom: 10
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignSelf: 'stretch',
    marginBottom: 12
  },
  iconCell: {
    width: '16.66%',
    padding: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 8
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2B2B2E',
    alignItems: 'center',
    justifyContent: 'center'
  },
  fieldBlock: { alignSelf: 'stretch', marginBottom: 14 },
  label: { color: 'white', fontFamily: fonts.semibold, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: 'white',
    fontFamily: fonts.regular
  },
  primaryBtn: {
    marginTop: 8,
    alignSelf: 'stretch',
    height: 46,
    borderRadius: 18,
    backgroundColor: '#A6FF00',
    alignItems: 'center',
    justifyContent: 'center'
  },
  primaryText: {
    color: '#111',
    fontFamily: fonts.semibold,
    fontSize: 16
  },
  boldText: { fontWeight: 'bold' },

  /* ------------------------------- Alert Modal ------------------------------- */

  alertOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },

  alertBox: {
    backgroundColor: '#1e1e1e',
    padding: 25,
    borderRadius: 12,
    width: '80%',
    alignItems: 'center',
    position: 'relative',
  },

  alertCloseButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 6,
  },

  alertCloseButtonText: {
    color: '#888',
    fontSize: 18,
  },

  alertTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },

  alertMessage: {
    color: '#ccc',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 25,
  },

  alertOkButton: {
    backgroundColor: '#444',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 30,
  },

  alertOkButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
