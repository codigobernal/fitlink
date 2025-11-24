import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { onAuthStateChanged } from 'firebase/auth';
import { onValue, ref } from 'firebase/database';
import { fonts } from '../../constants/fonts';
import { auth, db } from '../../firebaseConfig.js';

const INACTIVE_CIRCLE = '#3A3A3C';

function circleIcon(icon: keyof typeof Ionicons.glyphMap, activeColor: string) {
  const Component = ({ focused }: { focused: boolean }) => (
    <View
      style={{
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: focused ? activeColor : INACTIVE_CIRCLE,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name={icon} size={17} color={focused ? '#111' : '#CFCFCF'} />
    </View>
  );

  Component.displayName = `CircleIcon(${icon})`;

  return Component;
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const [accent, setAccent] = useState('#A6FF00');
  useEffect(() => {
    const off = onAuthStateChanged(auth, (u) => {
      if (!u) return;
      const r = ref(db, `users/${u.uid}/theme/accent`);
      const unsub = onValue(r, (snap) => {
        const v = snap.val();
        if (typeof v === 'string' && v.length) setAccent(v);
      });
      return () => unsub();
    });
    return () => off();
  }, []);
  const bottomPad = Math.max(6, insets.bottom);
  const height = 65 + bottomPad;
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: accent,
        tabBarInactiveTintColor: '#8C8C8C',
        tabBarStyle: {
          backgroundColor: '#2A2A2C',
          borderTopColor: '#2A2A2C',
          height,
          paddingBottom: bottomPad,
          paddingTop: 10,
        },
        tabBarLabelStyle: { fontSize: 13, fontFamily: fonts.semibold },
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio', tabBarIcon: circleIcon('home', accent) }} />
      <Tabs.Screen name="Estadisticas" options={{ title: 'Estadisticas', tabBarIcon: circleIcon('stats-chart', accent) }} />
      <Tabs.Screen name="Perfil" options={{ title: 'Informacion', tabBarIcon: circleIcon('information', accent) }} />
    </Tabs>
  );
}

