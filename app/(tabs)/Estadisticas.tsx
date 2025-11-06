import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { limitToLast, onValue, orderByChild, query, ref, remove } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../firebaseConfig';
import { fonts } from '../../constants/fonts';

type Lectura = { id: string; pulso: number; oxigeno?: number; distancia?: number; timestamp: any };

function toMillis(ts: any) {
  if (typeof ts === 'number') return ts > 1e12 ? ts : ts * 1000;
  const n = Number(ts); if (!Number.isNaN(n)) return n > 1e12 ? n : n * 1000;
  const d = new Date(ts); return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

const DOTS = ['#A6FF00', '#FF6B6B', '#7AD7FF', '#FFD166', '#C084FC'];

function formatHour(date: Date) {
  const hours = date.getHours().toString().padStart(2, '0');
  return `${hours}:00`;
}

function groupByHour(readings: Lectura[]) {
  if (!readings.length) {
    return { labels: [] as string[], pulsoSeries: [] as number[], oxigenoSeries: [] as number[], distanceSeries: [] as number[] };
  }

  const sorted = [...readings].sort((a, b) => toMillis(a.timestamp) - toMillis(b.timestamp));
  const buckets = new Map<number, { time: Date; pulsoSum: number; pulsoCount: number; oxiSum: number; oxiCount: number; distance: number }>();
  let previousDistance: number | null = null;

  sorted.forEach((entry) => {
    const ms = toMillis(entry.timestamp);
    if (!ms) return;
    const hourDate = new Date(ms);
    hourDate.setMinutes(0, 0, 0);
    const key = hourDate.getTime();
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { time: hourDate, pulsoSum: 0, pulsoCount: 0, oxiSum: 0, oxiCount: 0, distance: 0 };
      buckets.set(key, bucket);
    }

    if (typeof entry.pulso === 'number') {
      bucket.pulsoSum += entry.pulso;
      bucket.pulsoCount += 1;
    }
    if (typeof entry.oxigeno === 'number') {
      bucket.oxiSum += entry.oxigeno;
      bucket.oxiCount += 1;
    }

    if (typeof entry.distancia === 'number') {
      const currentDistance = entry.distancia;
      let delta = currentDistance;
      if (previousDistance !== null) {
        delta = currentDistance >= previousDistance ? currentDistance - previousDistance : currentDistance;
      }
      bucket.distance += Math.max(0, Number(delta.toFixed(2)));
      previousDistance = currentDistance;
    }
  });

  const grouped = Array.from(buckets.values()).sort((a, b) => a.time.getTime() - b.time.getTime());
  // Limit to latest 12 hours to keep chart legible
  const recent = grouped.slice(-12);

  return {
    labels: recent.map((bucket) => formatHour(bucket.time)),
    pulsoSeries: recent.map((bucket) => (bucket.pulsoCount ? Number((bucket.pulsoSum / bucket.pulsoCount).toFixed(1)) : 0)),
    oxigenoSeries: recent.map((bucket) => (bucket.oxiCount ? Number((bucket.oxiSum / bucket.oxiCount).toFixed(1)) : 0)),
    distanceSeries: recent.map((bucket) => Number(bucket.distance.toFixed(2))),
  };
}

