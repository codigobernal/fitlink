import React from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { fonts } from '../../../constants/fonts';

export default function Privacy() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <Pressable hitSlop={12} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.h1}>Aviso de privacidad</Text>
        </View>
        <View style={[styles.card, { padding: 20 }]}> 
          <Text style={styles.h4}><Text style={styles.boldText}>Aviso de Privacidad Integral</Text></Text>
          <Text style={styles.updateText}>Última actualización: 27/10/2025</Text>
          <Text style={styles.body}>
            FitLink es responsable del tratamiento de tus datos personales. Tratamos datos como nombre, correo y métricas del dispositivo para operar tu cuenta, mostrar lecturas y brindar soporte. Algunas métricas pueden considerarse sensibles; solicitaremos tu consentimiento cuando aplique.
          </Text>
          <Text style={[styles.body, styles.boldText]}>Tus opciones</Text>
          <View style={styles.listContainer}>
            <View style={styles.listItem}><Text style={styles.bullet}>•</Text><Text style={styles.bulletText}>Acceder, rectificar o eliminar tus datos.</Text></View>
            <View style={styles.listItem}><Text style={styles.bullet}>•</Text><Text style={styles.bulletText}>Revocar consentimiento para finalidades no esenciales.</Text></View>
            <View style={styles.listItem}><Text style={styles.bullet}>•</Text><Text style={styles.bulletText}>Limitar permisos del dispositivo (ej. ubicación).</Text></View>
          </View>
          <Text style={styles.body}>Contacto: <Text style={styles.italicsText}>contacto@fitlink.com</Text></Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'black' },
  scroll: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  h1: { color: 'white', fontSize: 32, fontFamily: fonts.semibold, marginTop: 10, marginBottom: 10 },
  card: { backgroundColor: '#1C1C1E', borderRadius: 18 },
  body: { color: 'white', fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, marginTop: 8 },
  listContainer: { paddingLeft: 3, marginBottom: 3, marginTop: 8 },
  listItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6, paddingLeft: 16 },
  bullet: { fontSize: 18, lineHeight: 20, marginRight: 8 },
  bulletText: { flex: 1, fontSize: 13, lineHeight: 20, color: 'white', fontFamily: fonts.regular },
  h4: { color: 'white', fontSize: 16, fontFamily: fonts.semibold, marginTop: 10, marginBottom: 10 },
  italicsText: { fontStyle: 'italic' },
  updateText: { fontStyle: 'italic', fontSize: 11, color: '#D2C3C3' },
  boldText: { fontWeight: 'bold' },
});

