import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function RunningLoader() {
  const width = Dimensions.get('window').width;
  const translateX = useRef(new Animated.Value(-40)).current;
  const bounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const move = Animated.loop(
      Animated.sequence([
        Animated.timing(translateX, { toValue: width - 40, duration: 1200, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: -40, duration: 0, useNativeDriver: true }),
      ])
    );
    const step = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: 1, duration: 250, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0, duration: 250, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    move.start();
    step.start();
    return () => { move.stop(); step.stop(); };
  }, [translateX, bounce, width]);

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ translateX }, { translateY: bounce.interpolate({ inputRange: [0,1], outputRange: [0, -6] }) }] }}>
        <Ionicons name="walk" size={46} color="#A6FF00" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' },
});
