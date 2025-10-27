import React, { ReactNode } from 'react';
import { View, Image, StyleSheet } from 'react-native';

type Props = {
  children: ReactNode;
};

export default function AuthBackground({ children }: Props) {
  return (
    <View style={styles.container}>
      {/* Decorative images (shared across auth screens) */}
      <Image source={require('../../assets/images/Tech Blanket.png')} style={styles.decTopLeft} />
      <Image source={require('../../assets/images/Classic Trainer.png')} style={styles.decTopRight} />
      <Image source={require('../../assets/images/Gray Dumbbell.png')} style={styles.decMidLeft} />
      <Image source={require('../../assets/images/Weighted Barbell.png')} style={styles.decBottomLeft} />
      <Image source={require('../../assets/images/Yellow Towel.png')} style={styles.decBottomRight} />
      <Image source={require('../../assets/images/Alarm Clock.png')} style={styles.decBottomCenter} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  decTopLeft: { position: 'absolute', left: 24, top: 64, width: 80, height: 80 },
  decTopRight: { position: 'absolute', right: 50, top: 140, width: 90, height: 94},
  decMidLeft: { position: 'absolute', left: 60, top: 200, width: 100, height: 95 },
  decBottomLeft: { position: 'absolute', left: 35, bottom: 120, width: 90, height: 90 },
  decBottomRight: { position: 'absolute', right: 20, bottom: 160, width: 90, height: 98 },
  decBottomCenter: { position: 'absolute', alignSelf: 'center', bottom: 10, width: 100, height: 100 },
});
