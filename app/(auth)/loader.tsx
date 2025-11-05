import { StatusBar } from "expo-status-bar";
import { Image, SafeAreaView, StyleSheet, useWindowDimensions, View } from "react-native";

export default function Landing() {
  const { width } = useWindowDimensions();

  const imageSize = Math.min(width * 0.7, 400); // máximo 300px

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <View style={styles.container}>
        <Image
          source={require("../../assets/images/logo.png")}
          style={{
            width: imageSize,
            height: imageSize,
            resizeMode: "contain",
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "black",
  },
  container: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
});
