import { onValue, ref } from "firebase/database";
import React, { useEffect, useState } from "react";
import { Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { db } from "../../firebaseConfig";

// Tipos de datos
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

  // Datos para la gráfica
  const labels = lecturas.map((l) => new Date(l.timestamp).toLocaleTimeString());
  const pulsoData = lecturas.map((l) => l.pulso);
  const oxigenoData = lecturas.map((l) => l.oxigeno);

  const screenWidth = Dimensions.get("window").width;

  const chartConfig = {
    backgroundGradientFrom: "#fff",
    backgroundGradientTo: "#fff",
    color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    strokeWidth: 2,
    decimalPlaces: 0,
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Lecturas del ESP32</Text>

      {lecturas.length > 0 && (
        <LineChart
          data={{
            labels,
            datasets: [
              { data: pulsoData, color: () => "rgba(255,0,0,1)", strokeWidth: 2 },
              { data: oxigenoData, color: () => "rgba(0,0,255,1)", strokeWidth: 2 },
            ],
            legend: ["Pulso", "Oxígeno"],
          }}
          width={screenWidth - 40}
          height={250}
          chartConfig={chartConfig}
          bezier
          style={{ marginVertical: 20, borderRadius: 16 }}
        />
      )}

      {lecturas.map((item) => (
        <View key={item.id} style={styles.item}>
          <Text>Pulso: {item.pulso}</Text>
          <Text>Oxígeno: {item.oxigeno}%</Text>
          <Text>Distancia: {item.distancia} km</Text>
          <Text>Fecha: {new Date(item.timestamp).toLocaleDateString("en-US")}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 50 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  item: { padding: 15, borderBottomWidth: 1, borderColor: "#ccc" },
});
