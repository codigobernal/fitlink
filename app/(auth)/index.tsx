// app/(auth)/index.tsx
import {
  SafeAreaView,
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function Landing() {
  const { width, height } = useWindowDimensions();

  // ====== Escala y medidas base ======
  const baseW = 390;
  const scale = Math.min(1.2, Math.max(0.7, width / baseW));

  const brandSize = 40 * scale;
  const subtitleSize = 15 * scale;
  const lineHeight = 22 * scale;
  const btnH = Math.round(44 * scale);
  const btnRadius = Math.round(16 * scale);
  const contentPadding = Math.max(20, 24 * scale);
  const maxContentW = Math.min(360, width - 2 * contentPadding);

  // ====== Runners (simulación de diseño) ======
  const leftW = Math.min(width * 0.58, 260);
  const leftH = leftW * 1.3; // proporción aproximada
  const rightW = Math.min(width * 0.42, 220);
  const rightH = rightW * 1.2;

  // Evitar que el contenido quede oculto tras la barra de tabs
  const tabsSafety = 80;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <View style={styles.container}>
        {/* Runners (local assets via require) */}
        <Image source={require('../../assets/images/Sprinter Female.png')} style={{ position: 'absolute', width: leftW, height: leftH, left: 12, top: 84 }} resizeMode="contain" />
        <Image source={require('../../assets/images/Sprinter Male.png')} style={{ position: 'absolute', width: rightW, height: rightH, right: -8, top: Math.max(180, height * 0.28) }} resizeMode="contain" />

        {/* Contenido inferior */}
        <View
          style={[
            styles.content,
            { paddingHorizontal: contentPadding, paddingBottom: contentPadding + tabsSafety / 2 },
          ]}
        >
          <View style={{ width: maxContentW, alignSelf: "flex-start" }}>
            <Text
              style={[
                styles.brand,
                {
                  fontSize: brandSize,
                  fontFamily: "SFProRounded-Semibold", // usa fallback si no está
                },
              ]}
            >
              fitLink
            </Text>

            <Text
              style={[
                styles.subtitle,
                {
                  fontSize: subtitleSize,
                  lineHeight,
                  fontFamily: "SFProRounded-Semibold", // 600
                },
              ]}
              numberOfLines={3}
            >
              Mide tu esfuerzo, conecta fitLink y desbloquea el análisis de tu rendimiento al instante.
            </Text>

            <Pressable
              onPress={() => router.push("/login")}
              style={({ pressed }) => [
                styles.primaryBtn,
                { height: btnH, borderRadius: btnRadius, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Text
                style={[
                  styles.primaryText,
                  { fontSize: 16 * scale, fontFamily: "SFProRounded-Semibold" },
                ]}
              >
                Iniciar Sesión
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.push("/register")}
              style={({ pressed }) => [
                styles.ghostBtn,
                { height: btnH, borderRadius: btnRadius, borderWidth: 1, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Text
                style={[
                  styles.ghostText,
                  { fontSize: 16 * scale, fontFamily: "SFProRounded-Semibold" },
                ]}
              >
                Registrarse
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "black" },
  container: { flex: 1, backgroundColor: "black" },
  content: { flex: 1, justifyContent: "flex-end", zIndex: 2 },
  brand: {
    color: "#FFF",
    marginBottom: 10,
  },
  subtitle: {
    color: "#FFF",
    marginBottom: 16,
  },
  primaryBtn: {
    backgroundColor: "#A6FF00",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  primaryText: { color: "#000", fontWeight: "600" },
  ghostBtn: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    borderColor: "#FFF",
    backgroundColor: "transparent",
  },
  ghostText: { color: "#FFF", fontWeight: "600" },
});
