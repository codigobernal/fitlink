import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from "expo-router";
import { onAuthStateChanged } from 'firebase/auth';
import { limitToLast, onValue, orderByChild, query, ref, remove } from 'firebase/database';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fonts } from '../constants/fonts';
import { auth, db } from '../firebaseConfig.js';

/* -------------------------------------------------------------------------- */
/*                              CONSTANTES                                    */
/* -------------------------------------------------------------------------- */

const COLORS = {
  pulso: { stroke: '#FF5757', fill: 'rgba(255,87,87,0.6)', unit: ' BPM', name: 'Pulso', iconName: 'heart-sharp' as const }, 
  oxigeno: { stroke: '#7AD7FF', fill: 'rgba(122,215,255,0.6)', unit: '%', name: 'Oxígeno', iconName: 'water-sharp' as const }, 
  distancia: { stroke: '#FFD166', fill: 'rgba(255,214,102,0.6)', unit: ' km', name: 'Distancia', iconName: 'walk' as const }, 
  pasos: { stroke: '#FF9F0A', fill: 'rgba(255,159,10,0.6)', unit: ' pasos', name: 'Pasos', iconName: 'footsteps' as const }, 
  esfuerzo: { stroke: '#A6FF00', fill: 'rgba(166,255,0,0.6)', unit: '%', name: 'Esfuerzo', iconName: 'flame' as const },
};

/* -------------------------------------------------------------------------- */
/*                                TIPOS                                       */
/* -------------------------------------------------------------------------- */

type SessionData = { 
    id: string; 
    pulsoPromedio: number; 
    oxigenoPromedio: number;
    esfuerzoFinal: number; 
    pasosTotales: number; 
    distanciaFinal: number; 
    tiempoFinal: number;
    timestamp: any; 
};

type Lectura = {
  id: string;
  pulso: number;
  oxigeno?: number;
  distancia?: number;
  timestamp: any;
};

type MetricKey = keyof typeof COLORS;
type MetricInfo = typeof COLORS[MetricKey];

/* -------------------------------------------------------------------------- */
/*                          FUNCIONES AUXILIARES                              */
/* -------------------------------------------------------------------------- */

function toMillis(ts: any): number {
  if (typeof ts === 'number') return ts > 1e12 ? ts : ts * 1000;

  const n = Number(ts);
  if (!Number.isNaN(n)) return n > 1e12 ? n : n * 1000;

  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

function formatFullDate(ms: number): string {
    const d = new Date(ms);
    return d.toLocaleString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true, // Habilitar formato 12 horas (AM/PM)
    }).replace(',', '');
}

function getMetricDetails(item: SessionData | Lectura, metricKey: MetricKey) {
    let value: number | string = 0;
    let suffix = '';
    // CORREGIDO: El tipo de metricInfo es MetricInfo y se inicializa con la clave dinámica
    let metricInfo: MetricInfo = COLORS[metricKey]; 

    // Manejo de lecturas puntuales
    if (!('pulsoPromedio' in item)) { 
    if (metricKey === 'pulso') {
          value = (item as Lectura).pulso;
         } else if (metricKey === 'oxigeno') {
           value = (item as Lectura).oxigeno || 0;
      }
    } 
    
    // Manejo de datos de Sesión
    else {
        const sessionItem = item as SessionData;
        switch (metricKey) {
            case 'pulso': value = sessionItem.pulsoPromedio; break;
            case 'oxigeno': value = sessionItem.oxigenoPromedio; break;
            case 'pasos': value = sessionItem.pasosTotales; break;
            case 'esfuerzo': value = sessionItem.esfuerzoFinal; break;
            case 'distancia': 
                value = sessionItem.distanciaFinal; 
                value = Number(value).toFixed(2); 
            break;
            default: value = '--'; break;
            }
      }
    
    suffix = metricInfo.unit; 

    if (typeof value === 'number' && metricKey !== 'distancia') {
        value = Math.round(value);
    }
    
    const finalValue = (value === 0 || value === '0.00' || value === '--') ? '--' : value;
    
    return { 
        value: finalValue, 
        suffix, 
        color: metricInfo.stroke,
        iconName: metricInfo.iconName // Exportamos el nombre del ícono
  };
}

