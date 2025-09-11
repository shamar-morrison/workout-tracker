import React from 'react';

import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';

import { router } from 'expo-router';

import { Ionicons } from '@expo/vector-icons';

import CustomHeader from '@/components/CustomHeader';
import MultiSelectModal from '@/components/MultiSelectModal';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Exercise, saveLocalExercise } from '@/services/exerciseService';

const MUSCLE_OPTIONS = [
  'Chest',
  'Legs',
  'Arms',
  'Biceps',
  'Triceps',
  'Forearms',
  'Shoulders',
  'Lats',
  'Lower back',
  'Upper back',
  'Middle back',
  'Core',
  'Glutes',
  'Calves',
  'Full body',
  'Other',
];

export default function CreateExerciseScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [name, setName] = React.useState('');
  const [targetModalVisible, setTargetModalVisible] = React.useState(false);
  const [secondaryModalVisible, setSecondaryModalVisible] = React.useState(false);

  const [target, setTarget] = React.useState<string | null>(null);
  const [secondary, setSecondary] = React.useState<string[]>([]);
  const [iosToastVisible, setIosToastVisible] = React.useState(false);

  const saveDisabled = !name.trim();

  const handleSave = async () => {
    if (saveDisabled) return;
    const id = `local_${Date.now()}`;
    const letter = name.trim().charAt(0).toUpperCase() || 'X';
    const placeholder = `letter://${letter}`;
    const exercise: Exercise = {
      exerciseId: id,
      name: name.trim(),
      gifUrl: placeholder,
      targetMuscles: target ? [target] : [],
      bodyParts: target ? [target] : [],
      equipments: [],
      secondaryMuscles: secondary,
      instructions: [],
    };
    try {
      await saveLocalExercise(exercise);
      if (Platform.OS === 'android') {
        ToastAndroid.show('Exercise saved', ToastAndroid.SHORT);
        router.back();
      } else {
        setIosToastVisible(true);
        setTimeout(() => {
          setIosToastVisible(false);
          router.back();
        }, 1200);
      }
    } catch (e) {
      if (Platform.OS === 'android') {
        ToastAndroid.show('Failed to save exercise', ToastAndroid.SHORT);
      } else {
        Alert.alert('Error', 'Failed to save exercise');
      }
    }
  };

  return (
    <CustomHeader title="New exercise" showBackButton>
      <ThemedView style={styles.container}>
        <View style={styles.formGroup}>
          <TextInput
            placeholder="Add Name"
            placeholderTextColor={colors.icon}
            value={name}
            onChangeText={setName}
            style={[
              styles.input,
              { color: colors.text, borderColor: colors.icon, backgroundColor: colors.background },
            ]}
          />
        </View>

        <TouchableOpacity style={styles.row} onPress={() => setTargetModalVisible(true)}>
          <Text style={[styles.label, { color: colors.text }]}>Target muscle</Text>
          <Text style={[styles.value, { color: colors.icon }]}>{target ?? 'None'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.row} onPress={() => setSecondaryModalVisible(true)}>
          <Text style={[styles.label, { color: colors.text }]}>Secondary muscles</Text>
          <Text style={[styles.value, { color: colors.icon }]}>
            {secondary.length > 0 ? secondary.join(', ') : 'None'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.tint, opacity: saveDisabled ? 0.6 : 1 }]}
          onPress={handleSave}
        >
          <Ionicons name="checkmark" size={28} color={colorScheme === 'dark' ? '#fff' : '#fff'} />
        </TouchableOpacity>

        {iosToastVisible ? (
          <View style={styles.toast}>
            <Text style={styles.toastText}>Exercise saved</Text>
          </View>
        ) : null}
      </ThemedView>

      <MultiSelectModal
        visible={targetModalVisible}
        onClose={() => setTargetModalVisible(false)}
        items={MUSCLE_OPTIONS}
        selected={target ? [target] : []}
        onConfirm={(vals) => setTarget(vals[0] ?? null)}
        title="Target muscle"
        okText="OK"
        cancelText="Cancel"
        single
        includeNoneOption
        noneLabel="None"
      />

      <MultiSelectModal
        visible={secondaryModalVisible}
        onClose={() => setSecondaryModalVisible(false)}
        items={MUSCLE_OPTIONS}
        selected={secondary}
        onConfirm={(vals) => setSecondary(vals)}
        title="Secondary muscles"
        okText="OK"
        cancelText="Cancel"
      />
    </CustomHeader>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  row: {
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2d2d2d',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
  },
  value: {
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toast: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  toastText: {
    backgroundColor: 'rgba(0,0,0,0.9)',
    color: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
});
