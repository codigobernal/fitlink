import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View, Pressable, Animated, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { onValue, ref, query, orderByChild, limitToLast, remove } from 'firebase/database';
import { db } from '../../firebaseConfig';
import { Dimensions } from 'react-native';

type Lectura = { id: string; pulso: number; oxigeno: number; distancia: number; timestamp: any };
function toMillis(ts: any) { if (typeof ts === 'number') return ts > 1e12 ? ts : ts * 1000; const n = Number(ts); if (!Number.isNaN(n)) return n > 1e12 ? n : n * 1000; const d = new Date(ts); return Number.isNaN(d.getTime()) ? 0 : d.getTime(); }

export default function Estadisticas() {
  const [lecturas, setLecturas] = useState<Lectura[]>([]);
  useEffect(() => {
    const q = query(ref(db, 'lecturas'), orderByChild('timestamp'), limitToLast(20));
    const unsub = onValue(q, (snap) => {
      const data = snap.val();
      if (!data) return setLecturas([]);
      const arr: Lectura[] = Object.keys(data).map((k) => ({ id: k, ...data[k] }));
      arr.sort((a,b)=> toMillis(a.timestamp) - toMillis(b.timestamp));
      setLecturas(arr);
    });
    return () => unsub();
  }, []);

  const labels = lecturas.map((l, i) => (i % 4 === 0 ? new Date(toMillis(l.timestamp)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''));
  const pulso = lecturas.map(l => l.pulso ?? 0);
  const oxi = lecturas.map(l => l.oxigeno ?? 0);
  const bpm = lecturas.length ? lecturas[lecturas.length-1].pulso : 60;
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
    color: (o=1)=>`rgba(166,255,0,${o})`,
    labelColor: (o=1)=>`rgba(255,255,255,${o})`,
    decimalPlaces: 0,
    propsForLabels: { fontFamily: 'SFProRounded-Regular', fontSize: 10 },
    propsForBackgroundLines: { stroke: 'rgba(255,255,255,0.15)', strokeDasharray: '4 6' },
    propsForDots: { r: '3', strokeWidth: '2', stroke: '#A6FF00' },
    strokeWidth: 2,
  } as const;
  const [chartWidth, setChartWidth] = useState(0);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <Text style={styles.h1}>Estadisticas</Text>
          <View style={styles.avatar} />
        </View>

        <View style={[styles.card, styles.chartCard]} onLayout={({ nativeEvent }) => setChartWidth(nativeEvent.layout.width - 24)}>
          <Text style={styles.cardTitle}>Pulso</Text>
          {pulso.length > 1 ? (
            <LineChart
              data={{
                labels,
                datasets: [
                  { data: pulso, color: (o=1)=>`rgba(166,255,0,${o})` },
                ],
              }}
              width={Math.max(0, chartWidth)}
              height={180}
              bezier
              withDots
              withInnerLines
              fromZero
              chartConfig={chartConfig}
              style={{ borderRadius: 16, alignSelf: 'center' }}
            />
          ) : (<Text style={styles.empty}>Sin datos</Text>)}
        </View>

        <View style={[styles.card, styles.chartCard]} onLayout={({ nativeEvent }) => setChartWidth(nativeEvent.layout.width - 24)}>
          <Text style={styles.cardTitle}>Oxígeno</Text>
          {oxi.length > 1 ? (
            <LineChart
              data={{
                labels,
                datasets: [
                  { data: oxi, color: (o=1)=>`rgba(255,255,255,${o})` },
                ],
              }}
              width={Math.max(0, chartWidth)}
              height={180}
              bezier
              withDots
              withInnerLines
              fromZero
              chartConfig={{ ...chartConfig, propsForDots: { r: '3', strokeWidth: '2', stroke: '#FFFFFF' } }}
              style={{ borderRadius: 16, alignSelf: 'center' }}
            />
          ) : (<Text style={styles.empty}>Sin datos</Text>)}
        </View>

        <View style={[styles.card, { alignItems:'center', justifyContent:'center', paddingVertical: 24 }]}>
          <Animated.View style={{ transform:[{ scale: heartScale }] }}>
            <Ionicons name="heart" size={96} color={bpmGood ? '#FF2D55' : '#9E1C1C'} />
          </Animated.View>
          <Text style={[styles.caption, { marginTop: 6 }]}>BPM actual</Text>
          <Text style={{ color: bpmGood ? '#A6FF00' : 'white', fontSize: 28, fontFamily: 'SFProRounded-Semibold' }}>{bpm || '--'} <Text style={{ color:'#FF5757' }}>BPM</Text></Text>
        </View>

        <Text style={styles.section}>Historial</Text>
        {lecturas.slice(-5).reverse().map((item, idx) => {
          const ts = toMillis(item.timestamp);
          const color = ['#A6FF00','#FFD54F','#4FC3F7','#CE93D8','#80CBC4'][idx % 5];
          return (
            <View key={item.id} style={styles.rowCard}>
              <View style={[styles.dot, { backgroundColor: color }]} />
              <View style={{ flex:1 }}>
                <Text style={styles.rowStrong}>{item.pulso} <Text style={{ color:'#FF5757' }}>BPM</Text></Text>
                <Text style={styles.rowSub}>Fecha: {new Date(ts).toLocaleString()}</Text>
              </View>
              <Pressable onPress={() => {
                Alert.alert('Eliminar registro', '¿Seguro que deseas eliminar este registro?', [
                  { text:'Cancelar', style:'cancel' },
                  { text:'Eliminar', style:'destructive', onPress: async () => { try { await remove(ref(db, `lecturas/${item.id}`)); } catch(e){} } }
                ]);
              }}>
                <Ionicons name="trash" size={18} color="#FFFFFF" />
              </Pressable>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

function formatDay(d: Date) {
  const today = new Date();
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (d.toDateString() === base.toDateString()) return 'Hoy';
  const days = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const dayName = days[d.getDay()];
  const dayNum = d.getDate();
  const monthName = months[d.getMonth()];
  return `${dayName} ${dayNum} de ${monthName}`;
}

function DateSwitcher() {
  const [offset, setOffset] = useState(0); // 0..6
  const now = new Date();
  const show = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
  return (
    <View style={styles.switcher}>
      <Pressable disabled={offset >= 6} onPress={() => setOffset((n) => Math.min(6, n + 1))} style={({ pressed }) => [{ opacity: offset >= 6 ? 0.35 : pressed ? 0.7 : 1 }]}>
        <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
      </Pressable>
      <Text style={styles.switcherTitle}>{formatDay(show)}</Text>
      <Pressable disabled={offset === 0} onPress={() => setOffset((n) => Math.max(0, n - 1))} style={({ pressed }) => [{ opacity: offset === 0 ? 0.35 : pressed ? 0.7 : 1 }]}>
        <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

function StatItem({ color, title, value, valueColor }: { color: string; title: string; value: string; valueColor: string }) {
  return (
    <View style={[styles.card, styles.statRow]}> 
      <View style={[styles.statDot, { backgroundColor: color }]} />
      <View style={{ gap: 4 }}>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={[styles.statValue, { color: valueColor }]}>{value}</Text>
      </View>
    </View>
  );
}

type Point = { x: number; y: number };

function SoccerField({ points = [] as Point[] }) {
  const WIDTH = 160;
  const HEIGHT = 100;
  const toPolyline = (items: Point[]) =>
    items.map((p) => `${(p.x * WIDTH).toFixed(2)},${(p.y * HEIGHT).toFixed(2)}`).join(' ');

  const hasRoute = points.length > 1;
  const start = hasRoute ? { x: points[0].x * WIDTH, y: points[0].y * HEIGHT } : null;
  const end = hasRoute ? { x: points[points.length - 1].x * WIDTH, y: points[points.length - 1].y * HEIGHT } : null;

  return (
    <Svg width="100%" height="100%" viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
      <Rect x="0" y="0" width={WIDTH} height={HEIGHT} rx="12" fill="#89FF00" />
      <Rect x="3" y="3" width={WIDTH - 6} height={HEIGHT - 6} rx="10" stroke="#FFFFFF" strokeWidth="1.5" fill="none" />
      <SvgLine x1={WIDTH / 2} y1={3} x2={WIDTH / 2} y2={HEIGHT - 3} stroke="#FFFFFF" strokeWidth="1.5" />
      <SvgCircle cx={WIDTH / 2} cy={HEIGHT / 2} r="9" stroke="#FFFFFF" strokeWidth="1.5" fill="none" />
      <Rect x="3" y={HEIGHT / 2 - 25} width="24" height="50" stroke="#FFFFFF" strokeWidth="1.5" fill="none" />
      <Rect x={WIDTH - 27} y={HEIGHT / 2 - 25} width="24" height="50" stroke="#FFFFFF" strokeWidth="1.5" fill="none" />
      <Rect x="3" y={HEIGHT / 2 - 15} width="12" height="30" stroke="#FFFFFF" strokeWidth="1.5" fill="none" />
      <Rect x={WIDTH - 15} y={HEIGHT / 2 - 15} width="12" height="30" stroke="#FFFFFF" strokeWidth="1.5" fill="none" />

      {hasRoute && (
        <Polyline points={toPolyline(points)} stroke="#165B33" strokeOpacity="0.9" strokeWidth="2" fill="none" />
      )}
      {start && <SvgCircle cx={start.x} cy={start.y} r="3" fill="#00C853" />}
      {end && <SvgCircle cx={end.x} cy={end.y} r="3.4" fill="#FF3B30" />}
      {start && <SvgText x={start.x + 3} y={start.y - 3} fill="#0B3D1E" fontSize="4" fontWeight="700">A</SvgText>}
      {end && <SvgText x={end.x + 3} y={end.y - 3} fill="#5B1212" fontSize="4" fontWeight="700">B</SvgText>}
    </Svg>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'black' },
  scroll: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  h1: { color: 'white', fontSize: 32, fontFamily: 'SFProRounded-Semibold', marginTop: 10, marginBottom: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFFFFF' },
  caption: { color: 'white', fontFamily: 'SFProRounded-Regular', fontSize: 12 },
  card: { backgroundColor: '#1C1C1E', borderRadius: 18, marginBottom: 16 },
  chartCard: { padding: 12, overflow: 'hidden' },
  cardTitle: { color: 'white', fontSize: 16, fontFamily: 'SFProRounded-Semibold', marginBottom: 8 },
  empty: { color: '#9E9EA0', fontFamily: 'SFProRounded-Regular' },
  pitchWrap: { aspectRatio: 16 / 10, borderRadius: 16, overflow: 'hidden' },
  switcher: { backgroundColor: '#1C1C1E', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  switcherArrow: { color: 'white', fontSize: 18, paddingHorizontal: 8 },
  switcherTitle: { color: 'white', fontFamily: 'SFProRounded-Semibold', fontSize: 16 },
  section: { color: 'white', fontSize: 20, fontFamily: 'SFProRounded-Semibold', marginTop: 6, marginBottom: 8 },
  rowCard: { backgroundColor: '#1C1C1E', borderRadius: 14, padding: 14, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  dot: { width: 22, height: 22, borderRadius: 11 },
  rowStrong: { color: 'white', fontSize: 16, fontFamily: 'SFProRounded-Semibold' },
  rowSub: { color: '#9E9EA0', fontSize: 12, fontFamily: 'SFProRounded-Regular' },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  statDot: { width: 28, height: 28, borderRadius: 14 },
  statTitle: { color: 'white', fontFamily: 'SFProRounded-Semibold' },
  statValue: { fontFamily: 'SFProRounded-Semibold' },
});
