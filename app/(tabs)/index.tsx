import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, Dimensions, ScrollView, Animated, Alert } from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { onValue, ref, query, orderByChild, limitToLast, remove } from 'firebase/database';
import { db } from '../../firebaseConfig';

type Lectura = { id: string; pulso: number; oxigeno: number; distancia: number; timestamp: any };

function toMillis(ts: any) {
  if (typeof ts === 'number') return ts > 1e12 ? ts : ts * 1000;
  const n = Number(ts);
  if (!Number.isNaN(n)) return n > 1e12 ? n : n * 1000;
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

export default function Home() {
  const [lecturas, setLecturas] = useState<Lectura[]>([]);

  useEffect(() => {
    const q = query(ref(db, 'lecturas'), orderByChild('timestamp'), limitToLast(5));
    const unsub = onValue(q, (snap) => {
      const data = snap.val();
      if (!data) return setLecturas([]);
      const arr: Lectura[] = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
      arr.sort((a, b) => toMillis(b.timestamp) - toMillis(a.timestamp));
      setLecturas(arr);
    });
    return () => unsub();
  }, []);

  const latest = lecturas[0];
  const lastMs = latest ? toMillis(latest.timestamp) : 0;
  const connected = lastMs > 0 && Date.now() - lastMs < 2 * 60 * 1000;

  const last12 = useMemo(() => lecturas.slice(0, 12).reverse(), [lecturas]);
  const labels = last12.map((item, idx) => (idx % 3 === 0 ? new Date(toMillis(item.timestamp)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''));
  const pulsoValues = last12.map((i) => i.pulso ?? 0);
  const oxigenoValues = last12.map((i) => i.oxigeno ?? 0);

  const chartConfig = {
    backgroundGradientFrom: '#111',
    backgroundGradientTo: '#111',
    color: (opacity = 1) => `rgba(166, 255, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255,255,255,${opacity})`,
    barPercentage: 0.6,
    fillShadowGradientFrom: '#A6FF00',
    fillShadowGradientTo: '#A6FF00',
    decimalPlaces: 0,
    propsForLabels: { fontFamily: 'SFProRounded-Regular', fontSize: 10 },
  } as const;

  const bpm = latest?.pulso ?? 60;
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

  const [widthPulse, setWidthPulse] = useState(Dimensions.get('window').width - 64);
  const [widthOxy, setWidthOxy] = useState(Dimensions.get('window').width - 64);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <Text style={styles.h1}>Inicio</Text>
          <View style={styles.avatar} />
        </View>

        <View style={styles.cardSmall}>
          <View style={styles.statusRow}>
            <View style={styles.wifiCircle}>
              <Ionicons name="wifi" size={18} color="#111" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.caption}>Estado</Text>
              <Text numberOfLines={1} style={[styles.status, { color: connected ? '#A6FF00' : '#FF5757' }]}>
                {connected ? 'Conectado' : 'Desconectado'}
              </Text>
            </View>
            <Text style={styles.link}>Conectar</Text>
          </View>
        </View>

        <View style={[styles.cardLarge, styles.chartCard]} onLayout={(e) => setWidthPulse(Math.max(160, Math.floor(e.nativeEvent.layout.width - 24)))}>
          <Text style={styles.cardTitle}>Pulso</Text>
          {last12.length > 1 ? (
            <BarChart data={{ labels, datasets: [{ data: pulsoValues }] }} width={widthPulse} height={160} chartConfig={chartConfig} withInnerLines={false} fromZero style={{ borderRadius: 16 }} />
          ) : (
            <Text style={styles.empty}>Sin datos recientes</Text>
          )}
        </View>

        <View style={[styles.cardLarge, styles.chartCard]} onLayout={(e) => setWidthOxy(Math.max(160, Math.floor(e.nativeEvent.layout.width - 24)))}>
          <Text style={styles.cardTitle}>Oxigeno</Text>
          {last12.length > 1 ? (
            <LineChart data={{ labels, datasets: [{ data: oxigenoValues }] }} width={widthOxy} height={160} chartConfig={{ ...chartConfig, color: (o=1)=>`rgba(255,255,255,${o})`, fillShadowGradientFrom: '#FFFFFF', fillShadowGradientTo: '#FFFFFF' }} withDots bezier withInnerLines={false} fromZero style={{ borderRadius: 16 }} />
          ) : (
            <Text style={styles.empty}>Sin datos recientes</Text>
          )}
        </View>

        <View style={[styles.cardLarge, styles.heartCard]}>
          <Animated.View style={{ transform: [{ scale: heartScale }] }}>
            <Ionicons name="heart" size={96} color={bpmGood ? '#FF2D55' : '#9E1C1C'} />
          </Animated.View>
          <Text style={[styles.caption, { marginTop: 6 }]}>Bla bla bla</Text>
          <Text style={[styles.bpmText, { color: bpmGood ? '#A6FF00' : 'white' }]}>
            {bpm || '--'} <Text style={{ color: '#FF5757' }}>BPM</Text>
          </Text>
        </View>

        <View style={styles.cardLarge}>
          <Text style={styles.cardTitle}>Ultima lectura</Text>
          {latest ? (
            <View style={{ gap: 6 }}>
              <Text style={styles.row}>Pulso: {latest.pulso}</Text>
              <Text style={styles.row}>Oxigeno: {latest.oxigeno}%</Text>
              <Text style={styles.row}>Distancia: {latest.distancia} km</Text>
              <Text style={styles.row}>Fecha: {new Date(lastMs).toLocaleString()}</Text>
            </View>
          ) : (
            <Text style={styles.empty}>Aun no hay lecturas</Text>
          )}
        </View>

        <Text style={styles.section}>Historial</Text>
        {lecturas.map((item, index) => {
          const colors = ['#A6FF00', '#FFD166', '#00D1FF', '#FF7F50', '#C084FC'];
          const icons: (keyof typeof Ionicons.glyphMap)[] = ['bicycle', 'walk', 'flame', 'pulse', 'stopwatch'];
          const color = colors[index % colors.length];
          const icon = icons[index % icons.length];
          return (
            <View key={item.id} style={styles.rowCard}>
              <View style={[styles.dot, { backgroundColor: color, alignItems: 'center', justifyContent: 'center' }]}> 
                <Ionicons name={icon} size={12} color="#111" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowStrong}>{item.pulso} BPM</Text>
                <Text style={styles.rowSub}>{new Date(toMillis(item.timestamp)).toLocaleString()}</Text>
              </View>
              <Text style={styles.rowRight}>{item.oxigeno}% O2</Text>
              <Ionicons name="trash" size={18} color="#FF6B6B" onPress={() => {
                Alert.alert('Eliminar registro', 'Deseas eliminar este registro?', [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Eliminar', style: 'destructive', onPress: async () => { try { await remove(ref(db as any, `lecturas/${item.id}`)); } catch {} } },
                ]);
              }} />
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'black' },
  scroll: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  h1: { color: 'white', fontSize: 32, fontFamily: 'SFProRounded-Semibold' },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFFFFF' },
  caption: { color: 'white', opacity: 0.7, fontSize: 12, fontFamily: 'SFProRounded-Regular' },
  status: { fontSize: 16, fontFamily: 'SFProRounded-Semibold' },
  link: { color: 'white', opacity: 0.9, fontSize: 12, fontFamily: 'SFProRounded-Regular' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardSmall: { backgroundColor: '#1C1C1E', borderRadius: 18, padding: 16, marginBottom: 16 },
  cardLarge: { backgroundColor: '#1C1C1E', borderRadius: 18, padding: 16, marginBottom: 16 },
  chartCard: { overflow: 'hidden' },
  heartCard: { alignItems: 'center', justifyContent: 'center', height: 200 },
  cardTitle: { color: 'white', fontSize: 16, fontFamily: 'SFProRounded-Semibold', marginBottom: 8 },
  empty: { color: '#9E9EA0', fontFamily: 'SFProRounded-Regular' },
  wifiCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#A6FF00', alignItems: 'center', justifyContent: 'center' },
  bpmText: { fontSize: 28, fontFamily: 'SFProRounded-Semibold' },
  section: { color: 'white', fontSize: 20, fontFamily: 'SFProRounded-Semibold', marginTop: 6, marginBottom: 8 },
  row: { color: 'white', fontFamily: 'SFProRounded-Regular' },
  rowCard: { backgroundColor: '#1C1C1E', borderRadius: 14, padding: 14, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  dot: { width: 22, height: 22, borderRadius: 11 },
  rowStrong: { color: 'white', fontSize: 16, fontFamily: 'SFProRounded-Semibold' },
  rowSub: { color: '#9E9EA0', fontSize: 12, fontFamily: 'SFProRounded-Regular' },
  rowRight: { color: 'white', fontSize: 12, fontFamily: 'SFProRounded-Regular' },
});

