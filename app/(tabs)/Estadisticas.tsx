import React, { useMemo } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Rect, Line as SvgLine, Circle as SvgCircle, Polyline, Text as SvgText } from 'react-native-svg';

export default function Estadisticas() {
  // Trayecto demo (normalizado 0..1) para visualizar A→B en horizontal
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

        {/* Campo de fútbol horizontal (único) para trazar recorridos futuros */}
        <View style={[styles.card, { padding: 12 }]}> 
          <Text style={[styles.caption, { marginBottom: 8 }]}>Mapa de actividad</Text>
          <View style={styles.pitchWrap}>
            <SoccerField points={route} />
          </View>
        </View>

        {/* Card de grid de datos */}
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

function SoccerField({ points = [] as { x: number; y: number }[] }) {
  // Horizontal: viewBox 160x100
  const W = 160;
  const H = 100;
  const toPoints = (ps: { x: number; y: number }[]) =>
    ps.map((p) => `${(p.x * W).toFixed(2)},${(p.y * H).toFixed(2)}`).join(' ');

  const hasRoute = points && points.length > 1;
  const start = hasRoute ? { X: points[0].x * W, Y: points[0].y * H } : null;
  const end = hasRoute ? { X: points[points.length - 1].x * W, Y: points[points.length - 1].y * H } : null;

  return (
    <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
      {/* Fondo */}
      <Rect x="0" y="0" width={W} height={H} rx="12" fill="#89FF00" />
      {/* Líneas del campo */}
      <Rect x="3" y="3" width={W - 6} height={H - 6} rx="10" stroke="#FFFFFF" strokeWidth="1.5" fill="transparent" />
      <SvgLine x1={W / 2} y1={3} x2={W / 2} y2={H - 3} stroke="#FFFFFF" strokeWidth="1.5" />
      <SvgCircle cx={W / 2} cy={H / 2} r="9" stroke="#FFFFFF" strokeWidth="1.5" fill="transparent" />
      {/* Áreas grandes izquierda/derecha */}
      <Rect x="3" y={H / 2 - 25} width="24" height="50" stroke="#FFFFFF" strokeWidth="1.5" fill="transparent" />
      <Rect x={W - 27} y={H / 2 - 25} width="24" height="50" stroke="#FFFFFF" strokeWidth="1.5" fill="transparent" />
      {/* Áreas pequeñas */}
      <Rect x="3" y={H / 2 - 15} width="12" height="30" stroke="#FFFFFF" strokeWidth="1.5" fill="transparent" />
      <Rect x={W - 15} y={H / 2 - 15} width="12" height="30" stroke="#FFFFFF" strokeWidth="1.5" fill="transparent" />

      {/* Ruta A→B (si existe) */}
      {hasRoute && (
        <Polyline points={toPoints(points)} stroke="#165B33" strokeOpacity="0.9" strokeWidth="2" fill="none" />
      )}
      {/* Marcadores A y B */}
      {start && (
        <SvgCircle cx={start.X} cy={start.Y} r="2.8" fill="#00C853" />
      )}
      {end && (
        <SvgCircle cx={end.X} cy={end.Y} r="3.2" fill="#FF3B30" />
      )}
      {start && (
        <SvgText x={start.X + 3} y={start.Y - 3} fill="#0B3D1E" fontSize="4" fontWeight="700">A</SvgText>
      )}
      {end && (
        <SvgText x={end.X + 3} y={end.Y - 3} fill="#5B1212" fontSize="4" fontWeight="700">B</SvgText>
      )}
    </Svg>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'black' },
  scroll: { padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 12 },
  h1: { color: 'white', fontSize: 32, fontFamily: 'SFProRounded-Semibold' },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF' },
  caption: { color: 'white', fontFamily: 'SFProRounded-Regular', fontSize: 12 },
  card: { backgroundColor: '#1C1C1E', borderRadius: 18, marginBottom: 16 },
  pitchWrap: { aspectRatio: 16 / 10, borderRadius: 16, overflow: 'hidden' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 14, columnGap: 14 },
  gridItem: { width: '30%', alignItems: 'center' },
  gridTop: { color: 'white', fontFamily: 'SFProRounded-Semibold', fontSize: 12 },
  gridBottom: { color: '#FF5757', fontFamily: 'SFProRounded-Semibold', fontSize: 12 },
});
