import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import React from 'react';
import {
    Alert,
    FlatList,
    Keyboard,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import CustomHeader from '@/components/CustomHeader';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Exercise, fetchExercises } from '@/services/exerciseService';

type WorkoutExercise = {
  exercise: Exercise;
};

export default function CustomWorkoutScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [name, setName] = React.useState('Custom Workout');
  const [startTime, setStartTime] = React.useState<number>(() => Date.now());
  const [endTime, setEndTime] = React.useState<number | null>(null);
  const [note, setNote] = React.useState('');
  const [seconds, setSeconds] = React.useState(0);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [editSheetVisible, setEditSheetVisible] = React.useState(false);
  const [exercises, setExercises] = React.useState<WorkoutExercise[]>([]);
  const [pickerVisible, setPickerVisible] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [pickerData, setPickerData] = React.useState<Exercise[]>([]);
  const [pickerLoading, setPickerLoading] = React.useState(false);

  React.useEffect(() => {
    const interval = setInterval(() => {
      const base = endTime ?? Date.now();
      const delta = Math.max(0, Math.floor((base - startTime) / 1000));
      setSeconds(delta);
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, endTime]);

  React.useEffect(() => {
    if (!pickerVisible) return;
    setPickerLoading(true);
    fetchExercises(25, search)
      .then(setPickerData)
      .finally(() => setPickerLoading(false));
  }, [pickerVisible, search]);

  const formattedTime = React.useMemo(() => {
    const h = Math.floor(seconds / 3600)
      .toString()
      .padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60)
      .toString()
      .padStart(2, '0');
    const s = Math.floor(seconds % 60)
      .toString()
      .padStart(2, '0');
    return `${h !== '00' ? h + ':' : ''}${m}:${s}`;
  }, [seconds]);

  const handleCancel = () => {
    Alert.alert('Cancel workout?', 'This will discard the current workout.', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Cancel workout',
        style: 'destructive',
        onPress: () => router.back(),
      },
    ]);
  };

  const handleFinish = () => {
    // For now, simply end and go back. In a real app, persist data.
    setEndTime(Date.now());
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <CustomHeader
        title={name}
        showBackButton
        rightTextButton={{ label: 'FINISH', onPress: handleFinish }}
        menuOpenOnTap
        menuItems={[
          {
            title: 'Edit workout details',
            onPress: () => setEditSheetVisible(true),
          },
        ]}
      >
        <ThemedView style={styles.inner}>
          <View style={styles.timerRow}>
            <Ionicons name="time-outline" size={18} color={colors.text} style={{ marginRight: 8 }} />
            <ThemedText style={styles.timerText}>{formattedTime}</ThemedText>
          </View>

          <TextInput
            style={[styles.noteInput, { color: colors.text, borderColor: colors.icon }]}
            placeholder="Workout note"
            placeholderTextColor={colors.icon}
            value={note}
            onChangeText={setNote}
            multiline
          />

          <TouchableOpacity style={styles.addExercise} onPress={() => setPickerVisible(true)}>
            <Text style={styles.addExerciseText}>ADD EXERCISE</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelWorkout} onPress={handleCancel}>
            <Text style={styles.cancelWorkoutText}>CANCEL WORKOUT</Text>
          </TouchableOpacity>

          <FlatList
            data={exercises}
            keyExtractor={(item) => item.exercise.exerciseId}
            renderItem={({ item }) => (
              <View style={styles.exerciseRow}>
                <ThemedText style={styles.exerciseName}>{item.exercise.name}</ThemedText>
              </View>
            )}
          />
        </ThemedView>
      </CustomHeader>

      {/* Edit details sheet */}
      <Modal visible={editSheetVisible} transparent animationType="slide" onRequestClose={() => setEditSheetVisible(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setEditSheetVisible(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>Edit details</Text>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={[styles.textInput, { color: colors.text, borderColor: colors.icon }]}
              value={name}
              onChangeText={setName}
              placeholder="Workout name"
              placeholderTextColor={colors.icon}
            />
            <View style={{ height: 10 }} />
            <Text style={styles.label}>Start time</Text>
            <TextInput
              style={[styles.textInput, { color: colors.text, borderColor: colors.icon }]}
              value={new Date(startTime).toLocaleString()}
              onFocus={() => Keyboard.dismiss()}
              editable={false}
            />
            <View style={{ height: 10 }} />
            <Text style={styles.label}>End time</Text>
            <TextInput
              style={[styles.textInput, { color: colors.text, borderColor: colors.icon }]}
              value={endTime ? new Date(endTime).toLocaleString() : 'Not set'}
              onFocus={() => Keyboard.dismiss()}
              editable={false}
            />
            <View style={{ height: 16 }} />
            <TouchableOpacity
              style={styles.sheetButton}
              onPress={() => {
                setStartTime(Date.now());
                setEndTime(null);
              }}
            >
              <Text style={styles.sheetButtonText}>Reset timer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.sheetButton, { backgroundColor: '#0a7ea4' }]} onPress={() => setEditSheetVisible(false)}>
              <Text style={styles.sheetButtonText}>Done</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Exercise picker */}
      <Modal visible={pickerVisible} transparent animationType="slide" onRequestClose={() => setPickerVisible(false)}>
        <View style={styles.pickerBackdrop}>
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHeader}>
              <TextInput
                style={[styles.searchInput, { color: colors.text, borderColor: colors.icon }]}
                placeholder="Search for an exercise..."
                placeholderTextColor={colors.icon}
                value={search}
                onChangeText={setSearch}
                autoFocus
              />
              <TouchableOpacity onPress={() => setPickerVisible(false)}>
                <Text style={{ color: '#8a8a8a', fontSize: 16 }}>Close</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              keyboardDismissMode="on-drag"
              keyboardShouldPersistTaps="handled"
              data={pickerData}
              ListEmptyComponent={() => (
                <View style={{ padding: 20 }}>
                  <Text style={{ color: '#8a8a8a' }}>{pickerLoading ? 'Loading…' : 'No results'}</Text>
                </View>
              )}
              keyExtractor={(item) => item.exerciseId}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerRow}
                  onPress={() => {
                    setExercises((prev) => [{ exercise: item }, ...prev]);
                    setPickerVisible(false);
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 16 }}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    padding: 16,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timerText: {
    fontSize: 18,
    fontWeight: '600',
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
    marginBottom: 20,
  },
  addExercise: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  addExerciseText: {
    color: '#1e88e5',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelWorkout: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  cancelWorkoutText: {
    color: '#c62828',
    fontSize: 16,
    fontWeight: '600',
  },
  exerciseRow: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2d2d2d',
  },
  exerciseName: {
    fontSize: 16,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1e1e1e',
    padding: 16,
    maxHeight: '70%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  sheetTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  label: {
    color: '#fff',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sheetButton: {
    marginTop: 10,
    backgroundColor: '#2e7d32',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  sheetButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  pickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: '#1e1e1e',
    maxHeight: '80%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  pickerHeader: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pickerRow: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2d2d2d',
  },
});


