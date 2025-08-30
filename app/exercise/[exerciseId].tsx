import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Exercise } from '@/services/exerciseService';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';
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

  const formattedInstructions = React.useMemo(() => {
    if (!item.instructions) {
      return [];
    }
    const processed: string[] = [];
    item.instructions.forEach((instruction) => {
      if (instruction.match(/^Step:\d+/)) {
        const cleanInstruction = instruction.replace(/^Step:\d+\s*/, '');
        processed.push(cleanInstruction);
      } else if (processed.length > 0) {
        processed[processed.length - 1] += ` ${instruction}`;
      } else {
        processed.push(instruction);
      }
    });
    return processed;
  }, [item.instructions]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Stack.Screen options={{ title: toTitleCase(item.name) }} />
      <ScrollView>
        <ThemedView style={styles.container}>
          <Image source={{ uri: item.gifUrl }} style={styles.image} />
          <View style={styles.infoContainer}>
            <ThemedText type="subtitle">Instructions</ThemedText>
            {formattedInstructions.map((instruction, index) => (
              <View key={index} style={styles.instructionContainer}>
                <ThemedText style={styles.stepNumber}>{`${index + 1}.`}</ThemedText>
                <ThemedText style={styles.instructionText}>{instruction}</ThemedText>
              </View>
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
  instructionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  stepNumber: {
    fontSize: 16,
  },
  instructionText: {
    flex: 1,
    fontSize: 16,
  },
});
