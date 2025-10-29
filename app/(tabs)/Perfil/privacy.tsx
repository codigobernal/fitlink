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
            {`Aviso de Privacidad Integral

Última actualización: 27/10/2025

1) Responsable y contacto

FitLink es responsable del tratamiento de tus datos personales.

2) Datos personales que tratamos

Registro de cuenta: nombre, correo electrónico.

Uso de la app y del dispositivo: lecturas de actividad y métricas de rendimiento (p. ej., frecuencia cardiaca, distancia, calorías, esfuerzo, movimiento).

Permisos del dispositivo (opcionales): ubicación u otros permisos necesarios para habilitar funciones concretas (p. ej., mapas de ruta o calibraciones).

Algunas métricas fisiológicas pueden considerarse datos personales sensibles. Solicitaremos tu consentimiento expreso antes de tratarlas.

3) Finalidades del tratamiento

Primarias (necesarias):
a) Operar tu cuenta y el dispositivo conectado.
b) Mostrar lecturas en tiempo real y generar análisis, reportes e historial de desempeño.
c) Brindar soporte, mantener la seguridad, prevenir fraudes y mejorar la estabilidad de la app.

Secundarias (opcionales):
a) Enviar avisos, mejoras de producto, encuestas o contenidos de entrenamiento.
b) Comunicaciones promocionales (si las aceptas).

Puedes negar o revocar tu consentimiento para finalidades secundarias en cualquier momento sin afectar las primarias.

4) Base legal y consentimiento

Tratamos tus datos con fundamento en:

Ejecución del servicio que solicitas (crear/administrar tu cuenta, operar el dispositivo).

Consentimiento (especialmente para datos sensibles y permisos como ubicación).

Interés legítimo en mantener la seguridad, prevenir abusos y mejorar la calidad del servicio.

5) Conservación de datos

Conservamos tus datos mientras tengas una cuenta activa. Si cierras tu cuenta, eliminamos o anonimizamos la información en un plazo razonable salvo que una obligación legal requiera conservarla por más tiempo (por ejemplo, registros técnicos para seguridad).

6) Medidas de seguridad

Aplicamos medidas administrativas, técnicas y físicas proporcionales al riesgo, incluyendo cifrado en tránsito, controles de acceso, registro de eventos y prácticas de desarrollo seguro para proteger tu información.

7) Transferencias y encargados

Podemos apoyarnos en proveedores (encargados) para alojamiento en la nube, analítica o soporte; éstos tratan datos sólo por instrucciones de FitLink y bajo confidencialidad. No vendemos tus datos. Si en algún momento fuera necesaria una transferencia que requiera tu consentimiento, te lo solicitaremos previamente.

8) Ejercicio de derechos y opciones de privacidad

Puedes ejercer tus derechos de acceso, rectificación, eliminación, así como oponerte o revocar tu consentimiento, y limitar el uso con fines no esenciales.
Cómo ejercerlos: escríbenos a contacto@fitlink.com indicando tu nombre, el derecho que deseas ejercer y un medio de contacto para responderte.
Dentro de la app podrás:

Desactivar ubicación o permisos opcionales.
Gestionar el envío de comunicaciones no esenciales.
Solicitar descarga o eliminación de tus datos (si la función está disponible en tu versión).

9) Menores de edad

El servicio no está dirigido a menores sin la autorización correspondiente. Si detectamos información de menores sin consentimiento válido, la eliminaremos.

10) Cambios al Aviso

Podemos actualizar este Aviso para reflejar ajustes regulatorios o mejoras del servicio. Publicaremos la versión vigente dentro de la app y/o en nuestro sitio, indicando la fecha de última actualización.

11) Contacto

Para dudas, comentarios o solicitudes de privacidad, contáctanos en contacto@fitlink.com.`}
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

