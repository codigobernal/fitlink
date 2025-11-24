import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../firebaseConfig.js';

import { limitToLast, onValue, orderByChild, push, query, ref, update } from 'firebase/database';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Image, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Polyline, Rect, Circle as SvgCircle, Line as SvgLine, Text as SvgText } from 'react-native-svg';

import { fonts } from '../../constants/fonts';

// --- CONSTANTES GLOBALES ---
const R_EARTH = 6371; // Radio de la Tierra en km
const ACTIVITY_FACTOR = 1.375; // Factor de actividad ligera

// --- TIPOS DE DATOS ---
type Lectura = { id: string; pulso: number; oxigeno: number; distancia: number; timestamp: any };
type SessionSummary = {
    id: string;
    distanciaFinal: number;
    tiempoFinal: number;
    pulsoPromedio: number;
    oxigenoPromedio: number;
    esfuerzoFinal: number;
    pasosTotales: number;
    caloriasFinales: number;
    velocidadFinal: number;
    timestamp: number;
    routePointsRaw: string | null; 
};
type FieldPoint = { x: number; y: number };
type RoutePoint = { latitude: number; longitude: number };
type ProfileIcon = { name?: keyof typeof Ionicons.glyphMap; color?: string };
type BmiForm = { weight: string; height: string; age: string; sex: string };

// --- FUNCIONES AUXILIARES GENERALES ---

/** Convierte el timestamp a milisegundos. */
function toMillis(ts: any): number {
  if (typeof ts === 'number') return ts > 1e12 ? ts : ts * 1000;
  const n = Number(ts);
  if (!Number.isNaN(n)) return n > 1e12 ? n : n * 1000;
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

/** Devuelve la distancia en km entre dos puntos usando la fórmula de Haversine. */
function haversine(a: RoutePoint, b: RoutePoint): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R_EARTH * c;
}

/** Devuelve el inicio del día para una fecha dada. */
function startOfDay(d: Date): Date { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }

/** Devuelve el final del día para una fecha dada. */
function endOfDay(d: Date): Date { const s = startOfDay(d); return new Date(s.getTime() + 24 * 60 * 60 * 1000 - 1); }

/** Añade o resta días a una fecha. */
function addDays(d: Date, days: number): Date { const x = new Date(d); x.setDate(x.getDate() + days); return x; }

/** Formatea segundos a MM:SS. */
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
};

