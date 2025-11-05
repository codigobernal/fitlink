import { ReactNode } from 'react';
import { Image, StyleSheet, View, Platform } from 'react-native';

type Props = { children: ReactNode };

export default function AuthBackground({ children }: Props) {
  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Capa decorativa fija y muda */}
      <View style={styles.decoLayer} pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants">
        <Image source={require('../../assets/images/Tech Blanket.png')}     style={[styles.deco, styles.decTopLeft]} />
        <Image source={require('../../assets/images/Classic Trainer.png')}  style={[styles.deco, styles.decTopRight]} />
        <Image source={require('../../assets/images/Gray Dumbbell.png')}    style={[styles.deco, styles.decMidLeft]} />
        <Image source={require('../../assets/images/Weighted Barbell.png')} style={[styles.deco, styles.decBottomLeft]} />
        <Image source={require('../../assets/images/Yellow Towel.png')}     style={[styles.deco, styles.decBottomRight]} />
        <View style={styles.bottomCenterWrap}>
          <Image source={require('../../assets/images/Alarm Clock.png')} style={{ width: 100, height: 100 }} />
        </View>
      </View>

      {/* Contenido interactivo por encima */}
      <View style={styles.childrenWrap}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  decoLayer: { ...StyleSheet.absoluteFillObject },
  deco: { position: 'absolute', resizeMode: 'contain' },
  childrenWrap: {
    flex: 1,
    position: 'relative',
    zIndex: 10,
    ...(Platform.OS === 'android' ? { elevation: 10 } : {}),
  },
  decTopLeft:     { left: 24,  top: 64,  width: 80,  height: 80 },
  decTopRight:    { right: 50, top: 140, width: 90,  height: 94 },
  decMidLeft:     { left: 60,  top: 200, width: 100, height: 95 },
  decBottomLeft:  { left: 35,  bottom: 120, width: 90, height: 90 },
  decBottomRight: { right: 20, bottom: 160, width: 90, height: 98 },
  bottomCenterWrap: { position: 'absolute', left: 0, right: 0, bottom: 10, alignItems: 'center' },
});