/* -------------------------------------------------------------------------- */
/*                        COMPONENTE PRINCIPAL                                */
/* -------------------------------------------------------------------------- */

export default function DetailView() {
  //const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<SessionData | Lectura | null>(null);
  const { metric: metricKey = 'pulso', title: metricTitle = 'Pulso' } =
    params as { metric: string; title: string };

  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [lecturas, setLecturas] = useState<Lectura[]>([]);
  const [showAll, setShowAll] = useState(false);

  const isSessionMetric =
    ['pulso', 'oxigeno', 'esfuerzo', 'pasos', 'distancia'].includes(metricKey);

  /* --------------------------- CARGA DE DATOS --------------------------- */

  useEffect(() => {
    let detach: undefined | (() => void);

    const off = onAuthStateChanged(auth, (user) => {
      if (detach) {
        detach();
        detach = undefined;
      }

      if (!user) {
        setSessions([]);
        setLecturas([]);
        return;
      }

      if (isSessionMetric) {
        const sessionsRef = ref(db, `users/${user.uid}/sessions`);

        detach = onValue(sessionsRef, (snap) => {
          const data = snap.val();
          if (!data) return setSessions([]);

          const arr = Object.keys(data).map((id) => ({ id, ...data[id] }));
          arr.sort((a, b) => toMillis(b.timestamp) - toMillis(a.timestamp));

          setSessions(arr);
        });

      } else {
        const readingsRef = query(
          ref(db, 'lecturas'),
          orderByChild('timestamp'),
          limitToLast(500)
        );

        detach = onValue(readingsRef, (snap) => {
          const data = snap.val();
          if (!data) return setLecturas([]);

          const arr = Object.keys(data).map((k) => ({ id: k, ...data[k] }));
          arr.sort((a, b) => toMillis(b.timestamp) - toMillis(a.timestamp));

          setLecturas(arr);
        });
      }
    });

    return () => {
      off();
      if (detach) detach();
    };
  }, [metricKey, isSessionMetric]);

  /* ---------------------------- DATA FINAL ------------------------------ */

  const rawData = isSessionMetric ? sessions : lecturas;
  const historyData = useMemo(
    () => (showAll ? rawData : rawData.slice(0, 10)),
    [rawData, showAll]
  );

  /* ---------------------------- MANEJADORES ----------------------------- */

  const handleDeleteConfirmation = (item: SessionData | Lectura) => {
    setItemToDelete(item);
    setModalVisible(true);
};

// 2. Ejecuta la eliminación real cuando se confirma en el modal
const handleDelete = () => {
    if (!itemToDelete) return;

    const currentUser = auth?.currentUser;
    if (!currentUser) {
        Alert.alert("Error", "Usuario no autenticado.");
        setModalVisible(false);
        setItemToDelete(null);
        return;
    }

    const item = itemToDelete;
    const isReading = !('pulsoPromedio' in item); // Si no tiene pulsoPromedio, es una Lectura
    const basePath = isReading ? 'lecturas' : `users/${currentUser.uid}/sessions`;
    const itemRef = ref(db, `${basePath}/${item.id}`);
    const type = isReading ? 'lectura puntual' : 'sesión';

    // Cerrar modal inmediatamente
    setModalVisible(false);
    
    // Ejecutar la eliminación
    remove(itemRef)
        .then(() => console.log(`Registro ${item.id} de ${type} eliminado.`))
        .catch(e => Alert.alert("Error al eliminar", `No se pudo eliminar el registro: ${e.message}`))
        .finally(() => setItemToDelete(null));
};


  /* ---------------------------------------------------------------------- */

  return (
    <SafeAreaView style={styles.safe}>
      {/* HEADER */}
      <View style={[styles.headerRow, { paddingHorizontal: 20 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={30} color="#FFFFFF" />
        </Pressable>

        <Text style={styles.h1}>Historial</Text>
      </View>

      {/* SUBHEADER */}
      <View style={styles.rowHeader}>
        <Text style={styles.section}>
          {isSessionMetric ? 'Resúmenes de Sesión' : 'Lecturas Individuales'}
        </Text>

        <Pressable onPress={() => setShowAll((v) => !v)}>
          <Text style={styles.link}>
            {showAll
              ? `Mostrar recientes (${historyData.length}/${rawData.length})`
              : `Mostrar todo (${rawData.length})`}
          </Text>
        </Pressable>
      </View>

      {/* LISTA */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {historyData.length === 0 ? (
          <Text style={styles.empty}>
            Aún no hay datos históricos disponibles para {metricTitle}.
          </Text>
        ) : (
          historyData.map((item) => {
            const { value, suffix, color, iconName } = getMetricDetails(item, metricKey as MetricKey);
            const isSession = 'pulsoPromedio' in item;
            return (
              <View key={item.id} style={styles.rowCard}>
                <View style={[styles.iconCircle, { backgroundColor: color }]}> 
                    <Ionicons name={iconName} size={18} color="#111" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowStrong}>
                    {value}{suffix}
                  </Text>

                  <Text style={styles.rowSub}>
                    {isSession
                      ? `Duración: ${
                          item.tiempoFinal
                            ? Math.round(item.tiempoFinal / 60) + ' min'
                            : '--'
                        }`
                      : 'Lectura puntual'}
                  </Text>

                  <Text style={styles.rowSub}>
                    {formatFullDate(toMillis(item.timestamp))}
                  </Text>
                </View>

                <Pressable onPress={() => handleDeleteConfirmation(item)} hitSlop={10}>
                  <Ionicons name="trash" size={18} color="#FF6B6B" />
                </Pressable>
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal
                transparent
                animationType="fade"
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalText}>¿Eliminar registro definitivamente?</Text>
                    <Text style={[styles.modalText, { fontWeight: 'normal', fontSize: 14, marginBottom: 25 }]}>
                      Se eliminarán todos los datos de la sesión. Esta acción no se puede deshacer.
                    </Text>
      
                    <View style={styles.modalActions}>
                      <Pressable
                        style={[styles.modalButton, styles.modalCancelButton]}
                        onPress={() => setModalVisible(false)}
                      >
                        <Text style={styles.modalCancelButtonText}>Cancelar</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.modalButton, styles.modalConfirmButton]}
                        onPress={handleDelete}
                        disabled={loading}
                      >
                        <Text style={styles.modalConfirmButtonText}>
                          {loading ? 'Eliminando...' : 'Eliminar'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </Modal>
    </SafeAreaView>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   ESTILOS                                  */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: 'black'
  },
  iconCircle: {
        width: 38, 
        height: 38, 
        borderRadius: 19, 
        alignItems: 'center', 
        justifyContent: 'center',
        marginRight: 10,
    },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 40,
    marginBottom: 16
  },

  h1: {
    color: 'white',
    fontSize: 24,
    fontFamily: fonts.semibold,
    marginLeft: 10,
    fontWeight: 'bold'
  },

  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 4
  },

  section: {
    color: 'white',
    fontSize: 18,
    fontFamily: fonts.semibold,
    marginTop: 6,
    marginBottom: 8
  },

  link: {
    color: '#7AD7FF',
    opacity: 0.9,
    fontSize: 12,
    fontFamily: fonts.regular
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    paddingBottom: 40
  },

  rowCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center'
  },

  dot: {
    width: 22,
    height: 22,
    borderRadius: 11
  },

  rowStrong: {
    color: 'white',
    fontSize: 16,
    fontFamily: fonts.semibold
  },

  rowSub: {
    color: '#9E9EA0',
    fontSize: 12,
    fontFamily: fonts.regular
  },

  empty: {
    color: '#9E9EA0',
    fontFamily: fonts.regular,
    padding: 20,
    textAlign: 'center'
  },
  // Modal
  modalOverlay: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    backgroundColor: '#1e1e1e',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: '85%',
  },
  modalText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalButton: {
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalConfirmButton: {
    backgroundColor: '#FF3B30', // rojo para eliminar
  },
  modalCancelButton: {
    backgroundColor: '#444',
  },
  modalConfirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalCancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },

});