/** Formatea una fecha para el selector de día (ej. Lun 07/11/2025). */
function formatDay(d: Date): string {
  const days = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${days[d.getDay()]} ${day}/${month}/${year}`;
}

/** Formatea una fecha para la última sesión (ej. 07/11/2025, 7:15 PM). */
function formatDate(d: Date): string {
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();

  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; 

  return `${day}/${month}/${year}, ${hours}:${minutes} ${ampm}`;
}

// --- LÓGICA DE CÁLCULO (Métricas) ---

function calculateSteps(distanceKm: number, heightMeters: number, sex: string): number {
  if (distanceKm <= 0 || heightMeters <= 0 || !['M', 'F'].includes(sex)) return 0;
  const stepLength = sex === 'M' ? heightMeters * 0.413 : heightMeters * 0.415; 
  return Math.round((distanceKm * 1000) / stepLength);
}

function calculateCalories(age: number, weight: number, heightMeters: number, sex: string, distanceKm: number): number {
  if (age <= 0 || weight <= 0 || heightMeters <= 0 || !['M', 'F'].includes(sex) || distanceKm <= 0) return 0;
  
  const heightCm = heightMeters * 100;
  let tmb = sex === 'M' 
    ? 88.362 + (13.397 * weight) + (4.799 * heightCm) - (5.677 * age)
    : 447.593 + (9.247 * weight) + (3.098 * heightCm) - (4.330 * age);

  const caloriesPerKm = (tmb * ACTIVITY_FACTOR) / 25; 
  return Math.round(caloriesPerKm * distanceKm);
}

function calculateEffort(age: number, weight: number, heightMeters: number, sex: string, distanceKm: number, timeSeconds: number): number {
  if (distanceKm <= 0 || timeSeconds <= 0) return 0;
  
  const actualCalories = calculateCalories(age, weight, heightMeters, sex, distanceKm);
  const maxCalPerMin = 0.15 * weight; 
  const maxCaloriesTheoric = maxCalPerMin * (timeSeconds / 60);

  let effortPercent = maxCaloriesTheoric > 0 ? (actualCalories / maxCaloriesTheoric) * 100 : 0;

  if (effortPercent > 100) effortPercent = 100;
  if (effortPercent < 0) effortPercent = 0;

  return Math.round(effortPercent);
}

// --- LÓGICA DE ESTADO Y COLOR ---

function getBmiStatus(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return 'Sin datos';
  if (value < 18.5) return 'Bajo peso';
  if (value < 25) return 'Saludable';
  if (value < 30) return 'Sobrepeso';
  return 'Obesidad';
}

function getBmiStatusColor(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '#9E9EA0';
  if (value < 18.5) return '#7AD7FF';
  if (value < 25) return '#A6FF00';
  if (value < 30) return '#FFD166';
  return '#FF6B6B';
}

function getEffortStatus(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return 'Reposo';
  if (value < 20 ) return 'Muy ligero';
  if (value < 50) return 'Ligero';
  if (value < 75) return 'Moderado';
  if (value < 90) return 'Vigoroso';
  return 'Máximo';
}

function getEffortStatusColor(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '#9E9EA0';
  if (value < 20 ) return '#7AD7FF';
  if (value < 50) return '#A6FF00';
  if (value < 75) return '#FFD166';
  if (value < 90) return '#FF6B6B';
  return '#9C0000';
}

// --- COMPONENTE PRINCIPAL HOME ---
export default function Home() {
  const insets = useSafeAreaInsets();

  // --- VARIABLES DE ESTADO ---
  const [lecturas, setLecturas] = useState<Lectura[]>([]); // Lecturas individuales del sensor (solo el último para BPM)
  const [sessionSummaries, setSessionSummaries] = useState<SessionSummary[]>([]); // Historial de sesiones guardadas
  const [dayOffset, setDayOffset] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('');


  const [profileIcon, setProfileIcon] = useState<ProfileIcon>({});
  
  const [tracking, setTracking] = useState(false);
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [elapsed, setElapsed] = useState(0); // Tiempo de actividad en segundos
  const [routeStartTime, setRouteStartTime] = useState<number>(0); 
  
  // Datos temporales de la sesión activa para promediar al finalizar
  const activePulsesRef = useRef<number[]>([]);
  const activeOxygenRef = useRef<number[]>([]);

  const [bmiModalVisible, setBmiModalVisible] = useState(false);
  const [bmiForm, setBmiForm] = useState<BmiForm>({ weight: '', height: '', age: '', sex: '' });
  
  // --- REFES ---
  const [savingBmi, setSavingBmi] = useState(false);

  // --- REFES ---
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const locationSubRef = useRef<Location.LocationSubscription | null>(null);
  const heartScale = useRef(new Animated.Value(1)).current;

  // NUEVAS REFERENCIAS PARA ACCEDER A VALORES ACTUALES SIN USAR DEPENDENCIAS
  const latestMetricsRef = useRef({
      distance: 0,
      time: 0,
      speed: 0,
      steps: 0,
      effort: 0,
      calories: 0,
      route: [] as RoutePoint[],
      pulses: [] as number[],
      oxygen: [] as number[],
  });

  // --- CÁLCULOS MEMORIZADOS/DERIVADOS (Métricas Personales) ---

  const parsedWeight = parseFloat(bmiForm.weight.replace(',', '.')) || 0;
  const rawHeight = parseFloat(bmiForm.height.replace(',', '.')) || 0;
  const heightMeters = rawHeight > 5 ? rawHeight / 100 : rawHeight; 
  const parsedAge = parseInt(bmiForm.age, 10) || 0;
  const bmiSex = bmiForm.sex.trim().toUpperCase() === 'M' ? 'M' : bmiForm.sex.trim().toUpperCase() === 'F' ? 'F' : '';

  const computedBmi = heightMeters > 0 ? parsedWeight / (heightMeters * heightMeters) : 0;
  const bmiDisplay = computedBmi > 0 ? computedBmi.toFixed(1) : '--';
  const bmiStatusLabel = getBmiStatus(computedBmi);
  const bmiStatusColor = getBmiStatusColor(computedBmi);

  const routeDistanceKm = useMemo(() => {
  if (routePoints.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 0; i < routePoints.length - 1; i++) {
    const a = routePoints[i];
    const b = routePoints[i + 1];
    if (!a || !b) continue;
    if (!Number.isFinite(a.latitude) || !Number.isFinite(a.longitude)) continue;
    if (!Number.isFinite(b.latitude) || !Number.isFinite(b.longitude)) continue;
    totalDistance += haversine(a, b);
  }
  return totalDistance;
}, [routePoints]);


  const currentRouteSpeed = useMemo(() => {
    return elapsed > 0 && routeDistanceKm > 0 ? routeDistanceKm / (elapsed / 3600) : 0;
  }, [elapsed, routeDistanceKm]);


  // Pasos y Calorías se calculan en tiempo real para la sesión actual
  const steps = useMemo(() => calculateSteps(routeDistanceKm, heightMeters, bmiSex), [routeDistanceKm, heightMeters, bmiSex]);
  const calories = useMemo(() => calculateCalories(parsedAge, parsedWeight, heightMeters, bmiSex, routeDistanceKm), [parsedAge, parsedWeight, heightMeters, bmiSex, routeDistanceKm]);
  const computedEffort = useMemo(() => calculateEffort(parsedAge, parsedWeight, heightMeters, bmiSex, routeDistanceKm, elapsed), [parsedAge, parsedWeight, heightMeters, bmiSex, routeDistanceKm, elapsed]);

  //const effortStatusLabel = getEffortStatus(computedEffort);
  //const effortStatusColor = getEffortStatusColor(computedEffort);
  
  // Datos de la última lectura del sensor (para BPM en tiempo real)
  const latest = lecturas[0];
  const bpm = latest?.pulso ?? 60;
  const lastMs = latest ? toMillis(latest.timestamp) : 0;

  // NUEVO: Obtener la ÚLTIMA sesión guardada
  const lastSavedSession = useMemo(() => {
      // Si NO estamos haciendo tracking, usamos la sesión más reciente del historial
      if (!tracking && sessionSummaries.length > 0) {
          return sessionSummaries[0];
      }
      return null;
  }, [tracking, sessionSummaries]);

  // NUEVO: Datos a mostrar en el mapa/tarjetas de ruta cuando NO estamos en tracking
  // --- Datos a mostrar en el mapa/tarjetas de ruta cuando NO estamos en tracking
const displayData = tracking
  ? {
      distance: routeDistanceKm,
      time: elapsed,
      speed: currentRouteSpeed,
      pulses: activePulsesRef.current,
      effort: computedEffort,
      lastMs: lastMs,
    }
  : {
      distance: lastSavedSession?.distanciaFinal || 0,
      time: lastSavedSession?.tiempoFinal || 0,
      speed: lastSavedSession?.velocidadFinal || 0,
      pulses: [],
      effort: lastSavedSession?.esfuerzoFinal || computedEffort,
      lastMs: lastSavedSession?.timestamp ? toMillis(lastSavedSession.timestamp) : lastMs,
    };

     const displayRoutePoints: RoutePoint[] = useMemo(() => {
      // Si estamos en tracking, mostramos la ruta en vivo
      if (tracking) {
          return routePoints;
      }
      // Si el tracking está inactivo y tenemos una sesión guardada con datos de ruta
      if (lastSavedSession && lastSavedSession.routePointsRaw) {
          try {
              // Parseamos la cadena JSON guardada
              const parsedRoute = JSON.parse(lastSavedSession.routePointsRaw);
              if (Array.isArray(parsedRoute)) {
                  return parsedRoute as RoutePoint[];
              }
          } catch (e) {
              console.error("Error parsing saved route points:", e);
          }
      }
      return [];
  }, [tracking, routePoints, lastSavedSession]); // Dependencia en lastSavedSession


  // La fecha mostrada en el mapa debe ser de la última sesión guardada O la última lectura.
  const displayLastMs = useMemo(() => {
        if (tracking) {
            // Si estamos activos, mostramos el tiempo de inicio de la ruta.
            return routeStartTime || Date.now(); 
        }
        // Si no estamos activos, mostramos la última sesión guardada o la hora actual (fallback).
        if (lastSavedSession) {
            return toMillis(lastSavedSession.timestamp);
        }
        return lastMs > 100000 ? lastMs : Date.now(); 
    }, [tracking, routeStartTime, lastSavedSession, lastMs]);
    
  const displayBPM = latest?.pulso ?? 60; // Siempre mostramos el pulso en vivo.

  // Lecturas del día seleccionado (usa summaries guardados)
  const selectedDate = addDays(new Date(), -dayOffset);
  const dayStart = startOfDay(selectedDate).getTime();
  const dayEnd = endOfDay(selectedDate).getTime();
  
  const sessionsDia = useMemo(() => {
    return sessionSummaries.filter(s => {
      const ms = toMillis(s.timestamp);
      return ms >= dayStart && ms <= dayEnd;
    });
  }, [sessionSummaries, dayStart, dayEnd]);


  // --- CÁLCULOS DE RESUMEN DIARIO (USANDO SESIONES GUARDADAS) ---
  const dailySummary = useMemo(() => {
    if (sessionsDia.length === 0) {
        return {
            totalCalories: 0,
            totalDistance: 0,
            totalSteps: 0,
            totalTime: 0,
            avgSpeed: 0,
        };
    }

    const totalDistance = sessionsDia.reduce((sum, s) => sum + s.distanciaFinal, 0);
    const totalTime = sessionsDia.reduce((sum, s) => sum + s.tiempoFinal, 0);
    const totalCalories = sessionsDia.reduce((sum, s) => sum + s.caloriasFinales, 0);
    const totalSteps = sessionsDia.reduce((sum, s) => sum + s.pasosTotales, 0);
    
    // Calculamos la rapidez promedio basado en el tiempo total y la distancia total
    const avgSpeed = totalTime > 0 ? totalDistance / (totalTime / 3600) : 0;

    return {
        totalCalories: Math.round(totalCalories),
        totalDistance: totalDistance,
        totalSteps: totalSteps,
        totalTime: totalTime,
        avgSpeed: avgSpeed,
    };
  }, [sessionsDia]);


  // --- MANEJADORES DE ESTADO Y DATOS ---

  const handleBmiChange = (field: keyof typeof bmiForm) => (value: string) =>
    setBmiForm((prev) => ({ ...prev, [field]: value }));

  const handleSaveBmi = async () => {
    // Lógica de guardado de BMI (Mantenida)
    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert('Sesión expirada', 'Inicia sesión nuevamente para guardar tus datos.');
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
      // CORRECCIÓN DE RUTA: users/${currentUser.uid}/metrics
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
      setModalTitle('Guardado');
      setModalMessage('Tus datos físicos se han actualizado.');
      setModalVisible(true);


    } catch (error) {
      console.error('update metrics', error);
      setModalMessage('No pudimos guardar tus datos. Intenta nuevamente.');
      setModalVisible(true);


    } finally {
      setSavingBmi(false);
    }
  };

  /** Guarda el resumen de la sesión de actividad física en Firebase. */
    const saveSessionData = useCallback(
    async (
      distance: number,
      time: number,
      speed: number,
      pulses: number[],
      oxygen: number[],
      stepsCount: number,
      effort: number,
      caloriesCount: number,
      route: RoutePoint[]
    ) => {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        setModalTitle('Sesión no guardada');
        setModalMessage('Debes iniciar sesión para guardar tus actividades.');
        setModalVisible(true);
        return;
      }

      if (time < 10 && distance < 0.01) {
        setModalTitle('Sesión no registrada');
        setModalMessage('La actividad fue demasiado corta para ser guardada.');
        setModalVisible(true);
        return;
      }

      const avgPulso =
        pulses.length > 0
          ? Math.round(pulses.reduce((sum, p) => sum + p, 0) / pulses.length)
          : 0;

      const avgOxygen =
        oxygen.length > 0
          ? Math.round(oxygen.reduce((sum, o) => sum + o, 0) / oxygen.length)
          : 0;

      const sessionData = {
        timestamp: Date.now(),
        distanciaFinal: Number(distance.toFixed(2)),
        tiempoFinal: time,
        velocidadFinal: Number(speed.toFixed(2)),
        pulsoPromedio: avgPulso,
        oxigenoPromedio: avgOxygen,
        pasosTotales: stepsCount,
        esfuerzoFinal: effort,
        caloriasFinales: caloriesCount,
        routePoints: route.length > 100 ? null : JSON.stringify(route), // <--- Asegurar que se guarde como JSON
      };

      try {
        const sessionRef = ref(db, `users/${currentUser.uid}/sessions`);
        await push(sessionRef, sessionData);

        setModalTitle('¡Sesión guardada!');
        setModalMessage(
          `Has completado ${distance.toFixed(2)} km en ${formatTime(time)}.`
        );
        setModalVisible(true);
      } catch (error) {
        console.error('Error al guardar sesión:', error);
        setModalTitle('Error');
        setModalMessage('No se pudo guardar la sesión de actividad.');
        setModalVisible(true);
      }
    },
    [setModalVisible, setModalMessage, setModalTitle]
  );

    const stopTracking = useCallback(async () => {
    // Obtener valores actuales del ref
    const currentData = latestMetricsRef.current;

    setTracking(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (locationSubRef.current) {
      try {
        locationSubRef.current.remove();
      } catch (err) {
        console.warn('Error removing location subscription', err);
      } finally {
        locationSubRef.current = null;
      }
    }

    // Guardar sesión si hubo actividad
    if (currentData.time > 0 || currentData.distance > 0) {
      await saveSessionData(
        currentData.distance,
        currentData.time,
        currentData.speed,
        currentData.pulses,
        currentData.oxygen,
        currentData.steps,
        currentData.effort,
        currentData.calories,
        currentData.route
      );
    }

    // Reset
    activePulsesRef.current = [];
    activeOxygenRef.current = [];
    setRoutePoints([]);
    setElapsed(0);
  }, [
    activePulsesRef,
    activeOxygenRef,
    saveSessionData,
    setTracking,
    setRoutePoints,
    setElapsed,
  ]);

  const startTracking = useCallback(
  async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== Location.PermissionStatus.GRANTED) {
        setModalTitle('Permiso requerido');
        setModalMessage('Necesitamos acceso a tu ubicación para registrar la ruta.');
        setModalVisible(true);
        return;
      }

      setRoutePoints([]);
      setElapsed(0);

      activePulsesRef.current = [];
      activeOxygenRef.current = [];

      setTracking(true);

      timerRef.current = setInterval(
        () => setElapsed((prev) => prev + 1),
        1000
      );

      locationSubRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Highest,
          distanceInterval: 1,
          timeInterval: 1000,
        },
        (location) => {
          if (!location || !location.coords) return;

          const { latitude, longitude } = location.coords;

          if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

          setRoutePoints((prev) => {
            const last = prev[prev.length - 1];

            if (last) {
              const sameLat = Math.abs(last.latitude - latitude) < 1e-6;
              const sameLon = Math.abs(last.longitude - longitude) < 1e-6;

              if (sameLat && sameLon) return prev;
            }

            return [...prev, { latitude, longitude }];
          });
        }
      );
    } catch (error) {
      console.error('startTracking', error);

      setModalTitle('Error');
      setModalMessage('No se pudo iniciar el seguimiento de ruta.');
      setModalVisible(true);

      stopTracking();
    }
  },
  [stopTracking, setRoutePoints, setElapsed, setTracking]
);

    const toggleTracking = () => {
        if (tracking) stopTracking();
        else startTracking();
    };


  // --- USE EFFECTS ---

  // 1. Efecto para obtener lecturas del sensor (solo el último para BPM y oxígeno)
  useEffect(() => {
    // Limitamos a 1 para obtener la lectura más reciente
    const q = query(ref(db, 'lecturas'), orderByChild('timestamp'), limitToLast(1));
    const unsub = onValue(q, (snap) => {
      const data = snap.val();
      if (!data) return setLecturas([]);
      const arr: Lectura[] = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
      arr.sort((a, b) => toMillis(b.timestamp) - toMillis(a.timestamp));
      setLecturas(arr); // Última lectura

      // Capturar pulso y oxígeno para la sesión activa
      if (tracking && arr.length > 0) {
      const latestReading = arr[0];

      if (latestReading.pulso && latestReading.pulso > 0) {
        activePulsesRef.current.push(latestReading.pulso);
      }
      if (latestReading.oxigeno && latestReading.oxigeno > 0) {
        activeOxygenRef.current.push(latestReading.oxigeno);
      }
    }
    });
    return () => unsub();
  }, [tracking]);

  // 2. Efecto para obtener el historial de SESIONES del usuario
  useEffect(() => {
    let detachSessions: undefined | (() => void);
    
    const off = onAuthStateChanged(auth, (user) => {
        if (detachSessions) { detachSessions(); detachSessions = undefined; }
        if (!user) { setSessionSummaries([]); return; }
        
        // CORRECCIÓN DE RUTA: Escucha el nodo 'sessions'
        const sessionsRef = query(ref(db, `users/${user.uid}/sessions`), orderByChild('timestamp'), limitToLast(50));
        detachSessions = onValue(sessionsRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) return setSessionSummaries([]);
            
            const summaries: SessionSummary[] = Object.keys(data).map(key => ({
                id: key,
                timestamp: data[key].timestamp,
                distanciaFinal: data[key].distanciaFinal || 0,
                tiempoFinal: data[key].tiempoFinal || 0,
                pulsoPromedio: data[key].pulsoPromedio || 0,
                oxigenoPromedio: data[key].oxigenoPromedio || 0,
                esfuerzoFinal: data[key].esfuerzoFinal || 0,
                pasosTotales: data[key].pasosTotales || 0,
                caloriasFinales: data[key].caloriasFinales || 0,
                velocidadFinal: data[key].velocidadFinal || 0,
                routePointsRaw: data[key].routePoints || null, 
            }));
            // Ordenar por más reciente primero
            summaries.sort((a, b) => toMillis(b.timestamp) - toMillis(a.timestamp));
            setSessionSummaries(summaries);
        });
    });

    return () => {
      off();
      if (detachSessions) detachSessions();
    };
  }, []);

  // 3. Efecto para escuchar cambios de métricas personales (BMI) y perfil
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
        if (!data) { return; }
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
  
  // 4. Efecto para animar el icono del corazón (latido)
  useEffect(() => {
    const bpmGood = bpm >= 60 && bpm <= 100;
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
  }, [bpm, heartScale]);

  // 5. Limpieza al desmontar
  useEffect(() => {
    return () => {
        // CORRECCIÓN: Llamamos a la función asíncrona sin usar 'await' en el cleanup return
        stopTracking(); 
    };
  }, [stopTracking]); // El linter sigue pidiendo 'stopTracking' aquí, lo cual es correcto.

// NUEVO: Sincroniza la referencia con los valores calculados/estado en cada render
useEffect(() => {
    latestMetricsRef.current = {
        distance: routeDistanceKm,
        time: elapsed,
        speed: currentRouteSpeed,
        steps: steps,
        effort: computedEffort,
        calories: calories,
        route: routePoints,
        pulses: activePulsesRef.current,
        oxygen: activeOxygenRef.current,
    };
});

  // --- DATOS PARA LA VISTA (Usando el resumen diario) ---

  type IconNames = 'flame' | 'walk' | 'footsteps' | 'speedometer' | 'time' | 'person' | 'create' | 'chevron-back' | 'chevron-forward';

  type StatItem = {
    c: string; // color
    t: string; // texto
    v: string; // valor
    vc: string; // color de valor
    iconName: IconNames; // ⬅️ Usamos el tipo estricto aquí
};

  const statItems: StatItem[] = [ 
    { c: '#FF9F0A', t: 'Calorías quemadas', v: dailySummary.totalCalories > 0 ? `${dailySummary.totalCalories} Kcal` : '0 Kcal', vc: '#FF9F0A', iconName: 'flame' },
    { c: '#8c44ffff', t: 'Distancia', v: dailySummary.totalDistance > 0 ? `${Number(dailySummary.totalDistance).toFixed(2)} km` : '0 km', vc: '#C084FC', iconName: 'walk' },
    { c: '#50d8fdff', t: 'Pasos', v: dailySummary.totalSteps > 0 ? `${dailySummary.totalSteps}` : '0', vc: '#50d8fdff', iconName: 'footsteps' },
    { c: '#42c700ff', t: 'Rapidez', v: dailySummary.avgSpeed > 0 ? `${Number(dailySummary.avgSpeed).toFixed(2)} km/h` : '0 km/h', vc: '#42c700ff', iconName: 'speedometer' },
    { c: '#9c0000ff', t: 'Tiempo de actividad', v: dailySummary.totalTime > 0 ? `${formatTime(dailySummary.totalTime)}` : '0:00', vc: '#bf0101ff', iconName: 'time' },
];

  const timeDisplay = formatTime(elapsed);
  
  // --- VISTA PRINCIPAL ---
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: 24 + insets.bottom }]}>
        <View style={styles.headerRow}>
          <Text style={styles.h1}>Inicio</Text>
          <Pressable onPress={() => router.push('/profile')}>
            <View style={[styles.headerIcon, { backgroundColor: profileIcon.color || '#2B2B2E' }]}>
            <Ionicons name={profileIcon.name || 'person'} size={18} color="#111" />
          </View>
          </Pressable>
        </View>

        <View style={[styles.cardSmall, { padding: 0, overflow: 'hidden' }]}>
          <Image source={require('../../assets/elements/prom4.gif')} style={styles.demoImage} resizeMode="cover" />
        </View>

        {/* --- DATOS PERSONALES / BMI --- */}
        <View style={styles.cardLarge}>
          <Pressable style={styles.cardHeader} onPress={() => setBmiModalVisible(true)}>
            <Text style={[styles.cardTitle, { marginBottom: 0 }]}>Datos Personales</Text>
            <Ionicons name="create" size={18} color="#FFFFFF" />
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
              <Text style={styles.bmiValue}>{bmiSex || '--'}</Text>
              <Text style={styles.bmiLabel}>Sexo</Text>
            </View>
            <View style={[styles.bmiItem, styles.bmiStatusItem]}>
              <Text style={styles.bmiLabel}>Estado</Text>
              <Text style={[styles.bmiStatusValue, { color: bmiStatusColor }]}>{bmiStatusLabel}</Text>
            </View>
          </View>
        </View>

        {/* --- RUTA EN CURSO --- */}
        <View style={styles.cardLarge}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={styles.cardTitle}>Ruta en curso</Text>
              <Text style={styles.rowSub}>Tiempo: {timeDisplay}</Text>
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

        {/* --- MAPA Y DETALLES DE RUTA / PULSO --- */}
        <View style={[styles.cardLarge, { padding: 12 }]}>
        <Text style={styles.cardTitle}>Mapa de rutas</Text>

        {/* AHORA MUESTRA LA FECHA DE LA ÚLTIMA LECTURA O SESIÓN GUARDADA */}
        <Text style={[styles.rowSub, { marginBottom: 8 }]}>
          Última actividad: {formatDate(new Date(displayLastMs))}
        </Text>

        <View style={styles.pitchWrap}>
           <RouteMap points={displayRoutePoints} /> 
        </View>

        {routePoints.length === 0 && !lastSavedSession ? ( 
          <Text style={[styles.rowSub, { marginTop: 8 }]}>
            Activa <Text style={styles.italicText}>Iniciar ruta</Text> para comenzar a registrar tu recorrido.
          </Text>
      ) : null}

        {/* Tarjetas de Datos de la Ruta/Sesión */}
        <View
          style={{
            backgroundColor: 'rgba(28,28,30,1.00)',
            borderRadius: 12,
            padding: 0,
            marginTop: 12,
          }}
        >
          <Text style={styles.rowTitle}>Datos de la ruta</Text>

          <View style={styles.bmiRow}>
            <View style={styles.bmiItem}>
              <Text style={styles.bmiLabel}>Distancia</Text>

              {/* Muestra datos EN VIVO si tracking es true, sino muestra la última sesión guardada */}
              <Text style={styles.bmiValue}>
                {Number(displayData.distance || 0).toFixed(2)} km 
              </Text>
            </View>

            <View style={styles.bmiItem}>
              <Text style={styles.bmiLabel}>Tiempo</Text>
              <Text style={styles.bmiValue}>{formatTime(displayData.time)}</Text>
            </View>
          </View>

          <View style={styles.bmiRow2}>
            <View style={styles.bmiItem}>
              <Text style={styles.bmiLabel}>Pulso</Text>

              <View style={styles.centerCard}>
                <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                  <Ionicons name="heart" size={25} color="#FF3B30" />
                </Animated.View>

                <Text style={styles.bmiValue}>{displayBPM} BPM</Text>
              </View>
            </View>

            <View style={styles.bmiItem}>
              <Text style={styles.bmiLabel}>Esfuerzo</Text>

              <View style={styles.centerCard}>
                <Text style={styles.bmiValue}>{displayData.effort}%</Text>
                <Text
                  style={[
                    styles.bmiStatusValue,
                    { color: getEffortStatusColor(displayData.effort) },
                  ]}
                >
                  {getEffortStatus(displayData.effort)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
 
        {/* --- STATS DEL DÍA SELECCIONADO (Ahora usa sessions guardadas) --- */}
        <View style={styles.switcher}>
          <Ionicons name="chevron-back" size={20} color="#FFFFFF" onPress={() => setDayOffset((n) => Math.min(6, n + 1))} />
          <Text style={styles.switcherTitle}>{formatDay(selectedDate)}</Text>
          <Ionicons name="chevron-forward" size={20} color="#FFFFFF" onPress={() => setDayOffset((n) => Math.max(0, n - 1))} />
        </View>

        {statItems.map((s, i) => (
          <View key={i} style={[styles.cardLarge, { flexDirection: 'row', alignItems: 'center', padding: 12 }]}>
            <View style={[styles.iconCircle, { backgroundColor: s.c }, {marginRight: 12}]}>
              <Ionicons name={s.iconName} size={18} color="#fff" />
            </View>
            <View>
              <Text style={styles.statTitle}>{s.t}</Text>
              <Text style={[styles.statValue, { color: s.vc }]}>{s.v}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* --- MODAL DE EDICIÓN DE DATOS PERSONALES --- */}
      <Modal
        visible={bmiModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setBmiModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar datos físicos</Text>
              <Pressable hitSlop={12} onPress={() => setBmiModalVisible(false)}>
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={styles.modalContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Entradas de datos (Edad, Peso, Altura, Sexo) */}
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

      <Modal
        transparent
        animationType="fade"
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.alertOverlay}>
          <View style={styles.alertBox}>
            
            {/* Botón X arriba */}
            <Pressable style={styles.alertCloseButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.alertCloseButtonText}>✕</Text>
            </Pressable>
            {/* Título */}
            <Text style={styles.alertTitle}>{modalTitle}</Text>
            {/* Mensaje */}
            <Text style={styles.alertMessage}>{modalMessage}
            </Text>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

// --- COMPONENTES AUXILIARES DE VISTA ---

/** Mapa de Ruta */
type RouteMapProps = { points: RoutePoint[] };
function RouteMap({ points }: RouteMapProps) {
  if (points.length < 2) {
    return (
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={styles.rowSub}>Aún no hay puntos registrados</Text>
      </View>
    );
  }
  
  // Normalización de coordenadas para el SVG
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
    y: 0.1 + 0.8 * (1 - (p.latitude - minLat) / latRange), // Invertir Y para orientación correcta en el mapa
  }));
  
  return <SoccerField points={normalized} />;
}

/** Campo de Soccer (Usado como lienzo para el mapa) */
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
      {/* Fondo y líneas de campo (manteniendo el estilo original) */}
      <Rect x="0" y="0" width={WIDTH} height={HEIGHT} rx="12" fill="#89FF00" />
      <Rect x="3" y="3" width={WIDTH - 6} height={HEIGHT - 6} rx="10" stroke="#FFFFFF" strokeWidth="1.5" fill="none" />
      <SvgLine x1={WIDTH / 2} y1={3} x2={WIDTH / 2} y2={HEIGHT - 3} stroke="#FFFFFF" strokeWidth="1.5" />
      <SvgCircle cx={WIDTH / 2} cy={HEIGHT / 2} r="9" stroke="#FFFFFF" strokeWidth="1.5" fill="none" />
      <Rect x="3" y={HEIGHT / 2 - 25} width="24" height="50" stroke="#FFFFFF" strokeWidth="1.5" fill="none" />
      <Rect x={WIDTH - 27} y={HEIGHT / 2 - 25} width="24" height="50" stroke="#FFFFFF" strokeWidth="1.5" fill="none" />
      <Rect x="3" y={HEIGHT / 2 - 15} width="12" height="30" stroke="#FFFFFF" strokeWidth="1.5" fill="none" />
      <Rect x={WIDTH - 15} y={HEIGHT / 2 - 15} width="12" height="30" stroke="#FFFFFF" strokeWidth="1.5" fill="none" />
  
      {/* Ruta y puntos */}
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

// --- ESTILOS (Mantenidos del original) ---

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'black' },
  scroll: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  h1: { color: 'white', fontSize: 32, fontFamily: fonts.semibold, marginTop: 10, marginBottom: 10, fontWeight: 'bold' },
  headerIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2B2B2E' },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardSmall: { backgroundColor: '#1C1C1E', borderRadius: 18, padding: 16, marginBottom: 16 },
  cardLarge: { backgroundColor: '#1C1C1E', borderRadius: 18, padding: 16, marginBottom: 16 },
  heartCard: { flexDirection: 'row', alignItems: 'center', height: 40, justifyContent: 'space-around' },
  cardTitle: { color: 'white', fontSize: 16, fontFamily: fonts.semibold, marginBottom: 8 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  demoImage: {
    width: '100%',
    height: 210,
  },
  centerCard: { alignItems: 'center', justifyContent: 'center', height: 70 },
  rowSub: { color: '#9E9EA0', fontSize: 12, fontFamily: fonts.regular },
  rowTitle: { color: '#fff', fontSize: 16, fontFamily: fonts.semibold },
  statTitle: { color: 'white', fontFamily: fonts.semibold },
  statValue: { fontFamily: fonts.semibold },
  pitchWrap: { aspectRatio: 16 / 10, borderRadius: 16, overflow: 'hidden' },
  switcher: { backgroundColor: '#1C1C1E', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  switcherTitle: { color: 'white', fontFamily: fonts.semibold, fontSize: 16 },
  bmiRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 12 },
  bmiRow2: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 0 },
  bmiItem: { width: '47%', marginBottom: 12, padding: 12, borderRadius: 12, backgroundColor: '#111214' },
  bmiValue: { color: '#A6FF00', fontSize: 18, fontFamily: fonts.semibold },
  bmiLabel: { color: '#9E9EA0', fontSize: 12, fontFamily: fonts.regular },
  bmiStatusItem: { width: '47%' },
  bmiStatusValue: { color: 'white', fontSize: 16, fontFamily: fonts.semibold, marginLeft: 8 },
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
  italicText: {fontStyle: 'italic'},
  /* ------------------------------- Alert Modal ------------------------------- */

  alertOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },

  alertBox: {
    backgroundColor: '#1e1e1e',
    padding: 25,
    borderRadius: 12,
    width: '80%',
    alignItems: 'center',
    position: 'relative',
  },

  alertCloseButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 6,
  },

  alertCloseButtonText: {
    color: '#888',
    fontSize: 18,
  },

  alertTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },

  alertMessage: {
    color: '#ccc',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 25,
  },

  alertOkButton: {
    backgroundColor: '#444',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 30,
  },

  alertOkButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
});