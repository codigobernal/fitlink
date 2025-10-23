import { View, Text, StyleSheet } from 'react-native';

export default function MainStep() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Paso previo (placeholder)</Text>
      <Text style={styles.subtitle}>Aquí irá tu flujo de conexión/foto.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'black' },
  title: { color: 'white', fontSize: 20, fontWeight: '700', marginBottom: 6 },
  subtitle: { color: 'white', opacity: 0.8 },
});
 