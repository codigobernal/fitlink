import React, { ReactNode } from 'react';
import { View, Image, StyleSheet } from 'react-native';

type Props = {
  children: ReactNode;
};

export default function AuthBackground({ children }: Props) {
  return (
    <View style={styles.container}>
      {/* Decorative images (shared across auth screens) */}
      <Image source={{ uri: 'https://placehold.co/101x101' }} style={styles.decTopLeft} />
      <Image source={{ uri: 'https://placehold.co/100x104' }} style={styles.decTopRight} />
      <Image source={{ uri: 'https://placehold.co/108x103' }} style={styles.decMidLeft} />
      <Image source={{ uri: 'https://placehold.co/94x94' }} style={styles.decBottomLeft} />
      <Image source={{ uri: 'https://placehold.co/93x102' }} style={styles.decBottomRight} />
      <Image source={{ uri: 'https://placehold.co/107x107' }} style={styles.decBottomCenter} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  decTopLeft: { position: 'absolute', left: 24, top: 64, width: 80, height: 80 },
  decTopRight: { position: 'absolute', right: 16, top: 140, width: 90, height: 94, transform: [{ rotate: '180deg' }] },
  decMidLeft: { position: 'absolute', left: 24, top: 200, width: 100, height: 95 },
  decBottomLeft: { position: 'absolute', left: 24, bottom: 120, width: 90, height: 90 },
  decBottomRight: { position: 'absolute', right: 16, bottom: 110, width: 90, height: 98, transform: [{ rotate: '180deg' }] },
  decBottomCenter: { position: 'absolute', alignSelf: 'center', bottom: 40, width: 100, height: 100 },
});

