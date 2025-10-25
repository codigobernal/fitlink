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

  // ====== Escala base para tipografía y paddings ======
  const baseW = 390;
  const scale = Math.min(1.2, Math.max(0.7, width / baseW));

  const brandSize = 40 * scale;
  const subtitleSize = 15 * scale;
  const lineHeight = 22 * scale;
  const btnH = Math.round(44 * scale);
  const btnRadius = Math.round(16 * scale);
  const contentPadding = Math.max(20, 24 * scale);
  const maxContentW = Math.min(360, width - 2 * contentPadding);

  // ====== Runners (mismo tamaño + 1.5x + responsivo) ======
  const baseWForImg = width * 0.22;     // tamaño base relativo a pantalla
  const scaleImgs = 3;                // factor 1.5x
  const runnerW = Math.min(baseWForImg * scaleImgs, width * 0.70, 340);
  const aspectGuess = 1.10;             // ancho/alto aproximado del asset
  const runnerH = runnerW * aspectGuess;

  // Evitar que el contenido quede oculto tras la barra de tabs
  const tabsSafety = 80;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <View style={styles.container}>
        {/* Runners */}
        <Image
          source={require("../../assets/images/Sprinter Female.png")}
          style={{
            position: "absolute",
            width: runnerW,
            height: runnerH,
            left: -Math.max(40, width * 0.08),
            top: Math.max(60, height * 0.10),
            zIndex: 1,
          }}
          resizeMode="contain"
        />

        <Image
          source={require("../../assets/images/Sprinter Male.png")}
          style={{
            position: "absolute",
            width: runnerW,
            height: runnerH,
            right: -Math.max(30, width * 0.06),
            top: Math.max(160, height * 0.35),
            zIndex: 1,
          }}
          resizeMode="contain"
        />

        {/* Contenido inferior */}
        <View
          style={[
            styles.content,
            {
              paddingHorizontal: contentPadding,
              paddingBottom: contentPadding + tabsSafety / 2,
            },
          ]}
        >
          <View style={{ width: maxContentW, alignSelf: "flex-start" }}>
            <Text
              style={[
                styles.brand,
                {
                  fontSize: brandSize,
                  fontFamily: "SFProRounded-Semibold",
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
                  fontFamily: "SFProRounded-Semibold",
                },
              ]}
              numberOfLines={3}
            >
              Mide tu esfuerzo, conecta fitLink y desbloquea el análisis de tu
              rendimiento al instante.
            </Text>

            <Pressable
              onPress={() => router.push("/login")}
              style={({ pressed }) => [
                styles.primaryBtn,
                {
                  height: btnH,
                  borderRadius: btnRadius,
                  opacity: pressed ? 0.85 : 1,
                },
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
                {
                  height: btnH,
                  borderRadius: btnRadius,
                  borderWidth: 1,
                  opacity: pressed ? 0.85 : 1,
                },
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
  content: { flex: 1, justifyContent: "flex-end", zIndex: 3 }, // encima de las imágenes
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
