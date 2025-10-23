import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#A6FF00',
        tabBarInactiveTintColor: '#8C8C8C',
        tabBarStyle: { backgroundColor: '#2A2A2C', borderTopColor: '#2A2A2C', height: 58, paddingBottom: 4, paddingTop: 4 },
        tabBarLabelStyle: { fontSize: 12, fontFamily: 'SFProRounded-Semibold' },
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={18} color={color} />,
        }}
      />
      <Tabs.Screen
        name="Estadisticas"
        options={{
          title: 'Estadísticas',
          tabBarIcon: ({ color }) => <Ionicons name="stats-chart" size={18} color={color} />,
        }}
      />
      <Tabs.Screen
        name="Perfil"
        options={{
          title: 'Información',
          tabBarIcon: ({ color }) => <Ionicons name="information-circle" size={18} color={color} />,
        }}
      />
      {/* Ocultar rutas sobrantes dentro del grupo de tabs */}
      <Tabs.Screen name="explore" options={{ href: null }} />
      <Tabs.Screen name="index copy" options={{ href: null }} />
    </Tabs>
  );
}

