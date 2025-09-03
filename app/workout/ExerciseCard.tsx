import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import SimpleMenu from '@/components/SimpleMenu';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Exercise } from '@/services/exerciseService';

export type WorkoutSet = { weight: string; reps: string; completed: boolean };
export type WorkoutExercise = { id: string; exercise: Exercise; sets: WorkoutSet[] };

type ExerciseCardProps = {
  item: WorkoutExercise;
  onUpdate: (next: WorkoutExercise) => void;
  onRemove: () => void;
};

export default function ExerciseCard({ item, onUpdate, onRemove }: ExerciseCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [menuVisible, setMenuVisible] = React.useState(false);
  const menuIconRef = React.useRef<View>(null);
  const [menuAnchorY, setMenuAnchorY] = React.useState<number | undefined>(undefined);

  const toTitleCase = React.useCallback((str: string) => {
    if (!str) return '';
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  }, []);

  const handleChangeSet = (index: number, key: 'weight' | 'reps' | 'completed', value: string | boolean) => {
    const nextSets = item.sets.map((s, i) => (i === index ? { ...s, [key]: value } : s));
    onUpdate({ ...item, sets: nextSets });
  };

  const addSet = () => {
    onUpdate({ ...item, sets: [...item.sets, { weight: '', reps: '', completed: false }] });
  };

  return (
    <View style={[cardStyles.cardContainer, { backgroundColor: colors.background }]}>
      <View style={cardStyles.headerRow}>
        <ThemedText style={[cardStyles.title, { color: colors.text }]}>{toTitleCase(item.exercise.name)}</ThemedText>
        <TouchableOpacity
          onPress={() => {
            menuIconRef.current?.measureInWindow((_x, y, _w, h) => {
              setMenuAnchorY(y + h + 8);
              setMenuVisible(true);
            });
          }}
          style={{ paddingHorizontal: 6, paddingVertical: 4 }}
          ref={menuIconRef as any}
        >
          <Ionicons name="ellipsis-vertical" size={20} color={colors.tint} />
        </TouchableOpacity>
        <SimpleMenu
          visible={menuVisible}
          onClose={() => setMenuVisible(false)}
          items={[{ title: 'Remove exercise', destructive: true, onPress: onRemove }]}
          anchorY={menuAnchorY}
        />
      </View>

      <View style={cardStyles.headersRow}>
        <ThemedText style={[cardStyles.headerLabel, { width: 40 }]}>SET</ThemedText>
        <ThemedText style={[cardStyles.headerLabel, { flex: 1 }]}>PREVIOUS</ThemedText>
        <ThemedText style={[cardStyles.headerLabel, { width: 90 }]}>LBS</ThemedText>
        <ThemedText style={[cardStyles.headerLabel, { width: 90 }]}>REPS</ThemedText>
        <View style={{ width: 36 }} />
      </View>

      {item.sets.map((set, idx) => (
        <View key={idx} style={cardStyles.setRow}>
          <ThemedText style={[cardStyles.setIndex, { width: 40 }]}>
            {idx + 1}
          </ThemedText>
          <ThemedText style={[cardStyles.previousText, { flex: 1 }]}>—</ThemedText>
          <TextInput
            style={[cardStyles.numInput, { width: 70 }]}
            keyboardType="numeric"
            value={set.weight}
            onChangeText={(t) => handleChangeSet(idx, 'weight', t.replace(/[^0-9.]/g, ''))}
            placeholder=""
          />
          <TextInput
            style={[cardStyles.numInput, { width: 70 }]}
            keyboardType="numeric"
            value={set.reps}
            onChangeText={(t) => handleChangeSet(idx, 'reps', t.replace(/[^0-9]/g, ''))}
            placeholder=""
          />
          <TouchableOpacity
            onPress={() => handleChangeSet(idx, 'completed', !set.completed)}
            style={[cardStyles.checkButton, { width: 36 }, set.completed && { backgroundColor: colors.tint }]}
          >
            <Ionicons name="checkmark" size={18} color={set.completed ? '#fff' : Colors[colorScheme ?? 'light'].icon} />
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity onPress={addSet} style={cardStyles.addSetButton}>
        <Text style={cardStyles.addSetText}>ADD SET</Text>
      </TouchableOpacity>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  cardContainer: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    borderColor: '#f0f0f0',
    borderWidth: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    paddingHorizontal: 16,
  },
  headerLabel: {
    color: '#9BA1A6',
    fontSize: 12,
    letterSpacing: 2,
    textAlign: 'left',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 12,
  },
  setIndex: {
    width: 50,
    color: '#1e88e5',
    fontSize: 18,
    fontWeight: '700',
  },
  previousText: {
    width: 100,
    color: '#9BA1A6',
  },
  numInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  checkButton: {
    width: 40,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2d2d2d',
  },
  addSetButton: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  addSetText: {
    color: '#1e88e5',
    fontSize: 16,
    fontWeight: '700',
  },
});


