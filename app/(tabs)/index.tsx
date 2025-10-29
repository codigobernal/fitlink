import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Rect, Line as SvgLine, Circle as SvgCircle, Polyline, Text as SvgText } from 'react-native-svg';
import { onValue, ref, query, orderByChild, limitToLast } from 'firebase/database';
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
  const [dayOffset, setDayOffset] = useState(0); // 0..6

  useEffect(() => {
    // Cargamos más registros para poder cubrir hasta 7 días
    const q = query(ref(db, 'lecturas'), orderByChild('timestamp'), limitToLast(500));
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

  // ==== Dinámica por día (Movimiento/Distancia/Caminar/Correr) ====
  function startOfDay(d: Date) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function endOfDay(d: Date) { const s = startOfDay(d); return new Date(s.getTime() + 24*60*60*1000 - 1); }
  const selectedDate = addDays(new Date(), -dayOffset);
  const dayStart = startOfDay(selectedDate).getTime();
  const dayEnd = endOfDay(selectedDate).getTime();
  const lecturasDiaAsc = useMemo(() => {
    const sameDay = lecturas.filter(l => {
      const ms = toMillis(l.timestamp);
      return ms >= dayStart && ms <= dayEnd;
    });
    // Orden ascendente por tiempo
    return sameDay.sort((a,b) => toMillis(a.timestamp) - toMillis(b.timestamp));
  }, [lecturas, dayStart, dayEnd]);

  function inferDistanceKm(reads: Lectura[]) {
    if (reads.length === 0) return { total: 0, deltas: [] as number[], cumulative: false };
    // Detectar si distancia parece acumulada
    let nonDecreasing = 0;
    for (let i = 1; i < reads.length; i++) {
      if ((reads[i].distancia ?? 0) >= (reads[i-1].distancia ?? 0)) nonDecreasing++;
    }
    const ratio = reads.length > 1 ? nonDecreasing / (reads.length - 1) : 0;
    const cumulative = ratio >= 0.6; // umbral heurístico
    if (cumulative) {
      const deltas: number[] = [];
      let sum = 0;
      for (let i = 1; i < reads.length; i++) {
        const prev = reads[i-1].distancia ?? 0;
        const cur = reads[i].distancia ?? 0;
        const d = Math.max(0, cur - prev);
        deltas.push(d);
        sum += d;
      }
      return { total: sum, deltas, cumulative: true };
    } else {
      // Si no es acumulada: sumatoria simple (asumiendo muestras parciales)
      const values = reads.map(r => r.distancia ?? 0);
      const sum = values.reduce((a,b)=>a+b, 0);
      // repartir en deltas por muestra (uniforme)
      const avg = reads.length ? sum / reads.length : 0;
      const deltas = reads.map(()=>avg);
      return { total: sum, deltas, cumulative: false };
    }
  }

  const { total: kmDia, deltas: distDeltas } = inferDistanceKm(lecturasDiaAsc);
  const bpmThreshold = 100; // umbral simple para caminar vs correr
  let distWalk = 0, distRun = 0;
  for (let i = 0; i < lecturasDiaAsc.length; i++) {
    const d = distDeltas[i] ?? 0;
    const bpmVal = lecturasDiaAsc[i]?.pulso ?? 0;
    if (bpmVal > bpmThreshold) distRun += d; else distWalk += d;
  }
  // kcal estimadas por km (placeholder)
  const kcalDia = kmDia * 65;

  const statItems = [
    { c:'#7F1D1D', t:'Movimiento', v: kmDia ? `${Math.round(kcalDia)} KCAL/DÍA` : '--', vc:'#FF4D4D' },
    { c:'#1E3A8A', t:'Distancia', v: kmDia ? `${kmDia.toFixed(2)} KM/DÍA` : '--', vc:'#3BA4FF' },
    { c:'#5B21B6', t:'Caminar', v: distWalk ? `${distWalk.toFixed(2)} KM` : '--', vc:'#C084FC' },
    { c:'#14532D', t:'Correr', v: distRun ? `${distRun.toFixed(2)} KM` : '--', vc:'#22C55E' },
  ];

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

        <View style={styles.cardLarge}>
          <Text style={styles.cardTitle}>Lectura reciente</Text>
          {latest ? (
            <View style={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1, backgroundColor: '#111214', borderRadius: 12, padding: 12 }}>
                  <Text style={[styles.caption, { marginBottom: 4 }]}>Pulso</Text>
                  <Text style={[styles.rowStrong, { color: '#A6FF00' }]}>{latest.pulso} <Text style={{ color: '#FF5757', fontFamily: 'SFProRounded-Semibold' }}>BPM</Text></Text>
                </View>
                <View style={{ flex: 1, backgroundColor: '#111214', borderRadius: 12, padding: 12 }}>
                  <Text style={[styles.caption, { marginBottom: 4 }]}>Oxígeno</Text>
                  <Text style={styles.rowStrong}>{latest.oxigeno}%</Text>
                </View>
              </View>
              <View style={{ backgroundColor: '#111214', borderRadius: 12, padding: 12 }}>
                <Text style={[styles.caption, { marginBottom: 2 }]}>Distancia</Text>
                <Text style={styles.rowStrong}>{latest.distancia} km</Text>
                <Text style={[styles.rowSub, { marginTop: 6 }]}>Fecha: {new Date(lastMs).toLocaleString()}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.empty}>Aun no hay lecturas</Text>
          )}
        </View>

        {/* Actividad + fecha + tarjetas */}
        <View style={[styles.cardLarge, { padding: 12 }]}> 
          <Text style={styles.cardTitle}>Mapa de actividad</Text>
          <View style={styles.pitchWrap}>
            <SoccerField points={[{x:0.08,y:0.8},{x:0.16,y:0.7},{x:0.28,y:0.62},{x:0.4,y:0.55},{x:0.54,y:0.5},{x:0.68,y:0.46},{x:0.82,y:0.4},{x:0.92,y:0.35}]} />
          </View>
        </View>

        <View style={styles.switcher}>
          <Ionicons name="chevron-back" size={20} color="#FFFFFF" onPress={() => setDayOffset(n => Math.min(6, n+1))} />
          <Text style={styles.switcherTitle}>{formatDay(addDays(new Date(), -dayOffset))}</Text>
          <Ionicons name="chevron-forward" size={20} color="#FFFFFF" onPress={() => setDayOffset(n => Math.max(0, n-1))} />
        </View>

        {statItems.map((s, i) => (
          <View key={i} style={[styles.cardLarge, { flexDirection:'row', alignItems:'center', gap:12, padding:12 }]}> 
            <View style={{ width:28, height:28, borderRadius:14, backgroundColor: s.c }} />
            <View style={{ gap:4 }}>
              <Text style={styles.statTitle}>{s.t}</Text>
              <Text style={[styles.statValue, { color: s.vc }]}>{s.v}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'black' },
  scroll: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  h1: { color: 'white', fontSize: 32, fontFamily: 'SFProRounded-Semibold', marginTop: 10, marginBottom: 10 },
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
  statTitle: { color: 'white', fontFamily: 'SFProRounded-Semibold' },
  statValue: { fontFamily: 'SFProRounded-Semibold' },
  pitchWrap: { aspectRatio: 16/10, borderRadius: 16, overflow: 'hidden' },
  switcher: { backgroundColor: '#1C1C1E', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  switcherTitle: { color: 'white', fontFamily: 'SFProRounded-Semibold', fontSize: 16 },
});

// Helpers fecha + campo
function addDays(d: Date, days: number) { const x = new Date(d); x.setDate(x.getDate() + days); return x; }
function formatDay(d: Date) {
  const days = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  return `${days[d.getDay()]} ${d.getDate()} de ${months[d.getMonth()]}`;
}

type P = { x:number;y:number };
function SoccerField({ points = [] as P[] }) {
  const W = 160; const H = 100;
  const toPolyline = (items:P[]) => items.map(p=>`${(p.x*W).toFixed(2)},${(p.y*H).toFixed(2)}`).join(' ');
  const has = points.length>1; const s = has ? {x:points[0].x*W,y:points[0].y*H}:null; const e = has ? {x:points[points.length-1].x*W,y:points[points.length-1].y*H}:null;
  return (
    <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
      <Rect x="0" y="0" width={W} height={H} rx="12" fill="#89FF00" />
      <Rect x="3" y="3" width={W-6} height={H-6} rx="10" stroke="#FFFFFF" strokeWidth="1.5" fill="none" />
      <SvgLine x1={W/2} y1={3} x2={W/2} y2={H-3} stroke="#FFFFFF" strokeWidth="1.5" />
      <SvgCircle cx={W/2} cy={H/2} r="9" stroke="#FFFFFF" strokeWidth="1.5" fill="none" />
      <Rect x="3" y={H/2-25} width="24" height="50" stroke="#FFFFFF" strokeWidth="1.5" fill="none" />
      <Rect x={W-27} y={H/2-25} width="24" height="50" stroke="#FFFFFF" strokeWidth="1.5" fill="none" />
      <Rect x="3" y={H/2-15} width="12" height="30" stroke="#FFFFFF" strokeWidth="1.5" fill="none" />
      <Rect x={W-15} y={H/2-15} width="12" height="30" stroke="#FFFFFF" strokeWidth="1.5" fill="none" />
      {has && (<Polyline points={toPolyline(points)} stroke="#165B33" strokeOpacity="0.9" strokeWidth="2" fill="none" />)}
      {s && (<SvgCircle cx={s.x} cy={s.y} r="3" fill="#00C853" />)}
      {e && (<SvgCircle cx={e.x} cy={e.y} r="3.4" fill="#FF3B30" />)}
      {s && (<SvgText x={s.x + 3} y={s.y - 3} fill="#0B3D1E" fontSize="4" fontWeight="700">A</SvgText>)}
      {e && (<SvgText x={e.x + 3} y={e.y - 3} fill="#5B1212" fontSize="4" fontWeight="700">B</SvgText>)}
    </Svg>
  );
}

