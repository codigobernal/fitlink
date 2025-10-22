import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { db } from '../../firebaseConfig';
import { onValue, ref } from 'firebase/database';

type Lectura = {
  id: string;
  pulso: number;
  oxigeno: number;
  distancia: number;
  timestamp: any;
};

function toMillis(ts: any): number {
  if (typeof ts === 'number') return ts > 1e12 ? ts : ts * 1000;
  const n = Number(ts);
  if (!Number.isNaN(n)) return n > 1e12 ? n : n * 1000;
  const d = new Date(ts);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

export default function Home() {
  const [lecturas, setLecturas] = useState<Lectura[]>([]);

  useEffect(() => {
    const lecturasRef = ref(db, 'lecturas');
    const unsub = onValue(lecturasRef, (snap) => {
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
  const connected = lastMs > 0 && Date.now() - lastMs < 2 * 60 * 1000; // 2 min

  const last12 = useMemo(() => lecturas.slice(0, 12).reverse(), [lecturas]);
  const labels = last12.map((l, i) => (i % 3 === 0 ? new Date(toMillis(l.timestamp)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''));
  const pulso = last12.map((l) => l.pulso ?? 0);

  const screenWidth = Dimensions.get('window').width;
  const chartConfig = {
    backgroundGradientFrom: '#111',
    backgroundGradientTo: '#111',
    color: (opacity = 1) => `rgba(166, 255, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255,255,255,${opacity})`,
    barPercentage: 0.6,
    fillShadowGradientFrom: '#A6FF00',
    fillShadowGradientTo: '#A6FF00',
  } as const;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.h1}>Inicio</Text>

        {/* Estado de conexión */}
        <View style={styles.cardSmall}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={styles.iconCircle} />
            <View style={{ flex: 1 }}>
              <Text style={styles.caption}>Estado:</Text>
              <Text style={[styles.status, { color: connected ? '#A6FF00' : '#FF5757' }]}>
                {connected ? 'Conectado' : 'Desconectado'}
              </Text>
            </View>
            <Text style={styles.link}>Conectar</Text>
          </View>
        </View>

        {/* Gráfica pulso */}
        <View style={styles.cardLarge}>
          <Text style={styles.cardTitle}>Pulso</Text>
          {last12.length > 1 ? (
            <BarChart
              data={{ labels, datasets: [{ data: pulso }] }}
              width={screenWidth - 60}
              height={160}
              chartConfig={chartConfig}
              withInnerLines={false}
              fromZero
              style={{ borderRadius: 16 }}
            />
          ) : (
            <Text style={styles.empty}>Sin datos recientes</Text>
          )}
        </View>

        {/* Resumen última lectura */}
        <View style={styles.cardLarge}>
          <Text style={styles.cardTitle}>Última lectura</Text>
          {latest ? (
            <View style={{ gap: 6 }}>
              <Text style={styles.row}>Pulso: {latest.pulso}</Text>
              <Text style={styles.row}>Oxígeno: {latest.oxigeno}%</Text>
              <Text style={styles.row}>Distancia: {latest.distancia} km</Text>
              <Text style={styles.row}>Fecha: {new Date(lastMs).toLocaleString()}</Text>
            </View>
          ) : (
            <Text style={styles.empty}>Aún no hay lecturas</Text>
          )}
        </View>

        {/* Historial breve */}
        <Text style={styles.section}>Historial</Text>
        {lecturas.slice(0, 3).map((it) => (
          <View key={it.id} style={styles.rowCard}>
            <View style={styles.dot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowStrong}>{it.pulso} BPM</Text>
              <Text style={styles.rowSub}>{new Date(toMillis(it.timestamp)).toLocaleString()}</Text>
            </View>
            <Text style={styles.rowRight}>{it.oxigeno}% O2</Text>
          </View>
        ))}

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'black' },
  scroll: { padding: 20, paddingBottom: 24 },
  h1: { color: 'white', fontSize: 32, fontFamily: 'SFProRounded-Semibold', marginTop: 8, marginBottom: 12 },
  caption: { color: 'white', opacity: 0.7, fontSize: 12 },
  status: { fontSize: 18, fontFamily: 'SFProRounded-Semibold' },
  link: { color: 'white', opacity: 0.9, fontSize: 12 },
  cardSmall: { backgroundColor: '#1C1C1E', borderRadius: 16, padding: 16, marginBottom: 16 },
  cardLarge: { backgroundColor: '#1C1C1E', borderRadius: 16, padding: 16, marginBottom: 16 },
  cardTitle: { color: 'white', fontSize: 16, fontFamily: 'SFProRounded-Semibold', marginBottom: 8 },
  empty: { color: '#9E9EA0' },
  iconCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'white' },
  section: { color: 'white', fontSize: 20, fontFamily: 'SFProRounded-Semibold', marginTop: 6, marginBottom: 8 },
  row: { color: 'white' },
  rowCard: { backgroundColor: '#1C1C1E', borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 20, height: 20, backgroundColor: '#A6FF00', borderRadius: 10 },
  rowStrong: { color: 'white', fontSize: 16, fontFamily: 'SFProRounded-Semibold' },
  rowSub: { color: '#9E9EA0', fontSize: 12 },
  rowRight: { color: 'white', fontSize: 12 },
});
