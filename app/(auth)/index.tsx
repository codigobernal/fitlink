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

  // ====== Cuadros/Imágenes con tamaños de diseño ======
  const DESIGN_W1 = 264; // A
  const DESIGN_H1 = 345;
  const DESIGN_W2 = 335; // B (la grande)
  const DESIGN_H2 = 354;

  // Nunca exceder el ancho disponible (dejamos 32px margen total)
  const maxImageWidth = width - 32;
  const imgScale = Math.min(1, maxImageWidth / DESIGN_W2);

  const imgA_W = Math.round(DESIGN_W1 * imgScale);
  const imgA_H = Math.round(DESIGN_H1 * imgScale);
  const imgB_W = Math.round(DESIGN_W2 * imgScale);
  const imgB_H = Math.round(DESIGN_H2 * imgScale);

  // Posicionamiento relativo (ajusta los offsets a tu gusto)
  const imgB_left = Math.round((width - imgB_W) / 2 + 20 * imgScale);
  const imgB_top = Math.round(height * 0.38);

  const imgA_left = Math.round((width - imgA_W) / 2 - 30 * imgScale);
  const imgA_top = Math.round(height * 0.18);

  // Evitar que el contenido quede oculto tras la barra de tabs
  const tabsSafety = 80;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <View style={styles.container}>
        {/* Fondo negro + imágenes decorativas */}
        <Image
          source={{ uri: "https://placehold.co/335x354" }}
          style={{
            position: "absolute",
            width: imgB_W,
            height: imgB_H,
            left: imgB_left,
            top: imgB_top,
            transform: [{ rotate: "180deg" }],
            borderRadius: 8,
            flexShrink: 0,
            opacity: 0.85,
          }}
          resizeMode="cover"
        />

        <Image
          source={{ uri: "https://placehold.co/264x345" }}
          style={{
            position: "absolute",
            width: imgA_W,
            height: imgA_H,
            left: imgA_left,
            top: imgA_top,
            borderRadius: 8,
            flexShrink: 0,
            opacity: 0.9,
          }}
          resizeMode="cover"
        />

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
