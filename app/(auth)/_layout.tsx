import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="gps" />
      <Stack.Screen name="metrics" />
      <Stack.Screen name="main" />
    </Stack>
  );
}
