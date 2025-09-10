import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { useWorkoutSession } from '@/context/WorkoutSessionContext';

export default function WorkoutsScreen() {
  const { isActive, start } = useWorkoutSession();
  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => {
            if (!isActive) start('Custom Workout');
            router.push('/workout/custom');
          }}
          accessibilityRole="button"
          accessibilityLabel="Start an empty workout"
        >
          <Text style={styles.primaryButtonText}>
            {isActive ? 'Resume active workout' : 'Start an empty workout'}
          </Text>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryButton: {
    backgroundColor: '#1e88e5',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
