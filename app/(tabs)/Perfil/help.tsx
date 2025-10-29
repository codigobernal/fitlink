import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function Help() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <Pressable hitSlop={12} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.h1}>Ayuda</Text>
        </View>

        <View style={[styles.card, { padding: 20 }]}> 
          <Text style={styles.body}>
            {`En FitLink queremos brindarte la mejor experiencia posible.

📘 Guia rapida:
• Asegurate de que el chaleco este conectado via WiFi.
• Revisa que las metricas en la app se actualicen en tiempo real.
• Si no ves datos, reinicia el dispositivo o vuelve a emparejar.

💡 Consejos utiles:
• Mantén el chaleco cargado antes de entrenar.
• Usa la app durante la actividad para obtener metricas precisas.
• Consulta el historial para revisar tus progresos.

📩 ¿Necesitas mas ayuda?
• Email: soporte@fitlink.com
• Web: www.fitlink.com/ayuda

Soporte disponible L-V de 9:00 a 18:00 (GMT-6).
Gracias por confiar en FitLink.`}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'black' },
  scroll: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  h1: { color: 'white', fontSize: 32, fontFamily: 'SFProRounded-Semibold', marginTop: 10, marginBottom: 10 },
  card: { backgroundColor: '#1C1C1E', borderRadius: 18 },
  body: { color: 'white', fontFamily: 'SFProRounded-Regular', fontSize: 13, lineHeight: 19 },
});
