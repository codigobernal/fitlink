import { Ionicons } from '@expo/vector-icons';
import { router } from "expo-router";
import { onAuthStateChanged } from 'firebase/auth';
import { onValue, query, ref, orderByChild, limitToLast } from 'firebase/database'; 
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts } from '../../constants/fonts';
import { auth, db } from '../../firebaseConfig';

// --- CONSTANTES ---
// Colores específicos para las 5 métricas principales de sesión
const COLORS = {
  PULSE: { stroke: '#A6FF00', fill: 'rgba(166,255,0,0.6)', unit: ' BPM' }, // Verde (Pulso)
  OXYGEN: { stroke: '#7AD7FF', fill: 'rgba(122,215,255,0.6)', unit: ' %' }, // Azul/Cian (Oxígeno)
  DISTANCE: { stroke: '#FFD166', fill: 'rgba(255,214,102,0.6)', unit: ' km' }, // Amarillo/Dorado (Distancia)
  STEPS: { stroke: '#FF9F0A', fill: 'rgba(255,159,10,0.6)', unit: '' }, // Naranja (Pasos)
  EFFORT: { stroke: '#FF5757', fill: 'rgba(255,87,87,0.6)', unit: ' %' }, // Rojo (Esfuerzo)
};
const DOTS = ['#A6FF00', '#FF6B6B', '#7AD7FF', '#FFD166', '#C084FC']; // Para el historial
const METRIC_KEYS = ['PULSE', 'OXYGEN', 'STEPS', 'EFFORT', 'DISTANCE'] as const;

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
type ProfileIcon = { name?: keyof typeof Ionicons.glyphMap; color?: string };

// --- FUNCIONES AUXILIARES GENERALES ---

