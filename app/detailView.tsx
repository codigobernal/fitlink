import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from "expo-router";
import { onAuthStateChanged } from 'firebase/auth';
import { limitToLast, onValue, orderByChild, query, ref, remove } from 'firebase/database';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts } from '../constants/fonts';
import { auth, db } from '../firebaseConfig';

// --- CONSTANTES ---
// Colores y unidades mapeados para consistencia con Estadisticas.tsx
const COLORS = {
  PULSE: { stroke: '#A6FF00', fill: 'rgba(166,255,0,0.6)', unit: ' BPM', name: 'Pulso' }, 
  OXYGEN: { stroke: '#7AD7FF', fill: 'rgba(122,215,255,0.6)', unit: ' %', name: 'Oxígeno' }, 
  DISTANCE: { stroke: '#FFD166', fill: 'rgba(255,214,102,0.6)', unit: ' km', name: 'Distancia' }, 
  STEPS: { stroke: '#FF9F0A', fill: 'rgba(255,159,10,0.6)', unit: ' pasos', name: 'Pasos' }, 
  EFFORT: { stroke: '#FF5757', fill: 'rgba(255,87,87,0.6)', unit: ' %', name: 'Esfuerzo' },
};
const DOTS = ['#A6FF00', '#FF6B6B', '#7AD7FF', '#FFD166', '#C084FC'];

// --- TIPOS DE DATOS ---
type SessionData = { 
    id: string; 
    pulsoPromedio: number; 
    oxigenoPromedio: number;
    esfuerzoFinal: number; 
    pasosTotales: number; 
    distanciaFinal: number; 
    tiempoFinal: number;
    timestamp: any; 
};
type Lectura = { id: string; pulso: number; oxigeno?: number; distancia?: number; timestamp: any };

// --- FUNCIONES AUXILIARES GENERALES ---

