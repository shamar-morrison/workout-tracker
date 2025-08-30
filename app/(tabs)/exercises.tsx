import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Exercise, fetchExercises } from '@/services/exerciseService';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const toTitleCase = (str: string) => {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
};

export default function ExercisesScreen() {
  const [exercises, setExercises] = React.useState<Exercise[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const colorScheme = useColorScheme();
  const isInitialMount = React.useRef(true);

  const getExercises = async (limit: number, query: string) => {
    setLoading(true);
    try {
      const data = await fetchExercises(limit, query);
      setExercises(data);
    } catch (error) {
      // Handle error appropriately
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    getExercises(25, '');
  }, []);

  React.useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const handler = setTimeout(() => {
      getExercises(25, search);
    }, 500); // Debounce search

    return () => {
      clearTimeout(handler);
    };
  }, [search]);

  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>
          Exercises
        </ThemedText>
        <View style={styles.searchContainer}>
          <IconSymbol
            name="magnifyingglass"
            size={20}
            color={Colors[colorScheme ?? 'light'].text}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchBar, { color: Colors[colorScheme ?? 'light'].text }]}
            placeholder="Search for an exercise..."
            placeholderTextColor={Colors[colorScheme ?? 'light'].text}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <IconSymbol name="xmark.circle.fill" size={20} color="#888" />
            </TouchableOpacity>
          ) : null}
        </View>
        {loading ? (
          <ActivityIndicator size="large" />
        ) : (
          <FlatList
            data={exercises}
            keyExtractor={(item) => item.exerciseId}
            renderItem={({ item }) => (
              <Link
                href={{
                  pathname: '/exercise/[exerciseId]',
                  params: { ...item },
                }}
                asChild>
                <TouchableOpacity style={styles.exerciseContainer}>
                  <Image source={{ uri: item.gifUrl }} style={styles.exerciseImage} />
                  <View style={styles.exerciseDetails}>
                    <ThemedText style={styles.exerciseName}>{toTitleCase(item.name)}</ThemedText>
                    <ThemedText style={styles.exerciseBodyPart}>
                      {toTitleCase(item.bodyParts.join(', '))}
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              </Link>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchBar: {
    flex: 1,
    height: 40,
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
