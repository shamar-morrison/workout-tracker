import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Exercise } from '@/services/exerciseService';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const toTitleCase = (str: string) => {
  if (!str) return '';
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
};

export default function ExerciseDetailScreen() {
  const params = useLocalSearchParams();

  const item: Exercise = {
    exerciseId: params.exerciseId as string,
    name: params.name as string,
    gifUrl: params.gifUrl as string,
    targetMuscles: (params.targetMuscles as string)?.split(',') || [],
    bodyParts: (params.bodyParts as string)?.split(',') || [],
    equipments: (params.equipments as string)?.split(',') || [],
    secondaryMuscles: (params.secondaryMuscles as string)?.split(',') || [],
    instructions: (params.instructions as string)?.split(',') || [],
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Stack.Screen options={{ title: toTitleCase(item.name) }} />
      <ScrollView>
        <ThemedView style={styles.container}>
          <Image source={{ uri: item.gifUrl }} style={styles.image} />
          <View style={styles.infoContainer}>
            <ThemedText type="subtitle">Instructions</ThemedText>
            {item.instructions?.map((instruction, index) => (
              <ThemedText key={index} style={styles.instruction}>
                {`${index + 1}. ${instruction}`}
              </ThemedText>
            ))}
          </View>
          <View style={styles.infoContainer}>
            <ThemedText type="subtitle">Target Muscles</ThemedText>
            <ThemedText>{item.targetMuscles?.join(', ')}</ThemedText>
          </View>
          <View style={styles.infoContainer}>
            <ThemedText type="subtitle">Secondary Muscles</ThemedText>
            <ThemedText>{item.secondaryMuscles?.join(', ')}</ThemedText>
          </View>
          <View style={styles.infoContainer}>
            <ThemedText type="subtitle">Equipment</ThemedText>
            <ThemedText>{item.equipments?.join(', ')}</ThemedText>
          </View>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
    gap: 16,
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 8,
  },
  infoContainer: {
    gap: 8,
  },
  instruction: {
    fontSize: 16,
  },
});
