import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location'; // Importamos expo-location
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// Asegúrate de que AuthBackground sea accesible o reemplaza con un componente de fondo si es necesario
// import AuthBackground from '@/components/auth/AuthBackground'; 
import { fonts } from '../../constants/fonts';

// Simulación de AuthBackground si no está disponible
const AuthBackground = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.backgroundContainer}>{children}</View>
);

export default function Connect() {
  const scale = 1;

  // Estado del dispositivo de fitness (simulado)
  const [connected, setConnected] = useState(true);
  
  // Estado para el permiso de geolocalización
  const [locationPermissionStatus, setLocationPermissionStatus] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [loadingLocation, setLoadingLocation] = useState(false);

  // --- FUNCIÓN PARA SOLICITAR EL PERMISO DE UBICACIÓN ---
  const requestLocationPermission = async () => {
    setLoadingLocation(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status === 'granted') {
      setLocationPermissionStatus('granted');
    } else {
      setLocationPermissionStatus('denied');
      Alert.alert(
        "Permiso de Ubicación Necesario",
        "Tu aplicación necesita acceso a la ubicación para registrar las rutas de actividad. Por favor, actívalo en la configuración de tu dispositivo."
      );
    }
    setLoadingLocation(false);
  };
  
  // --- EFECTO: Solicitar permiso al cargar la pantalla ---
  useEffect(() => {
    // Solo si el permiso está pendiente de ser solicitado (al inicio)
    if (locationPermissionStatus === 'pending') {
      requestLocationPermission();
    }
  }, [locationPermissionStatus]);
  
  // Condición para habilitar el botón Continuar
  const canContinue = connected && locationPermissionStatus === 'granted';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <AuthBackground>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* --- CARD DE PERMISO DE UBICACIÓN --- */}
          <View style={styles.card}>
            <Text style={[styles.cardTitle, { fontSize: 16 * scale }]}>Permiso de Ubicación (Rutas)</Text>
            
            <View style={styles.permissionStatus}>
              {locationPermissionStatus === 'granted' ? (
                <View style={styles.permissionOk}>
                  <Ionicons name="location-sharp" size={24} color="#A6FF00" />
                  <Text style={styles.permissionOkText}>Permiso OTORGADO.</Text>
                </View>
              ) : (
                <View style={styles.permissionDenied}>
                  <Ionicons name="warning" size={24} color="#FF6B6B" />
                  <Text style={styles.permissionDeniedText}>Permiso REQUERIDO.</Text>
                  <Pressable 
                    onPress={requestLocationPermission} 
                    disabled={loadingLocation}
                    style={styles.requestButton}
                  >
                    {loadingLocation ? (
                      <ActivityIndicator color="#111" />
                    ) : (
                      <Text style={styles.requestButtonText}>Solicitar Acceso</Text>
                    )}
                  </Pressable>
                </View>
              )}
            </View>
          </View>

          {/* --- CTA CONTINUAR --- */}
          <Pressable 
            disabled={!canContinue} 
            onPress={() => router.replace('/(tabs)')} 
            style={({ pressed }) => [
              styles.continueButton, 
              { opacity: !canContinue ? 0.4 : pressed ? 0.9 : 1 }
            ]}
          >
            <Text style={styles.continueButtonText}>Continuar</Text>
          </Pressable>
        </ScrollView>
      </AuthBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'black' },
  backgroundContainer: { flex: 1, backgroundColor: 'black' }, // Simulación de AuthBackground
  scrollContent: { padding: 20, paddingTop: 24, flexGrow: 1, justifyContent: 'center' },
  title: { color: 'white', fontFamily: fonts.semibold, alignSelf: 'center', marginBottom: 20, fontWeight: 'bold' },
  card: { backgroundColor: '#1C1C1E', borderRadius: 13, padding: 16, marginTop: 16 },
  cardTitle: { color: 'white', fontFamily: fonts.semibold, marginBottom: 10 },
  deviceStatusRow: { flexDirection: 'row', alignItems: 'center' },
  deviceIcon: { 
    width: 80, 
    height: 80, 
    borderRadius: 999, 
    backgroundColor: 'white', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: 15 
  },
  deviceScreen: { 
    width: 40, 
    height: 26, 
    backgroundColor: '#111', 
    borderRadius: 4, 
    opacity: 0.9 
  },
  statusContainer: { flex: 1 },
  statusLabel: { color: 'white', marginBottom: 8, fontFamily: fonts.semibold },
  statusBadges: { flexDirection: 'row', gap: 10 },
  badge: { flex: 1, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  badgeConnected: { backgroundColor: '#16A34A' },
  badgeDisconnected: { backgroundColor: '#5B1212' },
  badgeDisabled: { backgroundColor: '#0B3D1E' },
  badgeError: { backgroundColor: '#EF4444' },
  badgeText: { color: 'white', fontSize: 12 },
  caption: { color: '#BDBDBD', opacity: 0.8, fontSize: 10, marginTop: 8 },
  connectButton: { marginTop: 12, alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999 },
  
  // Estilos de Permiso de Ubicación
  permissionStatus: { marginTop: 10 },
  permissionOk: { flexDirection: 'row', alignItems: 'center', padding: 8, backgroundColor: 'rgba(166, 255, 0, 0.15)', borderRadius: 8 },
  permissionOkText: { color: '#A6FF00', marginLeft: 10, fontFamily: fonts.semibold },
  permissionDenied: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 8, 
    backgroundColor: 'rgba(255, 107, 107, 0.15)', 
    borderRadius: 8 
  },
  permissionDeniedText: { color: '#FF6B6B', marginLeft: 10, fontFamily: fonts.semibold, flexShrink: 1 },
  requestButton: { 
    backgroundColor: '#FFD166', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 12,
    marginLeft: 10
  },
  requestButtonText: { color: '#111', fontSize: 12, fontFamily: fonts.semibold },

  // Estilos de Continuar
  continueButton: { 
    backgroundColor: '#A6FF00', 
    height: 46, 
    borderRadius: 16, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 24,
  },
  continueButtonText: { color: 'black', fontFamily: fonts.semibold, fontSize: 18 * 1 },
});