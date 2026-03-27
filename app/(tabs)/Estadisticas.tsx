import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { onValue, ref, set } from 'firebase/database';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts } from '../../constants/fonts';
import { auth, db } from '../../firebaseConfig.js';

/* -------------------------------------------------------------------------- */
/*                                CONSTANTES                                    */
/* -------------------------------------------------------------------------- */
const COLORS = {
  PULSE: { stroke: '#FF5757', fill: 'rgba(255,87,87,0.6)', unit: 'BPM' },
  OXYGEN: { stroke: '#7AD7FF', fill: 'rgba(122,215,255,0.6)', unit: '%' },
  DISTANCE: { stroke: '#FFD166', fill: 'rgba(255,214,102,0.6)', unit: ' km' },
  STEPS: { stroke: '#FF9F0A', fill: 'rgba(255,159,10,0.6)', unit: '' },
  EFFORT: { stroke: '#A6FF00', fill: 'rgba(166,255,0,0.6)', unit: '%' },
};

/* -------------------------------------------------------------------------- */
/*                                   TIPOS                                      */
/* -------------------------------------------------------------------------- */
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

/* -------------------------------------------------------------------------- */
/*                            FUNCIONES AUXILIARES                              */
/* -------------------------------------------------------------------------- */

/** Normaliza timestamp a milisegundos (acepta number/string/ISO). */
function toMillis(ts: any): number {
  if (typeof ts === 'number') return ts > 1e12 ? ts : ts * 1000;
  const n = Number(ts);
  if (!Number.isNaN(n)) return n > 1e12 ? n : n * 1000;
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

/** Formato corto día/mes para etiquetas del eje X. */
function formatDayMonth(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${day}/${month}`;
}


/**
 * Genera la configuración común para react-native-chart-kit.
 * Devuelve un objeto con color(), labelColor(), props, etc.
 */
const getChartConfig = (
  strokeColor: string,
  ySuffix: string,
  decimalPlaces: number = 0,
  yAxisInterval?: number,
  yAxisLabel?: (value: number | string) => string
) => ({
  backgroundGradientFrom: '#1C1C1E',
  backgroundGradientTo: '#1C1C1E',

  // 🌟 Hace visible líneas y valores
  color: () => strokeColor,
  labelColor: () => '#FFFFFF',

  decimalPlaces,

  propsForLabels: {
    fontFamily: fonts.regular,
    fontSize: 12,
    fill: '#FFFFFF',
  },

  propsForBackgroundLines: {
    stroke: 'rgba(255,255,255,0.2)',
  },

  propsForDots: {
    r: '4',
    strokeWidth: '2',
    stroke: strokeColor,
  },

  strokeWidth: 2,
  ySuffix: ySuffix,
  yAxisInterval: yAxisInterval,
  formatYLabel: yAxisLabel,
});


/**
 * Formateador robusto para etiquetas del eje Y.
 * IMPORTANTE: LineChart a veces pasa strings, por eso convertimos a Number.
 */
const formatYLabelWithSuffix = (suffix: string, isDistance: boolean = false) => (rawValue: number | string) => {
const n = Number(rawValue);
  if (!Number.isFinite(n) || n < 0) return '--';

  if (suffix === '' && n >= 1000) {
    return `${Math.round(n / 1000)}k`;
    }
  if (isDistance) {
    return `${n.toFixed(1)}${suffix}`; // Reduje decimales a 1 para mejor visualización
    }
    return `${Math.round(n)}${suffix}`;
};


/**
 * Agrupa las sesiones por día (semana actual, L -> D) y devuelve series listas para graficar.
 * Para cada día:
 *  - Pulso/Oxígeno/Esfuerzo: promedio de sesiones del día
 *  - Pasos: promedio (puedes cambiar a suma si prefieres)
 *  - Distancia: suma total del día (típico para distancia)
 */
function groupByDay(sessions: SessionData[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayOfWeek = today.getDay(); // 0=Dom ... 6=Sab
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Queremos semana L->D (Mon..Sun)
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - daysToSubtract);

  const buckets = new Map<
    number,
    {
      pulsoSum: number;
      pulsoCount: number;
      oxigenoSum: number;
      oxigenoCount: number;
      pasosSum: number;
      pasosCount: number;
      esfuerzoSum: number;
      esfuerzoCount: number;
      distanceSum: number;
    }
  >();

  sessions.forEach((s) => {
    const ms = toMillis(s.timestamp);
    if (!ms) return;
    const d = new Date(ms);
    d.setHours(0, 0, 0, 0);
    const key = d.getTime();

    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = {
        pulsoSum: 0,
        pulsoCount: 0,
        oxigenoSum: 0,
        oxigenoCount: 0,
        pasosSum: 0,
        pasosCount: 0,
        esfuerzoSum: 0,
        esfuerzoCount: 0,
        distanceSum: 0,
      };
      buckets.set(key, bucket);
    }

    if (typeof s.pulsoPromedio === 'number' && s.pulsoPromedio > 0) {
      bucket.pulsoSum += s.pulsoPromedio;
      bucket.pulsoCount++;
    }
    if (typeof s.oxigenoPromedio === 'number' && s.oxigenoPromedio > 0) {
      bucket.oxigenoSum += s.oxigenoPromedio;
      bucket.oxigenoCount++;
    }
    if (typeof s.pasosTotales === 'number' && s.pasosTotales > 0) {
      bucket.pasosSum += s.pasosTotales;
      bucket.pasosCount++;
    }
    if (typeof s.esfuerzoFinal === 'number' && s.esfuerzoFinal >= 0) {
      bucket.esfuerzoSum += s.esfuerzoFinal;
      bucket.esfuerzoCount++;
    }
    if (typeof s.distanciaFinal === 'number' && s.distanciaFinal > 0) {
      bucket.distanceSum += s.distanciaFinal;
    }
  });

  const labels: string[] = [];
  const pulso: number[] = [],
    oxigeno: number[] = [],
    pasos: number[] = [],
    esfuerzo: number[] = [],
    distance: number[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const key = d.getTime();
    labels.push(formatDayMonth(d));
    const b = buckets.get(key);
    pulso.push(b?.pulsoCount ? Math.round(b.pulsoSum / b.pulsoCount) : 0);
    oxigeno.push(b?.oxigenoCount ? Math.round(b.oxigenoSum / b.oxigenoCount) : 0);
    pasos.push(b?.pasosSum ? b.pasosSum : 0);// si prefieres suma usa b.pasosSum
    esfuerzo.push(b?.esfuerzoCount ? Math.round(b.esfuerzoSum / b.esfuerzoCount) : 0);
    distance.push(b?.distanceSum ? Number(b.distanceSum.toFixed(2)) : 0);
  }

  return {
    labels,
    pulsoSeries: pulso,
    oxigenoSeries: oxigeno,
    pasosSeries: pasos,
    esfuerzoSeries: esfuerzo,
    distanceSeries: distance,
  };
}

/* -------------------------------------------------------------------------- */
/*                                  COMPONENTE                                  */
/* -------------------------------------------------------------------------- */
export default function Estadisticas() {
  const insets = useSafeAreaInsets();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [profileIcon, setProfileIcon] = useState<ProfileIcon>({});
  const [chartWidth, setChartWidth] = useState(Dimensions.get('window').width - 40);
  const [tooltipPos, setTooltipPos] = useState({
  visible: false,
  x: 0,
  y: 0,
  value: 0,
});


  const heartScale = useRef(new Animated.Value(1)).current;
  const last = sessions[sessions.length - 1];
  const bpm = last?.pulsoPromedio || 60;
  const bpmGood = bpm >= 60 && bpm <= 100;

  /* --------------------------- OBTENER SESIONES --------------------------- */
  useEffect(() => {
    let detach: undefined | (() => void);
    const off = onAuthStateChanged(auth, (user) => {
      if (detach) {
        detach();
        detach = undefined;
      }
      if (!user) {
        setSessions([]);
        return;
      }

      const sessionsRef = ref(db, `users/${user.uid}/sessions`);
      detach = onValue(sessionsRef, (snap) => {
        const data = snap.val();
        if (!data) return setSessions([]);
        const arr: SessionData[] = Object.keys(data).map((id) => ({ id, ...data[id] }));
        setSessions(arr);
      });
    });

    return () => {
      off();
      if (detach) detach();
    };
  }, []);

  /* ------------- INTEGRAR LECTURAS INDIVIDUALES A SESSIONS -------------- */
  useEffect(() => {
    let detach: undefined | (() => void);

    const off = onAuthStateChanged(auth, (user) => {
      if (!user) return;

      // lecturas guardadas por usuario (estructura: lecturas/{userId}/{readingId})
      const lecturasRef = ref(db, `lecturas/${user.uid}`);

      detach = onValue(lecturasRef, async (snap) => {
        const data = snap.val();
        if (!data) return;

        const lecturasArr = Object.keys(data).map((k) => ({
          id: k,
          ...data[k],
        }));

        // ordenar ascendente por timestamp
        lecturasArr.sort((a, b) => toMillis(a.timestamp) - toMillis(b.timestamp));

        // referencia a sesiones del usuario
        const sessionsRef = ref(db, `users/${user.uid}/sessions`);

        // leer sesiones existentes UNA vez
        const existing: Record<string, any> | null = await new Promise((resolve) =>
          onValue(sessionsRef, (s) => resolve(s.val()), { onlyOnce: true })
        );

        for (const lectura of lecturasArr) {
          const ts = toMillis(lectura.timestamp);
          if (!ts) continue;
          const day = new Date(ts);
          day.setHours(0, 0, 0, 0);
          const dayKey = day.getTime();

          // revisar si ya existe sesión ese día
          let exists = false;
          if (existing) {
            exists = Object.values(existing).some((s: any) => {
              const sTs = toMillis(s.timestamp);
              const d = new Date(sTs);
              d.setHours(0, 0, 0, 0);
              return d.getTime() === dayKey;
            });
          }

          if (!exists) {
            // Crear sesión a partir de lectura (ID de la lectura como id de sesión)
            await set(ref(db, `users/${user.uid}/sessions/${lectura.id}`), {
              pulsoPromedio: lectura.pulso || 0,
              oxigenoPromedio: lectura.oxigeno || 0,
              pasosTotales: lectura.pasos || 0,
              esfuerzoFinal: lectura.esfuerzo || 0,
              distanciaFinal: lectura.distancia || 0,
              tiempoFinal: lectura.tiempo || 0,
              timestamp: lectura.timestamp,
            });
          }
        }
      });
    });

    return () => {
      if (detach) detach();
      off();
    };
  }, []);

  /* --------------------------- ICONO PERFIL ---------------------------- */
  useEffect(() => {
    let detach: undefined | (() => void);
    const off = onAuthStateChanged(auth, (user) => {
      if (detach) {
        detach();
        detach = undefined;
      }
      if (!user) {
        setProfileIcon({});
        return;
      }
      const iconRef = ref(db, `users/${user.uid}/profileIcon`);
      detach = onValue(iconRef, (snap) => {
        const data = snap.val();
        if (data) setProfileIcon({ name: data.name, color: data.color });
      });
    });
    return () => {
      off();
      if (detach) detach();
    };
  }, []);

  /* ------------------------- CÁLCULOS MEMORIZADOS ------------------------ */
  const { labels, pulsoSeries, oxigenoSeries, pasosSeries, esfuerzoSeries, distanceSeries } = useMemo(
    () => groupByDay(sessions),
    [sessions]
  );

  /* ---------------------------- CONFIGURA CARDS ------------------------- */
  const metricCards = [
  {
    title: 'Pulso (BPM)',
    key: 'pulso',
    series: pulsoSeries,
    // Pulso: Asumimos rango 0-200. Intervalo de 50.
    config: getChartConfig(
      COLORS.PULSE.stroke,
      COLORS.PULSE.unit,
      0,
      50,
      formatYLabelWithSuffix(COLORS.PULSE.unit)
    ),
  },
  {
    title: 'Oxígeno (%)',
    key: 'oxigeno',
    series: oxigenoSeries,
    // Oxígeno: Rango 0-100. Intervalo de 25.
    config: getChartConfig(
      COLORS.OXYGEN.stroke,
      COLORS.OXYGEN.unit,
      0,
      25,
      formatYLabelWithSuffix(COLORS.OXYGEN.unit)
    ),
  },
  {
    title: 'Pasos',
    key: 'pasos',
    series: pasosSeries,
    // Pasos: Rango dinámico (undefined), formato con 'k' para miles.
    config: getChartConfig(
      COLORS.STEPS.stroke,
      COLORS.STEPS.unit,
      0,
      undefined,
      formatYLabelWithSuffix(COLORS.STEPS.unit)
    ),
  },
  {
    title: 'Esfuerzo (%)',
    key: 'esfuerzo',
    series: esfuerzoSeries,
    // Esfuerzo: Rango 0-100. Intervalo de 25.
    config: getChartConfig(
      COLORS.EFFORT.stroke,
      COLORS.EFFORT.unit,
      0,
      25,
      formatYLabelWithSuffix(COLORS.EFFORT.unit)
    ),
  },
  {
    title: 'Distancia (km)',
    key: 'distancia',
    series: distanceSeries,
    // Distancia: Rango dinámico, 2 decimales, formato con 'km'.
    config: getChartConfig(
      COLORS.DISTANCE.stroke,
      COLORS.DISTANCE.unit,
      2,
      undefined,
      formatYLabelWithSuffix(COLORS.DISTANCE.unit, true)
    ),
  },
];

type Tooltip = {
  visible: boolean;
  x: number;
  y: number;
  value: number;
};

const [tooltips, setTooltips] = useState<Record<number, Tooltip>>({});



const showTooltip = (
  index: number,
  x: number,
  y: number,
  value: number
) => {
  setTooltips((prev) => ({
    ...prev,
    [index]: { visible: true, x, y, value },
  }));

  setTimeout(() => {
    setTooltips((prev) => ({
      ...prev,
      [index]: { ...prev[index], visible: false },
    }));
  }, 1200);
};



  const navigateToDetail = (metric: string, title: string) => {
    router.push({ pathname: '/detailView', params: { metric, title } });
  };

  /* --------------------------- ANIMACIÓN CORAZÓN ------------------------ */
  useEffect(() => {
    const clamped = Math.max(40, Math.min(160, bpm || 60));
    const beat = Math.round(60000 / clamped / 2);
    const amplitude = bpmGood ? 0.25 : 0.08;
    const anim = Animated.loop(
      Animated.sequence([Animated.timing(heartScale, { toValue: 1 + amplitude, duration: beat, useNativeDriver: true }), Animated.timing(heartScale, { toValue: 1, duration: beat, useNativeDriver: true })]),
      { resetBeforeIteration: true }
    );
    anim.start();
    return () => anim.stop();
  }, [bpm, bpmGood, heartScale]);

  /* --------------------------------- VISTA -------------------------------- */
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: 24 + insets.bottom }]}>
        <View style={styles.headerRow}>
          <Text style={styles.h1}>Estadísticas</Text>
          <Pressable onPress={() => router.push('/profile')}>
            <View style={[styles.headerIcon, { backgroundColor: profileIcon.color || '#2B2B2E' }]}>
              <Ionicons name={profileIcon.name || 'person'} size={18} color="#111" />
            </View>
          </Pressable>
        </View>

        <View style={[styles.card, { padding: 12, backgroundColor: '#0c570685' }]}>
          <Text style={[styles.cardTitle, { color: '#A6FF00' }]}>Resumen Semanal</Text>
          <Text style={styles.rowSub}>
            Las gráficas muestran el promedio diario de tus sesiones guardadas en la semana actual. Toca el ícono ({'>'}) para ver el historial detallado de lecturas.
          </Text>
        </View>
      {metricCards.map((card, index) => {
        const hasData = card.series.some((v) => v > 0);

        return (
          <View
            key={card.key}
            style={[styles.card, styles.chartCard]}
            onLayout={
              index === 0
                ? ({ nativeEvent }) => setChartWidth(nativeEvent.layout.width - 24)
                : undefined
            }
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
              <>
                <LineChart
                  data={{
                    labels,
                    datasets: [
                      {
                        data: card.series,
                        color: (opacity = 1) => card.config.color(),
                      },
                    ],
                  }}
                  width={Math.max(0, chartWidth)}
                  height={180}
                  bezier
                  withDots
                  withInnerLines
                  fromZero
                  chartConfig={card.config}
                  style={{
                    borderRadius: 16,
                    alignSelf: "center",
                    marginBottom: 30,
                  }}
                  formatYLabel={card.config.formatYLabel}
                  yAxisInterval={card.config.yAxisInterval}
                  withVerticalLabels
                  withHorizontalLabels
                  onDataPointClick={({ value, x, y }) => {
                    showTooltip(index, x, y, value);
                  }}
                />

                {tooltips[index]?.visible && (
                  <View
                    style={{
                      position: "absolute",
                      top: tooltips[index].y - 45,
                      left: tooltips[index].x - 30,
                      backgroundColor: "rgba(0,0,0,0.75)",
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 8,
                      zIndex: 200,
                    }}
                  >
                    <Text style={{ color: "white", fontSize: 12, fontWeight: "600" }}>
                      {tooltips[index].value}
                    </Text>
                  </View>
                )}
              </>
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

/* -------------------------------------------------------------------------- */
/*                                   ESTILOS                                    */
/* -------------------------------------------------------------------------- */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'black' },
  scroll: { paddingHorizontal: 20, paddingTop: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  h1: { color: 'white', fontSize: 32, fontFamily: fonts.semibold, marginTop: 10, marginBottom: 10, fontWeight: 'bold' },
  headerIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: '#1C1C1E', borderRadius: 18, padding: 16, marginBottom: 16 },
  chartCard: { overflow: 'hidden' },
  cardTitle: { color: 'white', fontSize: 16, fontFamily: fonts.semibold, marginBottom: 8, flex: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  empty: { color: '#9E9EA0', fontFamily: fonts.regular, padding: 10, textAlign: 'center' },
  rowSub: { color: '#fff', fontSize: 12, fontFamily: fonts.regular },
});
