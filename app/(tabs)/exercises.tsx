import { router, useFocusEffect } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import CustomHeader from '@/components/CustomHeader';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Exercise, fetchExercises } from '@/services/exerciseService';
import { Image } from 'expo-image';

const toTitleCase = (str: string) => {
  if (!str) return '';
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
};

export default function ExercisesScreen() {
  const [exercises, setExercises] = React.useState<Exercise[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isSearchActive, setIsSearchActive] = React.useState(false);
  const isKeyboardVisible = React.useRef(false);
  const searchQueryRef = React.useRef(searchQuery);
  searchQueryRef.current = searchQuery;

  const getExercises = React.useCallback(async (limit: number, query: string) => {
    setLoading(true);
    try {
      const data = await fetchExercises(limit, query);
      setExercises(data);
    } catch (error) {
      // Handle error appropriately
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      getExercises(25, searchQuery);
    }, 250); // Debounce search

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery, getExercises]);

  React.useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      isKeyboardVisible.current = true;
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      isKeyboardVisible.current = false;
    });

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        if (searchQueryRef.current === '') {
          setIsSearchActive(false);
          Keyboard.dismiss();
        }
      };
    }, [])
  );

  return (
    <>
      <CustomHeader
        title="Exercises"
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        isSearchActive={isSearchActive}
        setIsSearchActive={setIsSearchActive}
      />
      <ThemedView style={styles.container}>
        {loading ? (
          <ActivityIndicator size="large" />
        ) : (
          <Pressable
            style={{ flex: 1 }}
            onPress={() => {
              if (isKeyboardVisible.current) {
                Keyboard.dismiss();
              } else if (isSearchActive && searchQueryRef.current === '') {
                setIsSearchActive(false);
              }
            }}>
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
                  style={styles.exerciseContainer}>
                  <Image source={{ uri: item.gifUrl }} style={styles.exerciseImage} />
                  <View style={styles.exerciseDetails}>
                    <ThemedText style={styles.exerciseName}>{toTitleCase(item.name)}</ThemedText>
                    <ThemedText style={styles.exerciseBodyPart}>
                      {toTitleCase(item.bodyParts.join(', '))}
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              )}
            />
          </Pressable>
        )}
      </ThemedView>
    </>
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
