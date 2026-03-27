import { ResizeMode, Video } from "expo-av";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, SafeAreaView, StyleSheet, View } from "react-native";

export default function LoadingScreen() {
  const animationValue = useRef(new Animated.Value(0)).current; 
  const videoRef = useRef(null); 

  const animationLoop: React.MutableRefObject<Animated.CompositeAnimation | null> = useRef(null); 

  // --- Constantes de Animación ---
  const DELAY_BEFORE_NAVIGATE = 1500; 
  const ANIMATION_DURATION = 1000; 
  const INITIAL_DELAY_MS = 300; 

  const translateX = useMemo(() => {
    return animationValue.interpolate({
        inputRange: [0, 1],
        outputRange: [-100, 100], 
    });
  }, [animationValue]); 

  useEffect(() => {
    // 1. Definir la animación de deslizamiento
    const slideAnimation = Animated.timing(animationValue, {
      toValue: 1, 
      duration: ANIMATION_DURATION,
      easing: Easing.linear, 
      useNativeDriver: true,
    });

    // 2. Iniciar la animación y hacer que se repita
    // Almacenamos directamente el resultado del Animated.loop en .current
    animationLoop.current = Animated.loop(
        Animated.sequence([
            slideAnimation,
            Animated.timing(animationValue, {
                toValue: 0,
                duration: ANIMATION_DURATION,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ])
    );
    // 🎯 SOLUCIÓN al ERROR 1: Llamamos a .start() después de asignarlo a .current
    // Esto asegura que animationLoop.current no sea 'void' antes de llamar a stop().
    animationLoop.current.start(); 

    // 3. Establecer el temporizador para la navegación
    const totalDelay = INITIAL_DELAY_MS + DELAY_BEFORE_NAVIGATE;
    const timer = setTimeout(() => {
      // Detener el loop de la animación antes de navegar
      // TypeScript ahora sabe que animationLoop.current puede tener un método stop()
      if (animationLoop.current) {
        animationLoop.current.stop();
      }
      router.replace("/(auth)/main");
    }, totalDelay);

    return () => {
      clearTimeout(timer); 
      // Limpieza: Asegurar que el loop de la animación también se detenga
      if (animationLoop.current) {
        animationLoop.current.stop();
      }
    };
  }, [animationValue]); 

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Animated.View style={{ transform: [{ translateX }] }}>
          <Video
            ref={videoRef}
            source={require("../../assets/elements/loader2.mp4")} 
            style={styles.video}
            shouldPlay={true} 
            isLooping={true}
            resizeMode={ResizeMode.CONTAIN} 
          />
        </Animated.View>
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
    overflow: "hidden", 
  },
  video: {
    width: 120, 
    height: 120, 
  },
});