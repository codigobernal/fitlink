<<<<<<< HEAD
import React from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { fonts } from '../../../constants/fonts';
=======
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
>>>>>>> 3d2ccb904715937ee2604dd284f3644562de328b

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
          <Text style={styles.h4}><Text style={styles.boldText}>📃 Aviso de Privacidad Integral</Text></Text>
          {`
`}
          <Text style={styles.updateText}>Última actualización: 27/10/2025</Text>
{`

`}
<Text style={styles.boldText}>1. Responsable y contacto</Text>
            {`
FitLink es responsable del tratamiento de tus datos personales.

`}
<Text style={styles.boldText}>2. Datos personales que tratamos</Text>

    <View style={styles.listContainer}>
      <View style={styles.listItem}>
        <Text style={styles.bullet}>•</Text>
        <Text style={styles.bulletText}>Registro de cuenta: nombre, correo electrónico.</Text>
      </View>
      <View style={styles.listItem}>
        <Text style={styles.bullet}>•</Text>
        <Text style={styles.bulletText}>Uso de la app y del dispositivo: lecturas de actividad y métricas de rendimiento (p. ej., frecuencia cardiaca, distancia, calorías, esfuerzo, movimiento).</Text>
      </View>
      <View style={styles.listItem}>
        <Text style={styles.bullet}>•</Text>
        <Text style={styles.bulletText}>Permisos del dispositivo (opcionales): ubicación u otros permisos necesarios para habilitar funciones concretas (p. ej., mapas de ruta o calibraciones).</Text>
      </View>
      <View style={styles.listItem}>
        <Text style={styles.bullet}>•</Text>
        <Text style={styles.bulletText}>Algunas métricas fisiológicas pueden considerarse datos personales sensibles. Solicitaremos tu consentimiento expreso antes de tratarlas.</Text>
      </View>
    </View>
            {`
`}
<Text style={styles.boldText}>3. Finalidades del tratamiento</Text>
{`
Primarias (necesarias):`}

    <View style={styles.listContainer}>
      <View style={styles.listItem}>
        <Text style={styles.bullet}>•</Text>
        <Text style={styles.bulletText}>Operar tu cuenta y el dispositivo conectado.</Text>
      </View>
      <View style={styles.listItem}>
        <Text style={styles.bullet}>•</Text>
        <Text style={styles.bulletText}>Mostrar lecturas en tiempo real y generar análisis, reportes e historial de desempeño.</Text>
      </View>
      <View style={styles.listItem}>
        <Text style={styles.bullet}>•</Text>
        <Text style={styles.bulletText}>Brindar soporte, mantener la seguridad, prevenir fraudes y mejorar la estabilidad de la app.</Text>
      </View>
    </View>
{`
Secundarias (opcionales):`}

  <View style={styles.listContainer}>
      <View style={styles.listItem}>
        <Text style={styles.bullet}>•</Text>
        <Text style={styles.bulletText}>Enviar avisos, mejoras de producto, encuestas o contenidos de entrenamiento.</Text>
      </View>
      <View style={styles.listItem}>
        <Text style={styles.bullet}>•</Text>
        <Text style={styles.bulletText}>Comunicaciones promocionales (si las aceptas).</Text>
      </View>
    </View>
{`
Puedes negar o revocar tu consentimiento para finalidades secundarias en cualquier momento sin afectar las primarias.

`}
<Text style={styles.boldText}>4. Base legal y consentimiento</Text>
{`
Tratamos tus datos con fundamento en:`}
  <View style={styles.listContainer}>
      <View style={styles.listItem}>
        <Text style={styles.bullet}>•</Text>
        <Text style={styles.bulletText}>Ejecución del servicio que solicitas (crear/administrar tu cuenta, operar el dispositivo).</Text>
      </View>
      <View style={styles.listItem}>
        <Text style={styles.bullet}>•</Text>
        <Text style={styles.bulletText}>Consentimiento (especialmente para datos sensibles y permisos como ubicación).</Text>
      </View>
      <View style={styles.listItem}>
        <Text style={styles.bullet}>•</Text>
        <Text style={styles.bulletText}>Interés legítimo en mantener la seguridad, prevenir abusos y mejorar la calidad del servicio.</Text>
      </View>
    </View>
 {`
`}
<Text style={styles.boldText}>5. Conservación de datos</Text>
{`
Conservamos tus datos mientras tengas una cuenta activa. Si cierras tu cuenta, eliminamos o anonimizamos la información en un plazo razonable salvo que una obligación legal requiera conservarla por más tiempo (por ejemplo, registros técnicos para seguridad).

`}
<Text style={styles.boldText}>6. Medidas de seguridad</Text>
 {`
 Aplicamos medidas administrativas, técnicas y físicas proporcionales al riesgo, incluyendo cifrado en tránsito, controles de acceso, registro de eventos y prácticas de desarrollo seguro para proteger tu información.

`}
<Text style={styles.boldText}>7. Transferencias y encargados</Text>
 {`
Podemos apoyarnos en proveedores (encargados) para alojamiento en la nube, analítica o soporte; éstos tratan datos sólo por instrucciones de FitLink y bajo confidencialidad. No vendemos tus datos. Si en algún momento fuera necesaria una transferencia que requiera tu consentimiento, te lo solicitaremos previamente.

`}
<Text style={styles.boldText}>8. Ejercicio de derechos y opciones de privacidad</Text>
{`
Puedes ejercer tus derechos de acceso, rectificación, eliminación, así como oponerte o revocar tu consentimiento, y limitar el uso con fines no esenciales.

Cómo ejercerlos: escríbenos a contacto@fitlink.com indicando tu nombre, el derecho que deseas ejercer y un medio de contacto para responderte.

Dentro de la app podrás:
`}
  <View style={styles.listContainer}>
      <View style={styles.listItem}>
        <Text style={styles.bullet}>•</Text>
        <Text style={styles.bulletText}>Desactivar ubicación o permisos opcionales.</Text>
      </View>
      <View style={styles.listItem}>
        <Text style={styles.bullet}>•</Text>
        <Text style={styles.bulletText}>Gestionar el envío de comunicaciones no esenciales.</Text>
      </View>
      <View style={styles.listItem}>
        <Text style={styles.bullet}>•</Text>
        <Text style={styles.bulletText}>Solicitar descarga o eliminación de tus datos (si la función está disponible en tu versión).</Text>
      </View>
    </View>
{`
Conservamos tus datos mientras tengas una cuenta activa. Si cierras tu cuenta, eliminamos o anonimizamos la información en un plazo razonable salvo que una obligación legal requiera conservarla por más tiempo (por ejemplo, registros técnicos para seguridad).

`}
<Text style={styles.boldText}>9. Menores de edad</Text>
 {`
 El servicio no está dirigido a menores sin la autorización correspondiente. Si detectamos información de menores sin consentimiento válido, la eliminaremos.

`}
<Text style={styles.boldText}>10. Cambios al Aviso</Text>
 {`
Podemos actualizar este Aviso para reflejar ajustes regulatorios o mejoras del servicio. Publicaremos la versión vigente dentro de la app y/o en nuestro sitio, indicando la fecha de última actualización.

`}
<Text style={styles.boldText}>11. Contacto</Text>
{`
Para dudas, comentarios o solicitudes de privacidad, contáctanos en `}<Text style={styles.italicsText}> contacto@fitlink.com.</Text>
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
<<<<<<< HEAD
  body: { color: 'white', fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 },
=======
  body: { color: 'white', fontFamily: 'SFProRounded-Regular', fontSize: 13, lineHeight: 19 },
  listContainer: {
    paddingLeft: 3,
    marginBottom: 3,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 5,
    paddingLeft: 20,
  },
  bullet: {
    fontSize: 18,
    lineHeight: 24,
    marginRight: 8,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 24,
  },
  h4: { color: 'white', fontSize: 16, fontFamily: 'SFProRounded-Semibold', marginTop: 10, marginBottom: 10},
  italicsText: {
    fontStyle: 'italic',
  },
  updateText: {
    fontStyle: 'italic',
    fontSize: 11,
    color: '#D2C3C3',
  },
  boldText: {
    fontWeight: 'bold',
  },
>>>>>>> 3d2ccb904715937ee2604dd284f3644562de328b
});


