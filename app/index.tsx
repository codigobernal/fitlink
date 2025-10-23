import { Redirect } from 'expo-router';

// TODO: Reemplazar por lógica real de autenticación.
export default function Index() {
  const isLoggedIn = false;
  return <Redirect href={isLoggedIn ? '(tabs)' : '(auth)'} />;
}