/** Convierte el timestamp a milisegundos. */
function toMillis(ts: any): number {
  if (typeof ts === 'number') return ts > 1e12 ? ts : ts * 1000;
  const n = Number(ts); 
  if (!Number.isNaN(n)) return n > 1e12 ? n : n * 1000;
  const d = new Date(ts); 
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

/** Formatea una fecha y hora completa. */
function formatFullDate(ms: number): string {
    const d = new Date(ms);
    return d.toLocaleString();
}

/** Obtiene el valor, sufijo y color para renderizar el historial. */
function getMetricDetails(item: SessionData | Lectura, metricKey: string) {
    let value: number | string = 0;
    let suffix = '';
    let metricInfo = COLORS.PULSE; // Default

    if ('pulso' in item && metricKey === 'pulso') {
        value = item.pulso;
        metricInfo = COLORS.PULSE;
        suffix = metricInfo.unit;
    } else if ('oxigeno' in item && metricKey === 'oxigeno') {
        value = item.oxigeno || 0;
        metricInfo = COLORS.OXYGEN;
        suffix = metricInfo.unit;
    } else if ('pulsoPromedio' in item) {
        // Data de Sesión
        switch (metricKey) {
            case 'pulso': 
                value = item.pulsoPromedio; 
                metricInfo = COLORS.PULSE; 
                suffix = metricInfo.unit;
                break;
            case 'oxigeno': 
                value = item.oxigenoPromedio; 
                metricInfo = COLORS.OXYGEN; 
                suffix = metricInfo.unit;
                break;
            case 'pasos': 
                value = item.pasosTotales; 
                metricInfo = COLORS.STEPS; 
                suffix = metricInfo.unit;
                break;
            case 'esfuerzo': 
                value = item.esfuerzoFinal; 
                metricInfo = COLORS.EFFORT; 
                suffix = metricInfo.unit;
                break;
            case 'distancia': 
                value = item.distanciaFinal; 
                metricInfo = COLORS.DISTANCE; 
                suffix = metricInfo.unit;
                value = Number(value).toFixed(2);
                break;
        }
    }
    
    // Si es un valor numérico, redondear si no es distancia
    if (typeof value === 'number' && metricKey !== 'distancia') {
        value = Math.round(value);
    }

    return { 
        value: value === 0 || value === '0.00' ? '--' : value, 
        suffix, 
        color: metricInfo.stroke 
    };
}

/** Componente de la nueva vista de detalle por métrica */
export default function DetailView() {
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams();
    const { metric: metricKey = 'pulso', title: metricTitle = 'Pulso' } = params as { metric: string, title: string };
    
    const [sessions, setSessions] = useState<SessionData[]>([]);
    const [lecturas, setLecturas] = useState<Lectura[]>([]);
    const [showAll, setShowAll] = useState(false);
    
    // Decidir la fuente de datos: sesiones (para métricas de sesión) o lecturas (para pulso/oxígeno individual)
    const isSessionMetric = ['pulso', 'oxigeno', 'esfuerzo', 'pasos', 'distancia'].includes(metricKey);

    // --- EFECTOS (Carga de datos) ---
    useEffect(() => {
        let detach: undefined | (() => void);
        const off = onAuthStateChanged(auth, (user) => {
            if (detach) { detach(); detach = undefined; }
            if (!user) { setSessions([]); setLecturas([]); return; }
            
            if (isSessionMetric) {
                // Si es una métrica de sesión, leemos el historial de sesiones
                const sessionsRef = ref(db, `users/${user.uid}/sessions`);
                detach = onValue(sessionsRef, (snap) => {
                    const data = snap.val();
                    if (!data) return setSessions([]);
                    const arr: SessionData[] = Object.keys(data).map((id) => ({ id, ...data[id] }));
                    arr.sort((a, b) => toMillis(b.timestamp) - toMillis(a.timestamp)); // Más reciente primero
                    setSessions(arr);
                });
            } else {
                // Si la métrica requiere lecturas individuales (ej. Pulso/Oxígeno si se decide un historial más granular)
                // Usamos un límite alto para tener un buen historial
                const readingsRef = query(ref(db, 'lecturas'), orderByChild('timestamp'), limitToLast(500));
                detach = onValue(readingsRef, (snap) => {
                    const data = snap.val();
                    if (!data) return setLecturas([]);
                    const arr: Lectura[] = Object.keys(data).map((k) => ({ id: k, ...data[k] }));
                    arr.sort((a, b) => toMillis(b.timestamp) - toMillis(a.timestamp)); // Más reciente primero
                    setLecturas(arr);
                });
            }
        });
        
        return () => { off(); if (detach) detach(); };
    }, [metricKey, isSessionMetric]);

    // --- CÁLCULOS MEMORIZADOS ---
    const rawData = isSessionMetric ? sessions : lecturas;
    
    const historyData = useMemo(() => {
        // Mostramos 10 elementos por defecto o todos si showAll es true
        return showAll ? rawData : rawData.slice(0, 10);
    }, [rawData, showAll]);
    
    // --- MANEJADORES ---
    const handleDelete = (item: SessionData | Lectura) => {
        const itemRef = 'pulso' in item ? ref(db, `lecturas/${item.id}`) : ref(db, `users/${auth.currentUser?.uid}/sessions/${item.id}`);
        const type = 'pulso' in item ? 'lectura' : 'sesión';
        
        Alert.alert('Eliminar registro', `¿Deseas eliminar este registro de ${type}?`, [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Eliminar', style: 'destructive', onPress: () => remove(itemRef) },
        ]);
    };


    return (
        <SafeAreaView style={styles.safe}>
            <View style={[styles.headerRow, { paddingHorizontal: 40 }]}>
                <Pressable onPress={() => router.back()} hitSlop={10}>
                    <Ionicons name="chevron-back" size={30} color="#FFFFFF" />
                </Pressable>
                <Text style={styles.h1}>Historial</Text>
            </View>

            <View style={styles.rowHeader}>
                <Text style={styles.section}>{isSessionMetric ? 'Resúmenes de Sesión' : 'Lecturas Individuales'}</Text>
                <Pressable onPress={() => setShowAll(v => !v)}>
                    <Text style={styles.link}>{showAll ? `Mostrar recientes (${historyData.length}/${rawData.length})` : `Mostrar todo (${rawData.length})`}</Text>
                </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {historyData.length === 0 ? (
                    <Text style={styles.empty}>Aún no hay datos históricos disponibles para {metricTitle}.</Text>
                ) : (
                    historyData.map((item, i) => {
                        const { value, suffix, color } = getMetricDetails(item, metricKey);
                        const isSession = 'pulsoPromedio' in item;

                        return (
                            <View key={item.id} style={styles.rowCard}>
                                <View style={[styles.dot, { backgroundColor: color, marginRight: 10 }]} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.rowStrong}>
                                        {value} {suffix}
                                    </Text>
                                    <Text style={styles.rowSub}>
                                        {isSession ? `Sesión | Duración: ${item.tiempoFinal ? Math.round(item.tiempoFinal / 60) + ' min' : '--'}` : 'Lectura puntual'}
                                    </Text>
                                    <Text style={styles.rowSub}>
                                        {formatFullDate(toMillis(item.timestamp))}
                                    </Text>
                                </View>
                                <Pressable onPress={() => handleDelete(item)} hitSlop={10}>
                                    <Ionicons name="trash" size={18} color="#FF6B6B" />
                                </Pressable>
                            </View>
                        );
                    })
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

// --- ESTILOS ---
const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: 'black' },
    headerRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'flex-start',
        paddingTop: 10,
        marginBottom: 16
    },
    h1: { 
        color: 'white', 
        fontSize: 24, 
        fontFamily: fonts.semibold, 
        marginLeft: 10,
        fontWeight: 'bold'
    },
    rowHeader: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: 20,
        marginTop: 4 
    },
    section: { 
        color: 'white', 
        fontSize: 18, 
        fontFamily: fonts.semibold, 
        marginTop: 6, 
        marginBottom: 8 
    },
    link: { 
        color: '#7AD7FF', // Usar un color diferente para los links
        opacity: 0.9, 
        fontSize: 12, 
        fontFamily: fonts.regular 
    },
    scrollContent: { 
        paddingHorizontal: 20, 
        paddingVertical: 10,
        paddingBottom: 40 // Espacio extra abajo
    },
    rowCard: { 
        backgroundColor: '#1C1C1E', 
        borderRadius: 14, 
        padding: 14, 
        marginBottom: 12, 
        flexDirection: 'row', 
        alignItems: 'center' 
    },
    dot: { 
        width: 22, 
        height: 22, 
        borderRadius: 11 
    },
    rowStrong: { 
        color: 'white', 
        fontSize: 16, 
        fontFamily: fonts.semibold 
    },
    rowSub: { 
        color: '#9E9EA0', 
        fontSize: 12, 
        fontFamily: fonts.regular 
    },
    empty: { 
        color: '#9E9EA0', 
        fontFamily: fonts.regular, 
        padding: 20, 
        textAlign: 'center' 
    },
});