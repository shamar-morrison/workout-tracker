import { Image } from 'expo-image';
import React from 'react';
import { ActivityIndicator, FlatList, StyleSheet } from 'react-native';

import ParallaxScrollView from '@/components/ParallaxScrollView';
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
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Exercises</ThemedText>
      </ThemedView>
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
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  exerciseContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    gap: 8,
  },
});
