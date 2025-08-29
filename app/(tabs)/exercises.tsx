import React from 'react';
import { ActivityIndicator, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Exercise, fetchExercises } from '@/services/exerciseService';

export default function ExercisesScreen() {
  const [exercises, setExercises] = React.useState<Exercise[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const getExercises = async () => {
      try {
        const data = await fetchExercises();
        setExercises(data);
      } catch (error) {
        // Handle error appropriately, e.g., show a message to the user
      } finally {
        setLoading(false);
      }
    };

    getExercises();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>
          Exercises
        </ThemedText>
        {loading ? (
          <ActivityIndicator size="large" />
        ) : (
          <FlatList
            data={exercises}
            keyExtractor={(item) => item.exerciseId}
            renderItem={({ item }) => (
              <ThemedView style={styles.exerciseContainer}>
                <ThemedText type="subtitle">{item.name}</ThemedText>
                <ThemedText>Target: {item.targetMuscles.join(', ')}</ThemedText>
                <ThemedText>Equipment: {item.equipments.join(', ')}</ThemedText>
              </ThemedView>
            )}
          />
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    padding: 16,
  },
  exerciseContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    gap: 8,
  },
});
