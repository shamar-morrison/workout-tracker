import { StyleSheet } from 'react-native';

import { ThemedView } from '@/components/ThemedView';

export default function WorkoutsScreen() {
  return <ThemedView style={styles.container}></ThemedView>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
