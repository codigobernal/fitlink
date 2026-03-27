import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { onValue, ref } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts } from '../../../constants/fonts';
import { useAuth } from '../../../context/AuthContext';
import { auth, db } from '../../../firebaseConfig.js';
 
const OPTION_STYLES = {
  change: { background: '#3d300eff', color: '#FFD166' },
  delete: { background: '#3d0c0cff', color: '#FF6B6B' },
  about: { background: '#093a09ff', color: '#A6FF00' },
  help: { background: '#0c243eff', color: '#7AD7FF' },
} as const;
 
type ProfileIcon = { name?: keyof typeof Ionicons.glyphMap; color?: string };
 
export default function Informacion() {
  const insets = useSafeAreaInsets();
  const { setUser } = useAuth();
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [name, setName] = useState<string | null>(auth.currentUser?.displayName ?? null);
  const [email, setEmail] = useState<string | null>(auth.currentUser?.email ?? null);
  const [profileIcon, setProfileIcon] = useState<ProfileIcon>({});
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('');
 
  useEffect(() => {
    let detachDb: undefined | (() => void);
    const offAuth = onAuthStateChanged(auth, (user) => {
      setName(user?.displayName ?? null);
      setEmail(user?.email ?? null);
      if (detachDb) { detachDb(); detachDb = undefined; }
      if (!user) return;
      const userRef = ref(db, `users/${user.uid}`);
      const unsubscribe = onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        if (data?.username) setName(String(data.username));
        if (data?.email) setEmail(String(data.email));
        if (data?.profileIcon) setProfileIcon({ name: data.profileIcon.name, color: data.profileIcon.color });
      });
      detachDb = unsubscribe;
    });
    return () => {
      offAuth();
      if (detachDb) detachDb();
    };
  }, []);

  const handleCloseSession = async () => {
  try {
    await signOut(auth);
    setUser(null);
    router.replace('/(auth)/login'); // Redirige a pantalla de login
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    setModalTitle('Error');
    setModalMessage('No se pudo cerrar la sesión. Inténtalo de nuevo.');
    setLogoutModalVisible(true);
  } finally {
    setLogoutModalVisible(false);
  }
};

 
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: 24 + insets.bottom }]}>
        <Text style={styles.h1}>Información</Text>
 
        <Pressable onPress={() => router.push('/(tabs)/Perfil/edit')} style={({ pressed }) => [styles.card, styles.row, { opacity: pressed ? 0.92 : 1 }]}>
          <View style={[styles.avatar, { backgroundColor: profileIcon.color || '#2B2B2E' }]}>
            <Ionicons name={profileIcon.name || 'person'} size={22} color="#111" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.name}>{name || '<usuario aquí>'}</Text>
            <Text style={styles.email}>{email || '<correo aquí>'}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
        </Pressable>
 
        <Option icon="key" label="Modificar contraseña" background={OPTION_STYLES.change.background} color={OPTION_STYLES.change.color} onPress={() => router.push('/(tabs)/Perfil/change-password')} />
        <Option icon="trash" label="Borrar datos" background={OPTION_STYLES.delete.background} color={OPTION_STYLES.delete.color} onPress={() => router.push('/(tabs)/Perfil/delete-data')} />
        {/* <Option icon="information-circle" label="Acerca de nosotros" background={OPTION_STYLES.about.background} color={OPTION_STYLES.about.color} onPress={() => router.push('/(tabs)/Perfil/about')} /> */}
        <Option icon="help-circle" label="Ayuda" background={OPTION_STYLES.help.background} color={OPTION_STYLES.help.color} onPress={() => router.push('/(tabs)/Perfil/help')} />
        <Option icon="document-text" label="Aviso de privacidad" background="rgba(58, 68, 13, 1)" color="#FFF700" onPress={() => router.push('/(tabs)/Perfil/privacy')} />
        <Option
          icon="log-out"
          label="Cerrar sesión"
          background="#3a0b3cff"
          color="#ff6bd5ff"
          onPress={() => setLogoutModalVisible(true)}
          />
      </ScrollView>

      {/* Modal de confirmación */}
            <Modal
                transparent
                animationType="fade"
                visible={logoutModalVisible}
                onRequestClose={() => setLogoutModalVisible(false)}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalText}>¿Deseas cerrar sesión?</Text>
      
                    <View style={styles.modalActions}>
                      <Pressable
                        style={[styles.modalButton, styles.modalCancelButton]}
                        onPress={() => setLogoutModalVisible(false)}
                      >
                        <Text style={styles.modalCancelButtonText}>Cancelar</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.modalButton, styles.modalConfirmButton]}
                        onPress={handleCloseSession}
                      >
                        <Text style={styles.modalConfirmButtonText}>Cerrar sesión</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </Modal>

              <Modal
                            transparent
                            animationType="fade"
                            visible={alertVisible}
                            onRequestClose={() => setAlertVisible(false)}
                          >
                            <View style={styles.alertOverlay}>
                              <View style={styles.alertBox}>
                                
                                {/* Botón X arriba */}
                                <Pressable style={styles.alertCloseButton} onPress={() => setAlertVisible(false)}>
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
 
type OptionProps = { icon: keyof typeof Ionicons.glyphMap; label: string; onPress?: () => void; background: string; color: string };
 
function Option({ icon, label, onPress, background, color }: OptionProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, styles.row, { opacity: pressed ? 0.85 : 1 }]}>
      <View style={[styles.optIcon, { backgroundColor: background }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={[styles.optionLabel, { marginLeft: 10 }]}>{label}</Text>
      <View style={{ flex: 1, marginLeft: 12 }} />
      <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
    </Pressable>
  );
}
 
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'black' },
  scroll: { paddingHorizontal: 20, paddingTop: 24 },
  h1: { color: 'white', fontSize: 32, fontFamily: fonts.semibold, marginTop: 10, marginBottom: 16, fontWeight: 'bold' },
  card: { backgroundColor: '#202023', borderRadius: 18, marginBottom: 12, borderWidth: 1, borderColor: '#2A2A32' },
  row: { padding: 16, flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  name: { color: 'white', fontFamily: fonts.semibold, fontSize: 16 },
  email: { color: '#9E9EA0', fontFamily: fonts.regular, fontSize: 13 },
  optIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  optionLabel: { color: 'white', fontFamily: fonts.regular, fontSize: 17 },
  modalOverlay: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    backgroundColor: '#1e1e1e',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: '85%',
  },
  modalText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalButton: {
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalConfirmButton: {
    backgroundColor: '#620055ff',
  },
  modalCancelButton: {
    backgroundColor: '#444',
  },
  modalConfirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalCancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },

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