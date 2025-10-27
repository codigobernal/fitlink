import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

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
          <Text style={styles.body}>
            {`Este aviso describe cómo FitLink recopila, usa y protege tus datos personales. 
Recopilamos datos que proporcionas en el registro (nombre, correo) y datos generados por el dispositivo (lecturas de actividad y métricas de rendimiento). 
Usamos esta información para ofrecer análisis, mejorar la experiencia y mantener la seguridad. 
Puedes solicitar acceso, corrección o eliminación de tus datos en cualquier momento. 
Para más información, contacta a contacto@fitlink.com.`}
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

