import React, { useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Rect, Line as SvgLine, Circle as SvgCircle, Polyline, Text as SvgText } from 'react-native-svg';

export default function Estadisticas() {
  const route = useMemo(
    () => [
      { x: 0.08, y: 0.80 },
      { x: 0.16, y: 0.70 },
      { x: 0.28, y: 0.62 },
      { x: 0.40, y: 0.55 },
      { x: 0.54, y: 0.50 },
      { x: 0.68, y: 0.46 },
      { x: 0.82, y: 0.40 },
      { x: 0.92, y: 0.35 },
    ],
    []
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <Text style={styles.h1}>Estadisticas</Text>
          <View style={styles.avatar} />
        </View>

        <View style={[styles.card, { padding: 12 }]}> 
          <Text style={[styles.caption, { marginBottom: 8 }]}>Mapa de actividad</Text>
          <View style={styles.pitchWrap}>
            <SoccerField points={route} />
          </View>
        </View>

        <DateSwitcher />
        <StatItem color="#7F1D1D" title="Movimiento" value="-/- KCAL/DÍA" valueColor="#FF4D4D" />
        <StatItem color="#1E3A8A" title="Distancia" value="-/- KM/DÍA" valueColor="#3BA4FF" />
        <StatItem color="#5B21B6" title="Caminar" value="-/- /KM" valueColor="#C084FC" />
        <StatItem color="#14532D" title="Correr" value="-/- /KM" valueColor="#22C55E" />
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
  pitchWrap: { aspectRatio: 16 / 10, borderRadius: 16, overflow: 'hidden' },
  switcher: { backgroundColor: '#1C1C1E', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  switcherArrow: { color: 'white', fontSize: 18, paddingHorizontal: 8 },
  switcherTitle: { color: 'white', fontFamily: 'SFProRounded-Semibold', fontSize: 16 },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  statDot: { width: 28, height: 28, borderRadius: 14 },
  statTitle: { color: 'white', fontFamily: 'SFProRounded-Semibold' },
  statValue: { fontFamily: 'SFProRounded-Semibold' },
});