export default function Estadisticas() {
  const insets = useSafeAreaInsets();
  const [lecturas, setLecturas] = useState<Lectura[]>([]);
  const [profileIcon, setProfileIcon] = useState<{ name?: keyof typeof Ionicons.glyphMap; color?: string }>({});
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const q = query(ref(db, 'lecturas'), orderByChild('timestamp'), limitToLast(20));
    const unsub = onValue(q, (snap) => {
      const data = snap.val();
      if (!data) return setLecturas([]);
      const arr: Lectura[] = Object.keys(data).map((k) => ({ id: k, ...data[k] }));
      arr.sort((a, b) => toMillis(a.timestamp) - toMillis(b.timestamp));
      setLecturas(arr);
    });
    return () => unsub();
  }, []);

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

  const { labels, pulsoSeries, oxigenoSeries, distanceSeries } = useMemo(() => groupByHour(lecturas), [lecturas]);
  const last = lecturas.length ? lecturas[lecturas.length - 1] : undefined;
  const bpm = last ? last.pulso : 60;
  const bpmGood = bpm >= 60 && bpm <= 100;

  const heartScale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
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
  }, [bpm, bpmGood]);

  const chartConfig = {
    backgroundGradientFrom: '#1C1C1E',
    backgroundGradientTo: '#1C1C1E',
    color: (o = 1) => `rgba(166,255,0,${o})`,
    labelColor: (o = 1) => `rgba(255,255,255,${o})`,
    decimalPlaces: 0,
    propsForLabels: { fontFamily: fonts.regular, fontSize: 10 },
    propsForBackgroundLines: { stroke: 'rgba(255,255,255,0.15)', strokeDasharray: '4 6' },
    propsForDots: { r: '3', strokeWidth: '2', stroke: '#A6FF00' },
    strokeWidth: 2,
  } as const;
  const [chartWidth, setChartWidth] = useState(0);

  const history = showAll ? [...lecturas].reverse() : lecturas.slice(-5).reverse();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: 24 + insets.bottom }]}>
        <View style={styles.headerRow}>
          <Text style={styles.h1}>Estadisticas</Text>
          <View style={[styles.headerIcon, { backgroundColor: profileIcon.color || '#2B2B2E' }]}>
            <Ionicons name={profileIcon.name || 'person'} size={18} color="#111" />
          </View>
        </View>

        <View style={[styles.card, styles.chartCard]} onLayout={({ nativeEvent }) => setChartWidth(nativeEvent.layout.width - 24)}>
          <Text style={styles.cardTitle}>Pulso</Text>
          {pulsoSeries.length > 1 ? (
            <LineChart
              data={{ labels, datasets: [{ data: pulsoSeries, color: (o = 1) => `rgba(166,255,0,${o})` }] }}
              width={Math.max(0, chartWidth)}
              height={180}
              bezier
              withDots
              withInnerLines
              fromZero
              chartConfig={chartConfig}
              style={{ borderRadius: 16, alignSelf: 'center' }}
            />
          ) : (
            <Text style={styles.empty}>Sin datos recientes</Text>
          )}
        </View>

        <View style={[styles.card, styles.chartCard]} onLayout={({ nativeEvent }) => setChartWidth(nativeEvent.layout.width - 24)}>
          <Text style={styles.cardTitle}>Oxigeno</Text>
          {oxigenoSeries.length > 1 ? (
            <LineChart
              data={{ labels, datasets: [{ data: oxigenoSeries, color: (o = 1) => `rgba(122,215,255,${o})` }] }}
              width={Math.max(0, chartWidth)}
              height={180}
              bezier
              withDots
              withInnerLines
              fromZero
              chartConfig={{ ...chartConfig, color: (o=1)=>`rgba(122,215,255,${o})`, propsForDots: { r:'3', strokeWidth:'2', stroke:'#7AD7FF' } }}
              style={{ borderRadius: 16, alignSelf: 'center' }}
            />
          ) : (
            <Text style={styles.empty}>Sin datos recientes</Text>
          )}
        </View>

        <View style={[styles.card, styles.chartCard]} onLayout={({ nativeEvent }) => setChartWidth(nativeEvent.layout.width - 24)}>
          <Text style={styles.cardTitle}>Distancia</Text>
          {distanceSeries.length > 0 && distanceSeries.some((value) => value > 0) ? (
            <LineChart
              data={{ labels, datasets: [{ data: distanceSeries, color: (o = 1) => `rgba(255,214,102,${o})` }] }}
              width={Math.max(0, chartWidth)}
              height={180}
              bezier
              withDots
              withInnerLines
              fromZero
              chartConfig={{
                ...chartConfig,
                color: (o = 1) => `rgba(255,214,102,${o})`,
                propsForDots: { r: '3', strokeWidth: '2', stroke: '#FFD166' },
              }}
              style={{ borderRadius: 16, alignSelf: 'center' }}
            />
          ) : (
            <Text style={styles.empty}>Sin datos de distancia</Text>
          )}
        </View>

        <View style={[styles.card, styles.heartCard]}>
          <Animated.View style={{ transform: [{ scale: heartScale }] }}>
            <Ionicons name="heart" size={44} color="#FF3B30" />
          </Animated.View>
          <Text style={[styles.bpmText, { color: '#FFFFFF', marginTop: 8 }]}>{bpm} BPM</Text>
          {last ? (
            <Text style={[styles.rowSub, { marginTop: 4 }]}>Fecha: {new Date(toMillis(last.timestamp)).toLocaleString()}</Text>
          ) : null}
        </View>

        <View style={styles.rowHeader}>
          <Text style={styles.section}>Historial</Text>
          <Pressable onPress={() => setShowAll(v => !v)}>
            <Text style={styles.link}>{showAll ? 'Mostrar recientes' : 'Mostrar todo'}</Text>
          </Pressable>
        </View>
        {history.map((item, i) => (
          <View key={item.id} style={styles.rowCard}>
            <View style={[styles.dot, { backgroundColor: DOTS[i % DOTS.length], marginRight: 10 }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowStrong}>{item.pulso} BPM</Text>
              <Text style={styles.rowSub}>Fecha: {new Date(toMillis(item.timestamp)).toLocaleString()}</Text>
            </View>
            <Pressable onPress={() => {
              Alert.alert('Eliminar entrada', '¿Deseas eliminar este registro?', [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Eliminar', style: 'destructive', onPress: () => remove(ref(db, `lecturas/${item.id}`)) },
              ]);
            }}>
              <Ionicons name="trash" size={18} color="#FF6B6B" />
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'black' },
  scroll: { paddingHorizontal: 20, paddingTop: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  h1: { color: 'white', fontSize: 32, fontFamily: fonts.semibold, marginTop: 10, marginBottom: 10 },
  headerIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: '#1C1C1E', borderRadius: 18, padding: 16, marginBottom: 16 },
  chartCard: { overflow: 'hidden' },
  heartCard: { alignItems: 'center', justifyContent: 'center', height: 200 },
  cardTitle: { color: 'white', fontSize: 16, fontFamily: fonts.semibold, marginBottom: 8 },
  empty: { color: '#9E9EA0', fontFamily: fonts.regular },
  bpmText: { fontSize: 28, fontFamily: fonts.semibold },
  section: { color: 'white', fontSize: 20, fontFamily: fonts.semibold, marginTop: 6, marginBottom: 8 },
  rowHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  rowCard: { backgroundColor: '#1C1C1E', borderRadius: 14, padding: 14, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  dot: { width: 22, height: 22, borderRadius: 11 },
  rowStrong: { color: 'white', fontSize: 16, fontFamily: fonts.semibold },
  rowSub: { color: '#9E9EA0', fontSize: 12, fontFamily: fonts.regular },
  link: { color: 'white', opacity: 0.9, fontSize: 12, fontFamily: fonts.regular },
});

