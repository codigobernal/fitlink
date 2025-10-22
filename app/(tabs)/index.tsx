import { onValue, ref } from "firebase/database";
import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { db } from "../../firebaseConfig";
import "../../global.css";

//  Tipos de datos
type Lectura = {
  id: string;
  pulso: number;
  oxigeno: number;
  distancia: number;
  timestamp: string;
};

export default function App() {
  const [lecturas, setLecturas] = useState<Lectura[]>([]);

  useEffect(() => {
    const lecturasRef = ref(db, "lecturas");

    const unsubscribe = onValue(lecturasRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const lecturasArray = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setLecturas(lecturasArray);
      } else {
        setLecturas([]);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lecturas del ESP32</Text>
      <FlatList
        data={lecturas}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text className="text-red-500 text-3xl">Pulso: {item.pulso}</Text>
            <Text>Oxígeno: {item.oxigeno}%</Text>
            <Text>Distancia: {item.distancia} km</Text>
            <Text>Fecha: {new Date(item.timestamp).toLocaleDateString("en-US")}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 50 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  item: { padding: 15, borderBottomWidth: 1, borderColor: "#ccc" },
});
