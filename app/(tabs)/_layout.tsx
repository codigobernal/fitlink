import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { HapticTab } from '@/components/haptic-tab';

const INACTIVE_CIRCLE = '#3A3A3C';
const ACTIVE_CIRCLE = '#A6FF00';

function circleIcon(icon: keyof typeof Ionicons.glyphMap) {
  return ({ focused }: { focused: boolean }) => (
    <View
      style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: focused ? ACTIVE_CIRCLE : INACTIVE_CIRCLE,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name={icon} size={18} color={focused ? '#111' : '#CFCFCF'} />
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: ACTIVE_CIRCLE,
        tabBarInactiveTintColor: '#8C8C8C',
        tabBarStyle: {
          backgroundColor: '#2A2A2C',
          borderTopColor: '#2A2A2C',
          height: 64,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 13, fontFamily: 'SFProRounded-Semibold' },
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: circleIcon('home'),
        }}
      />
      <Tabs.Screen
        name="Estadisticas"
        options={{
          title: 'Estadisticas',
          tabBarIcon: circleIcon('stats-chart'),
        }}
      />
      <Tabs.Screen
        name="Perfil"
        options={{
          title: 'Informacion',
          tabBarIcon: circleIcon('information'),
        }}
      />
      <Tabs.Screen name="explore" options={{ href: null }} />
      <Tabs.Screen name="index copy" options={{ href: null }} />
    </Tabs>
  );
}

