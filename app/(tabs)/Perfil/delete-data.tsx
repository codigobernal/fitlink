import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { deleteUser, getAuth } from 'firebase/auth';
import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fonts } from '../../../constants/fonts';
import { auth } from '../../../firebaseConfig.js';

/* -------------------------------------------------------------------------- */
/*                            COMPONENTE PRINCIPAL                            */
/* -------------------------------------------------------------------------- */
export default function DeleteData() {
  /* ------------------------------- Estados UI ------------------------------ */
  const [confirm, setConfirm] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  /* --------------------------- Valores derivados --------------------------- */
  const enabled = confirm === 'ELIMINAR';
  const currentEmail = useMemo(() => auth.currentUser?.email ?? '', []);

  /* -------------------------------------------------------------------------- */
  /*                       HANDLER: ELIMINAR CUENTA                            */
  /* -------------------------------------------------------------------------- */
  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      const authInstance = getAuth();
      const user = authInstance.currentUser;

      if (user) {
        await deleteUser(user);
        setModalVisible(false);
        router.replace('/(auth)');
      }
    } catch (error) {
      console.error('Error al eliminar la cuenta:', error);
      setModalVisible(false);
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                                RENDER UI                                  */
  /* -------------------------------------------------------------------------- */
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* --------------------------- Encabezado --------------------------- */}
        <View style={styles.headerRow}>
          <Pressable hitSlop={12} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </Pressable>

          <Text style={styles.h1}>
            <Text style={styles.boldText}>Borrar datos</Text>
          </Text>
        </View>

        {/* ---------------------- Tarjeta de advertencia ---------------------- */}
        <View style={styles.card}>
          <Text style={styles.body}>
            {`Al continuar, se eliminarán todos los datos almacenados en tu cuenta FitLink, incluyendo historiales y configuraciones. Esta acción no se puede deshacer.`}
          </Text>

          <Text style={[styles.body, { marginTop: 12 }]}>
            Escribe <Text style={styles.boldText}>ELIMINAR</Text> para confirmar:
          </Text>

          {/* ------------------------------ Input ------------------------------ */}
          <TextInput
            value={confirm}
            onChangeText={setConfirm}
            placeholder="ELIMINAR"
            placeholderTextColor="#9E9EA0"
            style={styles.input}
            autoCapitalize="characters"
            autoCorrect={false}
          />

          <Text
            style={[
              styles.helper,
              { color: confirm && !enabled ? '#FF6B6B' : '#9E9EA0' },
            ]}
          >
            Debe coincidir exactamente en mayúsculas.
          </Text>

          {/* ---------------------- Botón de confirmación ---------------------- */}
          <Pressable
            disabled={!enabled}
            onPress={() => enabled && setModalVisible(true)}
            style={({ pressed }) => [
              styles.primaryBtn,
              { opacity: enabled ? (pressed ? 0.9 : 1) : 0.4 },
            ]}
          >
            <Text style={styles.primaryText}>Confirmar</Text>
          </Pressable>
        </View>

        {/* ---------------------- Información de la sesión ---------------------- */}
        {currentEmail ? (
          <View style={[styles.card, { marginTop: 16 }]}>
            <Text style={[styles.body, { opacity: 0.6 }]}>
              Sesión actual: {currentEmail}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {/* ---------------------------------------------------------------------- */}
      {/*                          MODAL DE CONFIRMACIÓN                         */}
      {/* ---------------------------------------------------------------------- */}
      <Modal
        transparent
        animationType="fade"
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>Confirmar eliminación</Text>

            <Text
              style={[
                styles.modalText,
                {
                  fontWeight: 'normal',
                  fontSize: 14,
                  marginBottom: 25,
                },
              ]}
            >
              Se eliminará tu cuenta y todos los datos asociados. Esta acción no se puede deshacer.
            </Text>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancelar</Text>
              </Pressable>

              <Pressable
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={handleDeleteAccount}
                disabled={loading}
              >
                <Text style={styles.modalConfirmButtonText}>
                  {loading ? 'Eliminando...' : 'Eliminar'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   ESTILOS                                  */
/* -------------------------------------------------------------------------- */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'black' },
  scroll: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 24 },

  /* ------------------------------ Encabezado ------------------------------ */
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  h1: {
    color: 'white',
    fontSize: 32,
    fontFamily: fonts.semibold,
    marginTop: 10,
    marginBottom: 10,
    marginLeft: 8,
  },
  boldText: { fontWeight: 'bold' },

  /* ---------------------------- Tarjetas / UI ----------------------------- */
  card: {
    backgroundColor: '#1C1C1E',
    borderRadius: 18,
    padding: 20,
  },
  body: {
    color: 'white',
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  input: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: 'white',
    fontFamily: fonts.regular,
    letterSpacing: 1,
  },
  helper: {
    marginTop: 6,
    fontSize: 11,
    fontFamily: fonts.regular,
  },
  primaryBtn: {
    marginTop: 14,
    height: 46,
    borderRadius: 18,
    backgroundColor: '#A6FF00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: '#111',
    fontFamily: fonts.semibold,
    fontSize: 16,
  },

  /* --------------------------------- Modal -------------------------------- */
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
    backgroundColor: '#FF3B30',
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
});
