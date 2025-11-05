import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { deleteUser, getAuth } from 'firebase/auth'; // 👈 Import necesario
import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { Modal } from '../modal';

export default function DeleteData() {
  const [confirm, setConfirm] = useState('');
  const [isModalVisible, setModalVisible] = useState(false);
  const enabled = confirm.trim().toUpperCase() === 'ELIMINAR';

  const handleConfirmPress = () => {
    if (enabled) {
      setModalVisible(true);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  // 🔥 Lógica para eliminar la cuenta
  const handleDeleteAccount = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (user) {
        await deleteUser(user);
        Alert.alert('Cuenta eliminada', 'Tu cuenta ha sido eliminada correctamente.');
        router.replace('/(auth)');
      }
    } catch (error: any) {
      console.error('Error al eliminar la cuenta:', error);
      Alert.alert(
        'Error',
        'No se pudo eliminar la cuenta. Es posible que necesites volver a iniciar sesión para confirmar la eliminación.'
      );
    } finally {
      closeModal();
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <Pressable hitSlop={12} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.h1}>
            <Text style={styles.boldText}>Borrar datos</Text>
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.body}>
            {`Al continuar, se eliminarán todos los datos almacenados en tu cuenta FitLink, incluyendo historiales y configuraciones. Esta acción no se puede deshacer.
            
Escribe ELIMINAR para confirmar:`}
          </Text>
          <TextInput
            value={confirm}
            onChangeText={setConfirm}
            placeholder="ELIMINAR"
            placeholderTextColor="#9E9EA0"
            style={styles.input}
          />
          <Pressable
            disabled={!enabled}
            onPress={handleConfirmPress}
            style={({ pressed }) => [
              styles.primaryBtn,
              { opacity: enabled ? (pressed ? 0.9 : 1) : 0.4 },
            ]}
          >
            <Text style={styles.primaryText}>Confirmar</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        isOpen={isModalVisible}
        withInput={false}
        onRequestClose={closeModal}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalText}>¿Quieres eliminar todos los datos?</Text>
          <View style={styles.modalActions}>
            <Pressable
              style={[styles.modalButton, styles.modalCancelButton]}
              onPress={closeModal}
            >
              <Text style={styles.modalButtonText}>Cancelar</Text>
            </Pressable>
            <Pressable
              style={[styles.modalButton, styles.modalDeleteButton]}
              onPress={handleDeleteAccount} // 👈 Aquí se llama la función
            >
              <Text style={styles.modalButtonText}>Eliminar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'black' },
  scroll: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  h1: { color: 'white', fontSize: 32, fontFamily: fonts.semibold, marginTop: 10, marginBottom: 10 },
  card: { backgroundColor: '#1C1C1E', borderRadius: 18, padding: 20 },
  body: { color: 'white', fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  input: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: 'white',
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
  primaryText: { color: '#111', fontFamily: 'SFProRounded-Semibold', fontSize: 16 },
  boldText: { fontWeight: 'bold' },
  modalContent: {
    backgroundColor: '#1e1e1e',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalText: { color: 'white', fontSize: 16, marginBottom: 20, fontWeight: 'bold' },
  modalActions: { flexDirection: 'row', gap: 10, backgroundColor: '#1e1e1e' },
  modalButton: {
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#1e1e1e',
  },
  modalDeleteButton: { backgroundColor: '#FF3B30', color: '#fff' },
  modalCancelButton: { backgroundColor: '#444' },
  modalButtonText: { color: '#fff', fontWeight: 'bold' },
});

