import React, { useMemo } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
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

        <View style={[styles.card, { padding: 12 }]}> 
          <Text style={[styles.caption, { marginBottom: 8 }]}>Lorem ipsum dolor sit <Text style={{ color: '#A6FF00' }}>AMET</Text></Text>
          <View style={styles.grid}>
            {Array.from({ length: 12 }).map((_, i) => (
              <View key={i} style={styles.gridItem}>
                <Text style={styles.gridTop}>7:15</Text>
                <Text style={styles.gridBottom}>Pulso</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 14, columnGap: 14 },
  gridItem: { width: '30%', alignItems: 'center' },
  gridTop: { color: 'white', fontFamily: 'SFProRounded-Semibold', fontSize: 12 },
  gridBottom: { color: '#FF5757', fontFamily: 'SFProRounded-Semibold', fontSize: 12 },
});
