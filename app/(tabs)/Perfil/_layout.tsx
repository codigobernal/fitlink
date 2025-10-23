import { Stack, useNavigation, usePathname } from 'expo-router';
import { useEffect, useMemo } from 'react';

const TAB_STYLE = {
  backgroundColor: '#2A2A2C',
  borderTopColor: '#2A2A2C',
  height: 64,
  paddingBottom: 6,
  paddingTop: 6,
} as const;

export default function PerfilLayout() {
  const navigation = useNavigation();
  const pathname = usePathname();
  const isRoot = useMemo(() => /\/(tabs)\/Perfil\/?$/.test(pathname), [pathname]);

  useEffect(() => {
    navigation.getParent()?.setOptions({ tabBarStyle: isRoot ? TAB_STYLE : { display: 'none' } });
    return () => navigation.getParent()?.setOptions({ tabBarStyle: TAB_STYLE });
  }, [isRoot, navigation]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="edit" />
      <Stack.Screen name="about" />
      <Stack.Screen name="help" />
      <Stack.Screen name="change-password" />
      <Stack.Screen name="delete-data" />
    </Stack>
  );
}
