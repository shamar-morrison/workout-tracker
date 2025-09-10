import React from 'react';

import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Image } from 'expo-image';
import { router } from 'expo-router';

import CustomHeader from '@/components/CustomHeader';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Exercise, fetchExercises } from '@/services/exerciseService';

const toTitleCase = (str: string) => {
  if (!str) return '';
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
};

function ExerciseAvatar({ exercise }: { exercise: Exercise }) {
  if (exercise.gifUrl?.startsWith('letter://')) {
    const letter = exercise.gifUrl.replace('letter://', '').slice(0, 1) || 'X';
    return (
      <View style={styles.letterAvatar}>
        <Text style={styles.letterText}>{letter}</Text>
      </View>
    );
  }
  return <Image source={{ uri: exercise.gifUrl }} style={styles.exerciseImage} />;
}

export default function ExercisesScreen() {
  const [exercises, setExercises] = React.useState<Exercise[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');

  const getExercises = React.useCallback(async (limit: number, query: string) => {
    setLoading(true);
    try {
      const data = await fetchExercises(limit, query);
      setExercises(data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      getExercises(25, searchQuery);
    }, 250);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery, getExercises]);

  return (
    <CustomHeader
      title="Exercises"
      enableSearch
      searchPlaceholder="Search for an exercise..."
      initialQuery={searchQuery}
      onSearchQueryChange={setSearchQuery}
      menuOpenOnTap
      menuItems={[
        {
          title: 'Create Exercise',
          onPress: () => router.push('/exercise/create'),
        },
      ]}
    >
      <ThemedView style={styles.container}>
        {loading ? (
          <ActivityIndicator size="large" />
        ) : (
          <View style={{ flex: 1 }}>
            <FlatList
              keyboardDismissMode="on-drag"
              keyboardShouldPersistTaps="handled"
              data={exercises}
              keyExtractor={(item) => item.exerciseId}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    Keyboard.dismiss();
                    router.push({
                      pathname: '/exercise/[exerciseId]',
                      params: { ...item },
                    });
                  }}
                  style={styles.exerciseContainer}
                >
                  <ExerciseAvatar exercise={item} />
                  <View style={styles.exerciseDetails}>
                    <ThemedText style={styles.exerciseName}>{toTitleCase(item.name)}</ThemedText>
                    <ThemedText style={styles.exerciseBodyPart}>
                      {toTitleCase(item.bodyParts.join(', '))}
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      </ThemedView>
    </CustomHeader>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  exerciseContainer: {
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#2d2d2d',
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseImage: {
    width: 50,
    height: 50,
    marginRight: 16,
    borderRadius: 8,
  },
  letterAvatar: {
    width: 50,
    height: 50,
    marginRight: 16,
    borderRadius: 8,
    backgroundColor: '#0a7ea4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  exerciseDetails: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  exerciseBodyPart: {
    fontSize: 14,
    color: '#888',
  },
});
