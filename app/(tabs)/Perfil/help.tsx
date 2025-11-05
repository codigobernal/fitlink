import React from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { fonts } from '../../../constants/fonts';

export default function Help() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <Pressable hitSlop={12} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.h1}><Text style={styles.boldText}>Ayuda</Text></Text>
        </View>

        <View style={[styles.card, { padding: 20 }]}> 
          <Text style={styles.body}>
          <Text style={styles.h4}><Text style={styles.boldText}>¿Tienes dudas sobre el funcionamiento del chaleco inteligente o la aplicación móvil?</Text></Text>
            {`

En FitLink queremos brindarte la mejor experiencia posible.

📘 Guía rápida:`}

    <View style={styles.listContainer}>
      <View style={styles.listItem}>
        <Text style={styles.bullet}>•</Text>
        <Text style={styles.bulletText}>Asegúrate de que el chaleco esté conectado vía Wi-Fi.</Text>
      </View>
      <View style={styles.listItem}>
        <Text style={styles.bullet}>•</Text>
        <Text style={styles.bulletText}>Revisa que las métricas en la app se actualicen en tiempo real.</Text>
      </View>
      <View style={styles.listItem}>
        <Text style={styles.bullet}>•</Text>
        <Text style={styles.bulletText}>Si no ves datos, reinicia el dispositivo o vuelve a emparejar.</Text>
      </View>
    </View>
{`
💡 Consejos útiles:`}

    <View style={styles.listContainer}>
      <View style={styles.listItem}>
        <Text style={styles.bullet}>•</Text>
        <Text style={styles.bulletText}>Mantén el chaleco cargado antes de entrenar.</Text>
      </View>
      <View style={styles.listItem}>
        <Text style={styles.bullet}>•</Text>
        <Text style={styles.bulletText}>Usa la app durante la actividad para obtener métricas precisas.</Text>
      </View>
      <View style={styles.listItem}>
        <Text style={styles.bullet}>•</Text>
        <Text style={styles.bulletText}>Consulta el historial para revisar tus progresos.</Text>
      </View>
    </View>
{`
📩 ¿Necesitas mas ayuda?
Email: `}
  <Text style={styles.italicsText}>soporte@fitlink.com</Text>
{`
Web: `}
  <Text style={styles.italicsText}>www.fitlink.com/ayuda</Text>
          </Text>
<Text style={styles.body}>
{`
Nuestro equipo de soporte técnico está disponible de lunes a viernes de 9:00 a 18:00 hrs (GMT-6).
Gracias por confiar en FitLink, tu compañero inteligente para alcanzar el máximo rendimiento.`}
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
  h1: { color: 'white', fontSize: 32, fontFamily: fonts.semibold, marginTop: 10, marginBottom: 10 },
  card: { backgroundColor: '#1C1C1E', borderRadius: 18 },
  body: { color: 'white', fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 },
});

