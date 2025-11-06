import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { limitToLast, onValue, orderByChild, query, ref, update } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, ActivityIndicator, Image, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Polyline, Rect, Circle as SvgCircle, Line as SvgLine, Text as SvgText } from 'react-native-svg';
import * as Location from 'expo-location';


import { auth, db } from '../../firebaseConfig';
import { fonts } from '../../constants/fonts';

type Lectura = { id: string; pulso: number; oxigeno: number; distancia: number; timestamp: any };
type FieldPoint = { x: number; y: number };
type RoutePoint = { latitude: number; longitude: number };

function toMillis(ts: any) {
  if (typeof ts === 'number') return ts > 1e12 ? ts : ts * 1000;
  const n = Number(ts);
  if (!Number.isNaN(n)) return n > 1e12 ? n : n * 1000;
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

export default function Home() {
  const insets = useSafeAreaInsets();
  const [lecturas, setLecturas] = useState<Lectura[]>([]);
  const [dayOffset, setDayOffset] = useState(0);
  const [profileIcon, setProfileIcon] = useState<{ name?: keyof typeof Ionicons.glyphMap; color?: string }>({});

  const [tracking, setTracking] = useState(false);
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [bmiModalVisible, setBmiModalVisible] = useState(false);
  const [bmiForm, setBmiForm] = useState({ weight: '', height: '', age: '', sex: '' });
  const [savingBmi, setSavingBmi] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const locationSubRef = useRef<{ remove: () => void } | null>(null);
  const parsedWeight = parseFloat(bmiForm.weight.replace(',', '.')) || 0;
  const rawHeight = parseFloat(bmiForm.height.replace(',', '.')) || 0;
  const heightMeters = rawHeight > 5 ? rawHeight / 100 : rawHeight;
  const computedBmi = heightMeters > 0 ? parsedWeight / (heightMeters * heightMeters) : 0;
  const bmiDisplay = computedBmi > 0 ? computedBmi.toFixed(1) : '--';
  const bmiSexDisplay = (bmiForm.sex || '').toUpperCase();
  const bmiStatusLabel = getBmiStatus(computedBmi);
  const bmiStatusColor = getBmiStatusColor(computedBmi);
  const handleBmiChange = (field: keyof typeof bmiForm) => (value: string) =>
    setBmiForm((prev) => ({ ...prev, [field]: value }));
  const handleSaveBmi = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert('Sesion expirada', 'Inicia sesion nuevamente para guardar tus datos.');
      return;
    }
    const payload = {
      age: bmiForm.age.trim(),
      weight: bmiForm.weight.trim().replace(',', '.'),
      height: bmiForm.height.trim().replace(',', '.'),
      sex: bmiForm.sex.trim().toUpperCase(),
    };
    payload.sex = payload.sex ? payload.sex[0] : '';
    const weightNumber = parseFloat(payload.weight);
    const weightStored =
      Number.isFinite(weightNumber) && weightNumber > 0 ? Number(weightNumber.toFixed(1)) : null;
    const heightNumber = parseFloat(payload.height);
    const normalizedHeight = Number.isFinite(heightNumber)
      ? heightNumber > 5
        ? heightNumber / 100
        : heightNumber
      : NaN;
    const heightStored =
      Number.isFinite(normalizedHeight) && normalizedHeight > 0
        ? Number(normalizedHeight.toFixed(2))
        : null;
    const ageNumber = parseInt(payload.age, 10);
    const ageStored = Number.isFinite(ageNumber) && ageNumber > 0 ? ageNumber : null;
    const sexStored = payload.sex ? payload.sex[0] : '';
    try {
      setSavingBmi(true);
      await update(ref(db, `users/${currentUser.uid}/metrics`), {
        age: ageStored,
        weight: weightStored,
        height: heightStored,
        sex: sexStored || null,
      });
      setBmiForm({
        age: ageStored ? String(ageStored) : '',
        weight: weightStored !== null ? weightStored.toFixed(1) : '',
        height: heightStored !== null ? heightStored.toFixed(2) : '',
        sex: sexStored,
      });
      setBmiModalVisible(false);
      Alert.alert('Guardado', 'Tus datos fisicos se han actualizado.');
    } catch (error) {
      console.error('update metrics', error);
      Alert.alert('Error', 'No pudimos guardar tus datos. Intenta nuevamente.');
    } finally {
      setSavingBmi(false);
    }
  };

  useEffect(() => {
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

  useEffect(() => {
    let detachIcon: undefined | (() => void);
    let detachMetrics: undefined | (() => void);
    const off = onAuthStateChanged(auth, (user) => {
      if (detachIcon) { detachIcon(); detachIcon = undefined; }
      if (detachMetrics) { detachMetrics(); detachMetrics = undefined; }
      if (!user) {
        setProfileIcon({});
        setBmiForm({ weight: '', height: '', age: '', sex: '' });
        return;
      }
      const iconRef = ref(db, `users/${user.uid}/profileIcon`);
      detachIcon = onValue(iconRef, (snapshot) => {
        const data = snapshot.val();
        if (data) setProfileIcon({ name: data.name, color: data.color });
      });
      const metricsRef = ref(db, `users/${user.uid}/metrics`);
      detachMetrics = onValue(metricsRef, (snapshot) => {
        const data = snapshot.val();
        if (!data) {
          return;
        }
        const weightVal = parseFloat(String(data.weight ?? '').replace(',', '.'));
        const heightVal = parseFloat(String(data.height ?? '').replace(',', '.'));
        const normalizedHeight = Number.isFinite(heightVal) ? (heightVal > 5 ? heightVal / 100 : heightVal) : NaN;
        setBmiForm({
          weight: Number.isFinite(weightVal) && weightVal > 0 ? weightVal.toFixed(1) : '',
          height: Number.isFinite(normalizedHeight) && normalizedHeight > 0 ? normalizedHeight.toFixed(2) : '',
          age: data.age !== undefined && data.age !== null && String(data.age).trim() ? String(data.age).trim() : '',
          sex: data.sex !== undefined && data.sex !== null ? String(data.sex).trim().toUpperCase() : '',
        });
      });
    });
    return () => {
      off();
      if (detachIcon) detachIcon();
      if (detachMetrics) detachMetrics();
    };
  }, []);

  useEffect(() => () => stopTracking(), []);

  const latest = lecturas[0];
  const lastMs = latest ? toMillis(latest.timestamp) : 0;
  const connected = lastMs > 0 && Date.now() - lastMs < 2 * 60 * 1000;

  function startOfDay(d: Date) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function endOfDay(d: Date) { const s = startOfDay(d); return new Date(s.getTime() + 24 * 60 * 60 * 1000 - 1); }
  const selectedDate = addDays(new Date(), -dayOffset);
  const dayStart = startOfDay(selectedDate).getTime();
  const dayEnd = endOfDay(selectedDate).getTime();
  const lecturasDiaAsc = useMemo(() => {
    const sameDay = lecturas.filter((l) => {
      const ms = toMillis(l.timestamp);
      return ms >= dayStart && ms <= dayEnd;
    });
    return sameDay.sort((a, b) => toMillis(a.timestamp) - toMillis(b.timestamp));
  }, [lecturas, dayStart, dayEnd]);

  function inferDistanceKm(reads: Lectura[]) {
    if (reads.length === 0) return { total: 0, deltas: [] as number[], cumulative: false };
    let nonDecreasing = 0;
    for (let i = 1; i < reads.length; i++) {
      if ((reads[i].distancia ?? 0) >= (reads[i - 1].distancia ?? 0)) nonDecreasing++;
    }
    const ratio = reads.length > 1 ? nonDecreasing / (reads.length - 1) : 0;
    const cumulative = ratio >= 0.6;
    if (cumulative) {
      const deltas: number[] = [];
      let sum = 0;
      for (let i = 1; i < reads.length; i++) {
        const prev = reads[i - 1].distancia ?? 0;
        const cur = reads[i].distancia ?? 0;
        const d = Math.max(0, cur - prev);
        deltas.push(d);
        sum += d;
      }
      return { total: sum, deltas, cumulative: true };
    }
    const values = reads.map((r) => r.distancia ?? 0);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = reads.length ? sum / reads.length : 0;
    const deltas: number[] = [];
    for (let i = 1; i < reads.length; i++) {
      deltas.push(avg);
    }
    return { total: sum, deltas, cumulative: false };
  }

  const routeDistanceKm = useMemo(() => {
    if (routePoints.length < 2) return 0;
    let total = 0;
    for (let i = 1; i < routePoints.length; i++) {
      total += haversine(routePoints[i - 1], routePoints[i]);
    }
    return total;
  }, [routePoints]);
  const hasRouteData = routePoints.length > 0 || elapsed > 0;


  const { total: kmDia, deltas: distDeltas } = inferDistanceKm(lecturasDiaAsc);
  const bpmThreshold = 100;
  let distWalk = 0;
  let distRun = 0;
  const segmentSpeeds: number[] = [];
  for (let i = 0; i < distDeltas.length; i++) {
    const distance = distDeltas[i] ?? 0;
    const prev = lecturasDiaAsc[i];
    const next = lecturasDiaAsc[i + 1] ?? prev;
    const bpmVal = next?.pulso ?? prev?.pulso ?? 0;
    if (bpmVal > bpmThreshold) distRun += distance;
    else distWalk += distance;

    if (prev && next) {
      const deltaHours = Math.max(0, (toMillis(next.timestamp) - toMillis(prev.timestamp)) / 3600000);
      if (deltaHours > 0 && distance >= 0) {
        const speed = distance / deltaHours;
        if (Number.isFinite(speed) && speed >= 0) segmentSpeeds.push(speed);
      }
    }
  }
  const totalSegmentDistance = distWalk + distRun;
  const kcalDia = kmDia * 65;
  const avgDistance = distDeltas.length ? distDeltas.reduce((a, b) => a + b, 0) / distDeltas.length : 0;
  const avgSpeed = segmentSpeeds.length ? segmentSpeeds.reduce((a, b) => a + b, 0) / segmentSpeeds.length : 0;
  const currentRouteSpeed = elapsed > 0 && routeDistanceKm > 0 ? routeDistanceKm / (elapsed / 3600) : 0;
  const speedMetric = currentRouteSpeed || avgSpeed;


  const statItems = [
    { c: '#7F1D1D', t: 'Movimiento', v: kmDia ? `${Math.round(kcalDia)} KCAL/DIA` : '--', vc: '#FF4D4D' },
    { c: '#5B21B6', t: 'Distancia promedio', v: avgDistance ? `${avgDistance.toFixed(2)} KM` : '--', vc: '#C084FC' },
    {
      c: '#14532D',
      t: 'Actividad',
      v: totalSegmentDistance ? `${totalSegmentDistance.toFixed(2)} KM` : '--',
      vc: '#22C55E',
    },
    {
      c: '#7C2D12',
      t: 'Correr',
      v: distRun ? `${distRun.toFixed(2)} KM` : '--',
      vc: '#FF7849',
    },
    { c: '#FF9F0A', t: 'Rapidez', v: speedMetric ? `${speedMetric.toFixed(2)} KM/H` : '--', vc: '#FF9F0A' },
  ];  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const startTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED) {
        Alert.alert('Permiso requerido', 'Necesitamos acceso a tu ubicacion para registrar la ruta.');
        return;
      }

      setRoutePoints([]);
      setElapsed(0);
      setTracking(true);

      timerRef.current = setInterval(() => setElapsed((prev) => prev + 1), 1000);

      locationSubRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 3000,
          distanceInterval: 5,
        },
        (location) => {
          setRoutePoints((prev) => [...prev, {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          }]);
        }
      );
    } catch (error) {
      console.error('startTracking', error);
      Alert.alert('Error', 'No se pudo iniciar el seguimiento de ruta.');
      stopTracking();
    }
  };

  const stopTracking = () => {
    setTracking(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (locationSubRef.current) {
      locationSubRef.current.remove();
      locationSubRef.current = null;
    }
  };

  const toggleTracking = () => {
    if (tracking) stopTracking();
    else startTracking();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: 24 + insets.bottom }]}>
        <View style={styles.headerRow}>
          <Text style={styles.h1}>Inicio</Text>
          <View style={[styles.headerIcon, { backgroundColor: profileIcon.color || '#2B2B2E' }]}>
            <Ionicons name={profileIcon.name || 'person'} size={18} color="#111" />
          </View>
        </View>

        <View style={[styles.cardSmall, { padding: 0, overflow: 'hidden' }]}>
          <Image source={require('../../assets/elements/prom.gif')} style={styles.demoImage} resizeMode="cover" />
        </View>

        <View style={styles.cardLarge}>
          <Pressable style={styles.cardHeader} onPress={() => setBmiModalVisible(true)}>
            <Text style={[styles.cardTitle, { marginBottom: 0 }]}>IMC y datos basicos</Text>
            <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
          </Pressable>

          <View style={styles.bmiRow}>
            <View style={styles.bmiItem}>
              <Text style={styles.bmiValue}>{bmiDisplay}</Text>
              <Text style={styles.bmiLabel}>IMC</Text>
            </View>
            <View style={styles.bmiItem}>
              <Text style={styles.bmiValue}>{bmiForm.age || '--'}</Text>
              <Text style={styles.bmiLabel}>Edad</Text>
            </View>
            <View style={styles.bmiItem}>
              <Text style={styles.bmiValue}>{parsedWeight ? `${parsedWeight.toFixed(1)} kg` : '--'}</Text>
              <Text style={styles.bmiLabel}>Peso</Text>
            </View>
            <View style={styles.bmiItem}>
              <Text style={styles.bmiValue}>{heightMeters > 0 ? `${heightMeters.toFixed(2)} m` : '--'}</Text>
              <Text style={styles.bmiLabel}>Altura</Text>
            </View>
            <View style={styles.bmiItem}>
              <Text style={styles.bmiValue}>{bmiSexDisplay || '--'}</Text>
              <Text style={styles.bmiLabel}>Sexo</Text>
            </View>
            <View style={[styles.bmiItem, styles.bmiStatusItem]}>
              <Text style={styles.bmiLabel}>Estado</Text>
              <Text style={[styles.bmiStatusValue, { color: bmiStatusColor }]}>{bmiStatusLabel}</Text>
            </View>
          </View>

        </View>

        <View style={[styles.cardLarge, { padding: 12 }]}>
          <Text style={styles.cardTitle}>Mapa de rutas</Text>
          <View style={styles.pitchWrap}>
            <RouteMap points={routePoints} />
          </View>
          {routePoints.length === 0 ? (
            <Text style={[styles.rowSub, { marginTop: 8 }]}>
              Activa "Iniciar ruta" para comenzar a registrar tu recorrido.
            </Text>
          ) : null}
        </View>

        <View style={styles.cardLarge}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={styles.cardTitle}>Ruta en curso</Text>
              <Text style={styles.rowSub}>Tiempo: {formatTime(elapsed)}</Text>
            </View>
            <Pressable
              onPress={toggleTracking}
              style={({ pressed }) => [
                styles.routeButton,
                { backgroundColor: tracking ? '#FF5757' : '#A6FF00', opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Text style={[styles.routeButtonText, { color: tracking ? '#FFF' : '#111' }]}>
                {tracking ? 'Detener ruta' : 'Iniciar ruta'}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.cardLarge}>
            <Text style={styles.cardTitle}>Lectura reciente</Text>
          {hasRouteData ? (
            <View style={{ backgroundColor: '#111214', borderRadius: 12, padding: 12 }}>
              <Text style={[styles.caption, { marginBottom: 4 }]}>Fecha</Text>
              <Text style={styles.rowStrong}>{formatDate(new Date())}</Text>
              <Text style={[styles.caption, { marginBottom: 4, marginTop: 8 }]}>Distancia</Text>
              <Text style={styles.rowStrong}>{routeDistanceKm.toFixed(2)} km</Text>
              <Text style={[styles.caption, { marginBottom: 4, marginTop: 8 }]}>Tiempo</Text>
              <Text style={styles.rowStrong}>{formatTime(elapsed)}</Text>
            </View>
          ) : latest ? (
            <View style={{ backgroundColor: '#111214', borderRadius: 12, padding: 12 }}>
              <Text style={[styles.caption, { marginBottom: 4 }]}>Fecha</Text>
              <Text style={styles.rowStrong}>{formatDate(new Date(lastMs))}</Text>
              <Text style={[styles.caption, { marginBottom: 4, marginTop: 8 }]}>Distancia</Text>
              <Text style={styles.rowStrong}>{latest.distancia} km</Text>
              <Text style={[styles.caption, { marginBottom: 4, marginTop: 8 }]}>Tiempo</Text>
              <Text style={styles.rowStrong}>--</Text>
            </View>
          ) : (
            <Text style={styles.empty}>Aun no hay lecturas</Text>
          )}
        </View>

        <View style={styles.switcher}>
          <Ionicons name="chevron-back" size={20} color="#FFFFFF" onPress={() => setDayOffset((n) => Math.min(6, n + 1))} />
          <Text style={styles.switcherTitle}>{formatDay(addDays(new Date(), -dayOffset))}</Text>
          <Ionicons name="chevron-forward" size={20} color="#FFFFFF" onPress={() => setDayOffset((n) => Math.max(0, n - 1))} />
        </View>
        

        {statItems.map((s, i) => (
          <View key={i} style={[styles.cardLarge, { flexDirection: 'row', alignItems: 'center', padding: 12 }]}>
            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: s.c, marginRight: 12 }} />
            <View>
              <Text style={styles.statTitle}>{s.t}</Text>
              <Text style={[styles.statValue, { color: s.vc }]}>{s.v}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal
        visible={bmiModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setBmiModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar datos fisicos</Text>
              <Pressable hitSlop={12} onPress={() => setBmiModalVisible(false)}>
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={styles.modalContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.bmiEditorRow}>
                <Text style={styles.bmiEditorLabel}>Edad</Text>
                <TextInput
                  value={bmiForm.age}
                  onChangeText={handleBmiChange('age')}
                  keyboardType="number-pad"
                  placeholder="Ej. 29"
                  placeholderTextColor="#6B6B70"
                  style={styles.bmiInput}
                />
              </View>
              <View style={styles.bmiEditorRow}>
                <Text style={styles.bmiEditorLabel}>Peso (kg)</Text>
                <TextInput
                  value={bmiForm.weight}
                  onChangeText={handleBmiChange('weight')}
                  keyboardType="decimal-pad"
                  placeholder="Ej. 78"
                  placeholderTextColor="#6B6B70"
                  style={styles.bmiInput}
                />
              </View>
              <View style={styles.bmiEditorRow}>
                <Text style={styles.bmiEditorLabel}>Altura (m)</Text>
                <TextInput
                  value={bmiForm.height}
                  onChangeText={handleBmiChange('height')}
                  keyboardType="decimal-pad"
                  placeholder="Ej. 1.75"
                  placeholderTextColor="#6B6B70"
                  style={styles.bmiInput}
                />
              </View>
              <View style={[styles.bmiEditorRow, { marginBottom: 0 }]}>
                <Text style={styles.bmiEditorLabel}>Sexo</Text>
                <TextInput
                  value={bmiForm.sex}
                  onChangeText={(text) => handleBmiChange('sex')(text.slice(0, 1).toUpperCase())}
                  placeholder="M/F"
                  placeholderTextColor="#6B6B70"
                  maxLength={1}
                  autoCapitalize="characters"
                  style={styles.bmiInput}
                />
              </View>
            </ScrollView>

            <Pressable
              disabled={savingBmi}
              onPress={handleSaveBmi}
              style={({ pressed }) => [
                styles.bmiSave,
                { opacity: pressed || savingBmi ? 0.8 : 1 },
              ]}
            >
              {savingBmi ? <ActivityIndicator color="#111" /> : <Text style={styles.bmiSaveText}>Guardar</Text>}
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SoccerField({ points = [] as FieldPoint[] }) {
  const WIDTH = 160;
  const HEIGHT = 100;
  const toPolyline = (items: FieldPoint[]) =>
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

type RouteMapProps = { points: RoutePoint[] };

function RouteMap({ points }: RouteMapProps) {
  if (points.length < 2) {
    return (
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={styles.rowSub}>Aun no hay puntos registrados</Text>
      </View>
    );
  }

  const lats = points.map((p) => p.latitude);
  const lons = points.map((p) => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const latRange = Math.max(maxLat - minLat, 0.00005);
  const lonRange = Math.max(maxLon - minLon, 0.00005);

  const normalized = points.map((p) => ({
    x: 0.1 + 0.8 * ((p.longitude - minLon) / lonRange),
    y: 0.1 + 0.8 * (1 - (p.latitude - minLat) / latRange),
  }));

  return <SoccerField points={normalized} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'black' },
  scroll: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  h1: { color: 'white', fontSize: 32, fontFamily: fonts.semibold, marginTop: 10, marginBottom: 10 },
  headerIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2B2B2E' },
  caption: { color: 'white', opacity: 0.7, fontSize: 12, fontFamily: fonts.regular },
  status: { fontSize: 16, fontFamily: fonts.semibold },
  link: { color: 'white', opacity: 0.9, fontSize: 12, fontFamily: fonts.regular },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  cardSmall: { backgroundColor: '#1C1C1E', borderRadius: 18, padding: 16, marginBottom: 16 },
  cardLarge: { backgroundColor: '#1C1C1E', borderRadius: 18, padding: 16, marginBottom: 16 },
  chartCard: { overflow: 'hidden' },
  heartCard: { alignItems: 'center', justifyContent: 'center', height: 200 },
  cardTitle: { color: 'white', fontSize: 16, fontFamily: fonts.semibold, marginBottom: 8 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  empty: { color: '#9E9EA0', fontFamily: fonts.regular },
  demoImage: {
    width: '100%',
    height: 210,
  },
  bpmText: { fontSize: 28, fontFamily: fonts.semibold },
  section: { color: 'white', fontSize: 20, fontFamily: fonts.semibold, marginTop: 6, marginBottom: 8 },
  row: { color: 'white', fontFamily: fonts.regular },
  rowCard: { backgroundColor: '#1C1C1E', borderRadius: 14, padding: 14, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  dot: { width: 22, height: 22, borderRadius: 11 },
  rowStrong: { color: 'white', fontSize: 16, fontFamily: fonts.semibold },
  rowSub: { color: '#9E9EA0', fontSize: 12, fontFamily: fonts.regular },
  rowRight: { color: 'white', fontSize: 12, fontFamily: fonts.regular },
  statTitle: { color: 'white', fontFamily: fonts.semibold },
  statValue: { fontFamily: fonts.semibold },
  pitchWrap: { aspectRatio: 16 / 10, borderRadius: 16, overflow: 'hidden' },
  switcher: { backgroundColor: '#1C1C1E', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  switcherTitle: { color: 'white', fontFamily: fonts.semibold, fontSize: 16 },
  boldText: { fontWeight: 'bold' },
  bmiRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 12 },
  bmiItem: { width: '47%', marginBottom: 12, padding: 12, borderRadius: 12, backgroundColor: '#111214' },
  bmiValue: { color: '#A6FF00', fontSize: 18, fontFamily: fonts.semibold },
  bmiLabel: { color: '#9E9EA0', fontSize: 12, fontFamily: fonts.regular },
  bmiStatusItem: { width: '47%' },
  bmiStatusValue: { color: 'white', fontSize: 16, fontFamily: fonts.semibold },
  bmiEditorRow: { marginBottom: 12 },
  bmiEditorLabel: { color: '#9E9EA0', fontSize: 12, fontFamily: fonts.regular, marginBottom: 6 },
  bmiInput: {
    borderWidth: 1,
    borderColor: '#2F2F33',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: 'white',
    fontFamily: fonts.regular,
    backgroundColor: '#1A1A1D',
  },
  bmiSave: {
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#A6FF00',
  },
  bmiSaveText: { color: '#111', fontFamily: fonts.semibold },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: { color: 'white', fontSize: 18, fontFamily: fonts.semibold },
  modalContent: { paddingBottom: 16 },
  routeButton: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 18 },
  routeButtonText: { fontFamily: fonts.semibold, fontSize: 15 },
});
function getBmiStatus(value: number) {
  if (!Number.isFinite(value) || value <= 0) return 'Sin datos';
  if (value < 18.5) return 'Bajo peso';
  if (value < 25) return 'Saludable';
  if (value < 30) return 'Sobrepeso';
  return 'Obesidad';
}

function getBmiStatusColor(value: number) {
  if (!Number.isFinite(value) || value <= 0) return '#9E9EA0';
  if (value < 18.5) return '#7AD7FF';
  if (value < 25) return '#A6FF00';
  if (value < 30) return '#FFD166';
  return '#FF6B6B';
}

function addDays(d: Date, days: number) { const x = new Date(d); x.setDate(x.getDate() + days); return x; }

function formatDay(d: Date) {
  const days = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${days[d.getDay()]} ${day}/${month}/${year}`;
}

function formatDate(d: Date) {
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function haversine(a: RoutePoint, b: RoutePoint) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}