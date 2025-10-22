// app/_layout.tsx
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { useColorScheme } from "@/hooks/use-color-scheme";

export const unstable_settings = { anchor: "(tabs)" };
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // 👇 Usa el nombre EXACTO del archivo que sí existe:
  const [fontsLoaded] = useFonts({
    "SFProRounded-Semibold": require("../assets/fonts/sf-pro-rounded.ttf"),
    // si solo tienes un archivo, puedes mapear también "Regular" al mismo:
    "SFProRounded-Regular": require("../assets/fonts/sf-pro-rounded.ttf"),
  });

  useEffect(() => { if (fontsLoaded) SplashScreen.hideAsync(); }, [fontsLoaded]);
  if (!fontsLoaded) return null;

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: "modal", title: "Modal" }} />
      </Stack>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
    </ThemeProvider>
  );
}
