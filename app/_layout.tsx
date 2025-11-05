import RunningLoader from "@/components/ui/RunningLoader";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { AuthProvider } from "../context/AuthContext";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [showLoader, setShowLoader] = useState(false);

  const [fontsLoaded] = useFonts({
    "SFProRounded-Semibold": require("../assets/fonts/sf-pro-rounded.ttf"),
    "SFProRounded-Regular": require("../assets/fonts/sf-pro-rounded.ttf"),
  });

  useEffect(() => {
    if (!fontsLoaded) return;

    (async () => {
      await SplashScreen.hideAsync();
      setShowLoader(true);
      setTimeout(() => setShowLoader(false), 1000);
    })();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;
  if (showLoader) return <RunningLoader />;

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: "modal", title: "Modal" }} />
        </Stack>
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      </ThemeProvider>
    </AuthProvider>
  );
}