/** Convierte el timestamp a milisegundos. */
function toMillis(ts: any): number {
  if (typeof ts === 'number') return ts > 1e12 ? ts : ts * 1000;
  const n = Number(ts); 
  if (!Number.isNaN(n)) return n > 1e12 ? n : n * 1000;
  const d = new Date(ts); 
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

/** Formatea una fecha a 'Día/Mes' (ej. 07/11). */
function formatDayMonth(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${day}/${month}`;
}

/** Obtiene la configuración del gráfico. */
const getChartConfig = (strokeColor: string, ySuffix: string, decimalPlaces: number = 0) => ({
  backgroundGradientFrom: '#1C1C1E',
  backgroundGradientTo: '#1C1C1E',
  color: (opacity = 1) => strokeColor.replace(')', `, ${opacity})`),
  labelColor: (opacity = 1) => `rgba(255,255,255,${opacity})`,
  decimalPlaces: decimalPlaces, 
  propsForLabels: { 
    fontFamily: fonts.regular, 
    fontSize: 10,
    angle: -45, 
    y: 10, 
    dy: -10, 
  },
  propsForBackgroundLines: { stroke: 'rgba(255,255,255,0.15)', strokeDasharray: '4 6' },
  propsForDots: { r: '3', strokeWidth: '2', stroke: strokeColor },
  strokeWidth: 2,
  ySuffix, 
} as const);

/** * Agrupa los datos de sesiones por día de la semana actual.
 */
function groupByDay(sessions: SessionData[]): { 
    labels: string[]; 
    pulsoSeries: number[]; 
    oxigenoSeries: number[]; 
    pasosSeries: number[]; 
    esfuerzoSeries: number[];
    distanceSeries: number[]; 
} {
  // --- FILTRADO POR SEMANA ACTUAL (Lunes a Domingo) ---
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayOfWeek = today.getDay(); 
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; 
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - daysToSubtract);
  const startMs = startOfWeek.getTime();
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7); 
  const endMs = endOfWeek.getTime();

  const weekSessions = sessions.filter(s => {
      const ms = toMillis(s.timestamp);
      return ms >= startMs && ms < endMs; 
  });
  
  const buckets = new Map<number, { 
    time: Date; 
    pulsoSum: number; pulsoCount: number; 
    oxigenoSum: number; oxigenoCount: number; 
    esfuerzoSum: number; esfuerzoCount: number; 
    pasosSum: number; pasosCount: number;
    distanceSum: number; 
  }>();

  weekSessions.forEach((entry) => {
    const ms = toMillis(entry.timestamp);
    if (!ms) return;
    const dayDate = new Date(ms);
    dayDate.setHours(0, 0, 0, 0);
    const key = dayDate.getTime();
    
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { time: dayDate, pulsoSum: 0, pulsoCount: 0, oxigenoSum: 0, oxigenoCount: 0, esfuerzoSum: 0, esfuerzoCount: 0, pasosSum: 0, pasosCount: 0, distanceSum: 0 };
      buckets.set(key, bucket);
    }

    if (typeof entry.pulsoPromedio === 'number' && entry.pulsoPromedio > 0) {
      bucket.pulsoSum += entry.pulsoPromedio;
      bucket.pulsoCount += 1;
    }
    if (typeof entry.oxigenoPromedio === 'number' && entry.oxigenoPromedio > 0) {
        bucket.oxigenoSum += entry.oxigenoPromedio;
        bucket.oxigenoCount += 1;
    }
    if (typeof entry.esfuerzoFinal === 'number' && entry.esfuerzoFinal >= 0) {
      bucket.esfuerzoSum += entry.esfuerzoFinal;
      bucket.esfuerzoCount += 1;
    }
    if (typeof entry.pasosTotales === 'number' && entry.pasosTotales > 0) {
      bucket.pasosSum += entry.pasosTotales;
      bucket.pasosCount += 1;
    }
    if (typeof entry.distanciaFinal === 'number' && entry.distanciaFinal > 0) {
      bucket.distanceSum += entry.distanciaFinal;
    }
  });

  const finalGrouped: { [key: number]: { pulso: number, oxigeno: number, pasos: number, esfuerzo: number, distance: number } } = {};
  Array.from(buckets.values()).forEach((b) => {
      finalGrouped[b.time.getTime()] = {
          pulso: b.pulsoCount ? Math.round(b.pulsoSum / b.pulsoCount) : 0,
          oxigeno: b.oxigenoCount ? Math.round(b.oxigenoSum / b.oxigenoCount) : 0, 
          pasos: b.pasosCount ? Math.round(b.pasosSum / b.pasosCount) : 0,
          esfuerzo: b.esfuerzoCount ? Math.round(b.esfuerzoSum / b.esfuerzoCount) : 0,
          distance: Number(b.distanceSum.toFixed(2)),
      };
  });

  const weekLabels: string[] = [];
  const weekPulso: number[] = [];
  const weekOxigeno: number[] = []; 
  const weekPasos: number[] = [];
  const weekEsfuerzo: number[] = [];
  const weekDistance: number[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const dayKey = d.getTime();
    
    weekLabels.push(formatDayMonth(d));

    const data = finalGrouped[dayKey] || { pulso: 0, oxigeno: 0, pasos: 0, esfuerzo: 0, distance: 0 };
    weekPulso.push(data.pulso);
    weekOxigeno.push(data.oxigeno);
    weekPasos.push(data.pasos);
    weekEsfuerzo.push(data.esfuerzo);
    weekDistance.push(data.distance);
  }

  return {
    labels: weekLabels,
    pulsoSeries: weekPulso,
    oxigenoSeries: weekOxigeno,
    pasosSeries: weekPasos,
    esfuerzoSeries: weekEsfuerzo,
    distanceSeries: weekDistance,
  };
}


// --- COMPONENTE PRINCIPAL ESTADISTICAS ---
export default function Estadisticas() {
  const insets = useSafeAreaInsets();
  
  // --- VARIABLES DE ESTADO ---
  const [sessions, setSessions] = useState<SessionData[]>([]); 
  const [lecturas, setLecturas] = useState<any[]>([]); // Para el historial de lecturas individuales
  const [profileIcon, setProfileIcon] = useState<ProfileIcon>({});
  const [chartWidth, setChartWidth] = useState(Dimensions.get('window').width - 40 - 24); 

  // --- REFES ---
  const heartScale = useRef(new Animated.Value(1)).current;
  const last = lecturas.length ? lecturas[lecturas.length - 1] : undefined;
  const bpm = last ? last.pulso : 60;
  const bpmGood = bpm >= 60 && bpm <= 100;

  // --- EFECTOS (Llamadas a Firebase) ---

  // 1. Obtener sesiones de actividad (Fuente principal para gráficas)
  useEffect(() => {
    let detach: undefined | (() => void);
    const off = onAuthStateChanged(auth, (user) => {
        if (detach) { detach(); detach = undefined; }
        if (!user) { setSessions([]); return; }

        const sessionsRef = ref(db, `users/${user.uid}/sessions`);
        detach = onValue(sessionsRef, (snap) => {
            const data = snap.val();
            if (!data) return setSessions([]);
            const arr: SessionData[] = Object.keys(data).map((id) => ({ id, ...data[id] }));
            setSessions(arr);
        });
    });
    // Se mantiene esta parte del efecto anterior para obtener la última lectura de pulso/lecturas individuales
    const q = query(ref(db, 'lecturas'), orderByChild('timestamp'), limitToLast(10)); 
    const unsub = onValue(q, (snap) => {
        const data = snap.val();
        if (data) {
            const arr = Object.keys(data).map((k) => ({ id: k, ...data[k] }));
            arr.sort((a, b) => toMillis(a.timestamp) - toMillis(b.timestamp));
            setLecturas(arr); // Guarda las lecturas para el historial individual
        }
    });
    
    return () => { 
        off(); 
        unsub();
        if (detach) detach(); 
    };
  }, []);

  // 2. Obtener icono de perfil
  useEffect(() => {
    let detach: undefined | (() => void);
    const off = onAuthStateChanged(auth, (user) => {
      if (detach) { detach(); detach = undefined; }
      if (!user) { setProfileIcon({}); return; }
      const iconRef = ref(db, `users/${user.uid}/profileIcon`);
      detach = onValue(iconRef, (snapshot) => {
        const data = snapshot.val();
        if (data) setProfileIcon({ name: data.name, color: data.color });
      });
    });
    return () => { off(); if (detach) detach(); };
  }, []);

  // --- CÁLCULOS MEMORIZADOS ---
  const { labels, pulsoSeries, oxigenoSeries, pasosSeries, esfuerzoSeries, distanceSeries } = useMemo(() => groupByDay(sessions), [sessions]);
  
  // Lista de métricas para renderizar las tarjetas y manejar la navegación
  const metricCards = [
    { title: 'Pulso (BPM)', key: 'pulso', series: pulsoSeries, config: getChartConfig(COLORS.PULSE.stroke, COLORS.PULSE.unit), decimal: 0 },
    { title: 'Oxígeno (%)', key: 'oxigeno', series: oxigenoSeries, config: getChartConfig(COLORS.OXYGEN.stroke, COLORS.OXYGEN.unit), decimal: 0 },
    { title: 'Pasos', key: 'pasos', series: pasosSeries, config: getChartConfig(COLORS.STEPS.stroke, COLORS.STEPS.unit), decimal: 0 },
    { title: 'Esfuerzo (%)', key: 'esfuerzo', series: esfuerzoSeries, config: getChartConfig(COLORS.EFFORT.stroke, COLORS.EFFORT.unit), decimal: 0 },
    { title: 'Distancia (km)', key: 'distancia', series: distanceSeries, config: getChartConfig(COLORS.DISTANCE.stroke, COLORS.DISTANCE.unit, 2), decimal: 2 },
  ];

  // Función de navegación a la vista de detalle
  const navigateToDetail = (metric: string, title: string) => {
    router.push({
      pathname: "/detailView", // La ruta a la nueva página
      params: { metric, title },
    });
  };
  
  // --- EFECTO (Animación del corazón) ---
  useEffect(() => {
    // ... (Lógica de animación del corazón) ...
    const clamped = Math.max(40, Math.min(160, bpm || 60));
    const beat = Math.round(60000 / clamped / 2);
    const amplitude = bpmGood ? 0.25 : 0.08;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(heartScale, { toValue: 1 + amplitude, duration: beat, useNativeDriver: true }),
        Animated.timing(heartScale, { toValue: 1, duration: beat, useNativeDriver: true }),
      ]),
      { resetBeforeIteration: true }
    );
    anim.start();
    return () => anim.stop();
  }, [bpm, bpmGood, heartScale]);

  // --- VISTA PRINCIPAL ---
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: 24 + insets.bottom }]}>
        <View style={styles.headerRow}>
          <Text style={styles.h1}>Estadísticas</Text>
          <Pressable onPress={() => router.push("/profile")}>
            <View style={[styles.headerIcon, { backgroundColor: profileIcon.color || '#2B2B2E' }]}>
              <Ionicons name={profileIcon.name || 'person'} size={18} color="#111" />
            </View>
          </Pressable>
        </View>
        
        {/* AVISO IMPORTANTE */}
        <View style={[styles.card, { padding: 12, backgroundColor: '#441111' }]}>
            <Text style={[styles.cardTitle, { color: '#FFD166' }]}>
                Resumen Semanal
            </Text>
            <Text style={styles.rowSub}>
                Las gráficas muestran el promedio diario de tus sesiones guardadas en la semana actual. Toca el ícono (>) para ver el historial detallado de lecturas.
            </Text>
        </View>

        {/* --- GRÁFICAS DINÁMICAS (Pulso, Oxígeno, Pasos, Esfuerzo, Distancia) --- */}
        {metricCards.map((card, index) => {
          const hasData = card.series.some(v => v > 0);
          return (
            <View 
              key={card.key} 
              style={[styles.card, styles.chartCard]} 
              onLayout={index === 0 ? ({ nativeEvent }) => setChartWidth(nativeEvent.layout.width - 24) : undefined}
            >
              <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{card.title}</Text>
                  <Pressable 
                      onPress={() => navigateToDetail(card.key, card.title)} 
                      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                  >
                      <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
                  </Pressable>
              </View>
              
              {hasData ? (
                <LineChart
                  data={{ 
                    labels, 
                    datasets: [{ data: card.series, color: (o = 1) => card.config.color(o) }] 
                  }}
                  width={Math.max(0, chartWidth)}
                  height={180}
                  bezier
                  withDots
                  withInnerLines
                  fromZero
                  chartConfig={card.config} 
                  style={{ borderRadius: 16, alignSelf: 'center', marginBottom: 30 }} 
                />
              ) : (
                <Text style={styles.empty}>Sin sesiones registradas esta semana</Text>
              )}
            </View>
          );
        })}

      </ScrollView>
    </SafeAreaView>
  );
}

// --- ESTILOS ---
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'black' },
  scroll: { paddingHorizontal: 20, paddingTop: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  h1: { color: 'white', fontSize: 32, fontFamily: fonts.semibold, marginTop: 10, marginBottom: 10, fontWeight: 'bold' },
  headerIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: '#1C1C1E', borderRadius: 18, padding: 16, marginBottom: 16 },
  chartCard: { overflow: 'hidden' },
  cardTitle: { color: 'white', fontSize: 16, fontFamily: fonts.semibold, marginBottom: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }, // Nuevo estilo para el header
  empty: { color: '#9E9EA0', fontFamily: fonts.regular, padding: 10, textAlign: 'center' },
  section: { color: 'white', fontSize: 20, fontFamily: fonts.semibold, marginTop: 6, marginBottom: 8 },
  rowHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  rowCard: { backgroundColor: '#1C1C1E', borderRadius: 14, padding: 14, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  dot: { width: 22, height: 22, borderRadius: 11 },
  rowStrong: { color: 'white', fontSize: 16, fontFamily: fonts.semibold },
  rowSub: { color: '#9E9EA0', fontSize: 12, fontFamily: fonts.regular },
  link: { color: 'white', opacity: 0.9, fontSize: 12, fontFamily: fonts.regular },
});
