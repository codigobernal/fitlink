import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from 'firebase/auth';
import { onValue, ref, update } from 'firebase/database'; // Importar update y ref
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fonts } from '../../constants/fonts';
import { auth, db } from '../../firebaseConfig.js';

// Simulación de AuthBackground si no está disponible
const AuthBackground = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.backgroundContainer}>{children}</View>
);

// --- TIPOS DE DATOS REQUERIDOS ---
type BmiForm = { weight: string; height: string; age: string; sex: string };

// --- LÓGICA DE CÁLCULO MÍNIMA (Necesaria para validación) ---
function isNumeric(value: string | number | null | undefined): boolean {
    if (value === null || value === undefined || value === '') return false;
    return !Number.isNaN(parseFloat(String(value).replace(',', '.')));
}

export default function InitialMetrics() {
  const [bmiForm, setBmiForm] = useState<BmiForm>({ weight: '', height: '', age: '', sex: '' });
  const [loading, setLoading] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // --- OBTENER DATOS EXISTENTES Y VERIFICAR AUTENTICACIÓN ---
  useEffect(() => {
    const off = onAuthStateChanged(auth, (user) => {
        setIsAuthReady(true);
        if (user) {
            // Cargar métricas existentes si las hay
            const metricsRef = ref(db, `users/${user.uid}/metrics`);
            onValue(metricsRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    const weightVal = parseFloat(String(data.weight ?? '').replace(',', '.'));
                    const heightVal = parseFloat(String(data.height ?? '').replace(',', '.'));
                    const normalizedHeight = Number.isFinite(heightVal) ? (heightVal > 5 ? heightVal / 100 : heightVal) : NaN;
                    
                    setBmiForm({
                        weight: Number.isFinite(weightVal) && weightVal > 0 ? weightVal.toFixed(1) : '',
                        height: Number.isFinite(normalizedHeight) && normalizedHeight > 0 ? normalizedHeight.toFixed(2) : '',
                        age: data.age !== undefined && data.age !== null && String(data.age).trim() ? String(data.age).trim() : '',
                        sex: data.sex !== undefined && data.sex !== null ? String(data.sex).trim().toUpperCase() : '',
                    });
                }
            }, { onlyOnce: true });
        }
    });
    return () => off();
  }, []);


  const handleBmiChange = (field: keyof typeof bmiForm) => (value: string) =>
    setBmiForm((prev) => ({ ...prev, [field]: value }));

  // --- LÓGICA DE GUARDADO (Adaptada de Home.tsx) ---
  const handleSaveMetrics = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        Alert.alert('Error', 'Debes iniciar sesión para guardar tus datos.');
        return;
    }
    
    // Validaciones básicas
    if (!isNumeric(bmiForm.age) || !isNumeric(bmiForm.weight) || !isNumeric(bmiForm.height) || !['M', 'F'].includes(bmiForm.sex.trim().toUpperCase())) {
        Alert.alert('Datos incompletos', 'Por favor, rellena todos los campos con valores válidos (Altura en metros, Sexo M/F).');
        return;
    }

    const payload = {
      age: bmiForm.age.trim(),
      weight: bmiForm.weight.trim().replace(',', '.'),
      height: bmiForm.height.trim().replace(',', '.'),
      sex: bmiForm.sex.trim().toUpperCase(),
    };
    payload.sex = payload.sex ? payload.sex[0] : '';

    // Normalización de datos para guardar en Firebase
    const weightNumber = parseFloat(payload.weight);
    const weightStored = Number.isFinite(weightNumber) && weightNumber > 0 ? Number(weightNumber.toFixed(1)) : null;
    const heightNumber = parseFloat(payload.height);
    const normalizedHeight = Number.isFinite(heightNumber)
      ? heightNumber > 5
        ? heightNumber / 100 // Asumir que si es > 5, estaba en cm
        : heightNumber
      : NaN;
    const heightStored =
      Number.isFinite(normalizedHeight) && normalizedHeight > 0
        ? Number(normalizedHeight.toFixed(2))
        : null;
    const ageNumber = parseInt(payload.age, 10);
    const ageStored = Number.isFinite(ageNumber) && ageNumber > 0 ? ageNumber : null;
    const sexStored = payload.sex ? payload.sex[0] : null;

    try {
      setLoading(true);
      await update(ref(db, `users/${currentUser.uid}/metrics`), {
        age: ageStored,
        weight: weightStored,
        height: heightStored,
        sex: sexStored,
      });
      // Navegar a la pantalla principal después de guardar
      router.replace('/(auth)/gps'); 
    } catch (error) {
      console.error('Error al guardar métricas:', error);
      Alert.alert('Error', 'No pudimos guardar tus datos. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <AuthBackground>
        <ScrollView contentContainerStyle={styles.scrollCentered}>
          <Text style={styles.title}>Datos Personales</Text>
          <Text style={styles.caption}>Necesitamos estos datos para calcular tu IMC, gasto de calorías y esfuerzo físico.</Text>
          
          <View style={styles.card}>
            
            {/* Edad */}
            <Text style={styles.label}>Edad:</Text>
            <TextInput
              value={bmiForm.age}
              onChangeText={handleBmiChange('age')}
              keyboardType="number-pad"
              placeholder="Ej. 29"
              placeholderTextColor="#9E9EA0"
              style={styles.input}
            />
            
            {/* Peso */}
            <Text style={[styles.label, { marginTop: 15 }]}>Peso (kg):</Text>
            <TextInput
              value={bmiForm.weight}
              onChangeText={handleBmiChange('weight')}
              keyboardType="decimal-pad"
              placeholder="Ej. 78.5"
              placeholderTextColor="#9E9EA0"
              style={styles.input}
            />
            
            {/* Altura */}
            <Text style={[styles.label, { marginTop: 15 }]}>Altura (m):</Text>
            <TextInput
              value={bmiForm.height}
              onChangeText={handleBmiChange('height')}
              keyboardType="decimal-pad"
              placeholder="Ej. 1.75"
              placeholderTextColor="#9E9EA0"
              style={styles.input}
            />
            
            {/* Sexo */}
            <Text style={[styles.label, { marginTop: 15 }]}>Sexo (M/F):</Text>
            <TextInput
              value={bmiForm.sex}
              onChangeText={(text) => handleBmiChange('sex')(text.slice(0, 1).toUpperCase())}
              placeholder="M"
              placeholderTextColor="#9E9EA0"
              maxLength={1}
              autoCapitalize="characters"
              style={styles.input}
            />

          </View>
          
          <Pressable 
            disabled={loading || !isAuthReady} 
            onPress={handleSaveMetrics} 
            style={({ pressed }) => [
                styles.primaryBtn, 
                { 
                    marginTop: 20, 
                    opacity: loading || !isAuthReady ? 0.5 : pressed ? 0.9 : 1 
                }
            ]}
          >
            {loading ? (
                <ActivityIndicator color="black" />
            ) : (
                <Text style={styles.primaryText}>Guardar y Continuar</Text>
            )}
          </Pressable>
        </ScrollView>
      </AuthBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'black' },
  backgroundContainer: { flex: 1, backgroundColor: 'black' },
  scrollCentered: { padding: 20, paddingTop: 24, flexGrow: 1, justifyContent: 'center' },
  title: { color: 'white', fontWeight: 'bold', fontSize: 32, marginBottom: 5, alignSelf: 'center' },
  caption: { color: '#9E9EA0', fontFamily: fonts.regular, fontSize: 14, marginBottom: 20, textAlign: 'center' },
  card: { backgroundColor: '#1C1C1E', borderRadius: 16, padding: 16 },
  label: { color: 'white', fontFamily: fonts.semibold, marginBottom: 8 },
  input: { 
    borderWidth: 1, 
    borderColor: '#2F2F33', 
    borderRadius: 12, 
    paddingHorizontal: 12, 
    paddingVertical: 10, 
    color: 'white', 
    fontFamily: fonts.regular,
    backgroundColor: '#1A1A1D' 
  },
  primaryBtn: { 
    backgroundColor: '#A6FF00', 
    height: 46, 
    borderRadius: 16, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  primaryText: { color: 'black', fontFamily: fonts.semibold, fontSize: 16 },
});