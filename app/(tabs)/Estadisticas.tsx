import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable, Animated, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { limitToLast, onValue, orderByChild, query, ref, remove } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../firebaseConfig';
import { fonts } from '../../constants/fonts';

 type Lectura = { id: string; pulso: number; oxigeno: number; distancia: number; timestamp: any };
 function toMillis(ts: any) { if (typeof ts === 'number') return ts > 1e12 ? ts : ts * 1000; const n = Number(ts); if (!Number.isNaN(n)) return n > 1e12 ? n : n * 1000; const d = new Date(ts); return Number.isNaN(d.getTime()) ? 0 : d.getTime(); }
 
 export default function Estadisticas() {
   const insets = useSafeAreaInsets();
   const [showAll, setShowAll] = useState(false);
   const [lecturas, setLecturas] = useState<Lectura[]>([]);
   const [profileIcon, setProfileIcon] = useState<{ name?: keyof typeof Ionicons.glyphMap; color?: string }>({});
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
           <Text style={styles.h1}>Estadísticas</Text>
           <View style={[styles.headerIcon, { backgroundColor: profileIcon.color || '#2B2B2E' }]}> 
             <Ionicons name={profileIcon.name || 'person'} size={18} color="#111" />
           </View>
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
               chartConfig={{ ...chartConfig, propsForDots: { r: '3', strokeWidth: '2', stroke: '#FFFFFF' }, color: (o=1)=>`rgba(255,255,255,${o})` }}
               style={{ borderRadius: 16, alignSelf: 'center' }}
             />
           ) : (<Text style={styles.empty}>Sin datos</Text>)}
         </View>
 
         <View style={[styles.card, { alignItems:'center', justifyContent:'center', paddingVertical: 24 }]}>
           <Animated.View style={{ transform:[{ scale: heartScale }] }}>
             <Ionicons name="heart" size={96} color={bpmGood ? '#FF2D55' : '#9E1C1C'} />
           </Animated.View>
           <Text style={[styles.caption, { marginTop: 6 }]}>BPM actual</Text>
           <Text style={{ color: bpmGood ? '#A6FF00' : 'white', fontSize: 28, fontFamily: fonts.semibold }}>{bpm || '--'} <Text style={{ color:'#FF5757' }}>BPM</Text></Text>
         </View>
 
         <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
           <Text style={styles.section}>Historial</Text>
           <Pressable onPress={() => setShowAll((v) => !v)} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, paddingHorizontal: 8, paddingVertical: 4 }]}>
             <Text style={{ color: '#A6FF00', fontFamily: fonts.semibold }}>{showAll ? 'Mostrar recientes' : 'Mostrar todo'}</Text>
           </Pressable>
         </View>
 
         {history.map((item, idx) => {
           const ts = toMillis(item.timestamp);
           const color = ['#A6FF00','#FFD54F','#4FC3F7','#CE93D8','#80CBC4','#FF8A65'][idx % 6];
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
 
 const styles = StyleSheet.create({
   safe: { flex: 1, backgroundColor: 'black' },
   scroll: { paddingHorizontal: 20, paddingTop: 24 },
   headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
   h1: { color: 'white', fontSize: 32, fontFamily: fonts.semibold, marginTop: 10, marginBottom: 10 },
   headerIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
   caption: { color: 'white', fontFamily: fonts.regular, fontSize: 12 },
   card: { backgroundColor: '#1C1C1E', borderRadius: 18, marginBottom: 16, padding: 16 },
   chartCard: { padding: 12, overflow: 'hidden' },
   cardTitle: { color: 'white', fontSize: 16, fontFamily: fonts.semibold, marginBottom: 8 },
   empty: { color: '#9E9EA0', fontFamily: fonts.regular },
   section: { color: 'white', fontSize: 20, fontFamily: fonts.semibold, marginTop: 6, marginBottom: 8 },
   rowCard: { backgroundColor: '#1C1C1E', borderRadius: 14, padding: 14, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
   dot: { width: 22, height: 22, borderRadius: 11, marginRight: 12 },
   rowStrong: { color: 'white', fontSize: 16, fontFamily: fonts.semibold },
   rowSub: { color: '#9E9EA0', fontSize: 12, fontFamily: fonts.regular },
 });

