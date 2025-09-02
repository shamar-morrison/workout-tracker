import { StyleSheet } from 'react-native';

import { ThemedView } from '@/components/ThemedView';

export default function HistoryScreen() {
  return <ThemedView style={styles.container}></ThemedView>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
