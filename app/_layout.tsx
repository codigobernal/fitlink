// app/_layout.tsx
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { useColorScheme } from "@/hooks/use-color-scheme";
import RunningLoader from "@/components/ui/RunningLoader";

// export const unstable_settings = { anchor: "index" };
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [showLoader, setShowLoader] = useState(false);

  // 👇 Usa el nombre EXACTO del archivo que sí existe:
  const [fontsLoaded] = useFonts({
    "SFProRounded-Semibold": require("../assets/fonts/sf-pro-rounded.ttf"),
    // si solo tienes un archivo, puedes mapear también "Regular" al mismo:
    "SFProRounded-Regular": require("../assets/fonts/sf-pro-rounded.ttf"),
  });

  useEffect(() => {
    if (!fontsLoaded) return;
    // ahora que están las fuentes, ocultamos splash y mostramos el loader custom 1s
    (async () => {
      await SplashScreen.hideAsync();
      setShowLoader(true);
      setTimeout(() => setShowLoader(false), 1000);
    })();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null; // mantiene splash nativo hasta cargar fuentes
  if (showLoader) return <RunningLoader />;

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: "modal", title: "Modal" }} />
      </Stack>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
    </ThemeProvider>
  );
}
