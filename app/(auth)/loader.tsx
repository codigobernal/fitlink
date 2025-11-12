import { router } from "expo-router";
import React, { useEffect } from "react";
import { Image, SafeAreaView, StyleSheet, View } from "react-native";

export default function LoadingScreen() {
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/(auth)/main");
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Image
          source={require("../../assets/images/loader.gif")} // coloca tu gif aquí
          style={{ width: 120, height: 120, resizeMode: "contain" }}
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
    justifyContent: "center",
    alignItems: "center",
  },
});
