import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function About() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <Pressable hitSlop={12} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.h1}><Text style={styles.boldText}>Acerca de nosotros</Text></Text>
        </View>

        <View style={[styles.card, { padding: 20 }]}> 
          <Text style={styles.body}>
  {`En FitLink creemos que la tecnología puede transformar la forma en que los deportistas entienden su rendimiento. Somos un equipo comprometido con crear soluciones inteligentes que impulsen el rendimiento humano al siguiente nivel.

Nuestro chaleco inteligente, equipado con sensores de última generación, monitorea en tiempo real frecuencia cardíaca, temperatura corporal, movimiento y esfuerzo físico. Todos los datos se sincronizan con la app para ofrecer analisis detallados, reportes personalizados y seguimiento del progreso.

Objetivo: fusionar innovación, salud y rendimiento para ayudar a cada deportista a entrenar con propósito y alcanzar su máximo potencial.

🌐 Más información: `}
  <Text style={styles.italicsText}>www.fitlink.com</Text>
  {`
📧 Contacto: `}
  <Text style={styles.italicsText}>contacto@fitlink.com</Text>
</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'black' },
  scroll: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  h1: { color: 'white', fontSize: 32, fontFamily: 'SFProRounded-Semibold', flexShrink: 1, marginTop: 10, marginBottom: 10 },
  card: { backgroundColor: '#1C1C1E', borderRadius: 18 },
  body: { color: 'white', fontFamily: 'SFProRounded-Regular', fontSize: 13, lineHeight: 19 },
  italicsText: {
    fontStyle: 'italic',
  },
   boldText: {
    fontWeight: 'bold',
  },
});
