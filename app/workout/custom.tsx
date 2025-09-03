import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';

import CustomHeader from '@/components/CustomHeader';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Exercise, fetchExercises } from '@/services/exerciseService';
import ExerciseCardItem, { WorkoutExercise } from './ExerciseCard';

// Types moved to ExerciseCard.tsx and re-imported

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
  const [pickerSelected, setPickerSelected] = React.useState<Set<string>>(new Set());

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
    let cancelled = false;
    setPickerLoading(true);
    fetchExercises(25, search)
      .then((data) => {
        if (!cancelled) setPickerData(data);
      })
      .finally(() => {
        if (!cancelled) setPickerLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pickerVisible, search]);

  const toTitleCase = React.useCallback((str: string) => {
    if (!str) return '';
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  }, []);

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
    if (exercises.length === 0) {
      const message = 'Please add at least one exercise before finishing.';
      if (Platform.OS === 'android') {
        ToastAndroid.show(message, ToastAndroid.SHORT);
      } else {
        Alert.alert('Add at least one exercise', message);
      }
      return;
    }
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

          <FlatList
            data={exercises}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ExerciseCardItem
                item={item}
                onUpdate={(updated) => {
                  setExercises((prev) => prev.map((ex) => (ex.id === updated.id ? updated : ex)));
                }}
                onRemove={() => setExercises((prev) => prev.filter((ex) => ex.id !== item.id))}
              />
            )}
            ListFooterComponent={() => (
              <View style={{ paddingVertical: 8 }}>
                <TouchableOpacity
                  style={styles.addExercise}
                  onPress={() => setPickerVisible(true)}
                  accessibilityRole="button"
                  activeOpacity={0.8}
                >
                  <Text style={styles.addExerciseText}>ADD EXERCISE</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelWorkout}
                  onPress={handleCancel}
                  accessibilityRole="button"
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelWorkoutText}>CANCEL WORKOUT</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </ThemedView>
      </CustomHeader>

      {/* Edit details sheet */}
      <Modal visible={editSheetVisible} transparent animationType="slide" onRequestClose={() => setEditSheetVisible(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setEditSheetVisible(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.background }]} onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>Edit details</Text>
            <Text style={[styles.label, { color: colors.text }]}>Name</Text>
            <TextInput
              style={[styles.textInput, { color: colors.text, borderColor: colors.icon }]}
              value={name}
              onChangeText={setName}
              placeholder="Workout name"
              placeholderTextColor={colors.icon}
            />
            <View style={{ height: 10 }} />
            <Text style={[styles.label, { color: colors.text }]}>Start time</Text>
            <TextInput
              style={[styles.textInput, { color: colors.text, borderColor: colors.icon }]}
              value={new Date(startTime).toLocaleString()}
              onFocus={() => Keyboard.dismiss()}
              editable={false}
            />
            <View style={{ height: 10 }} />
            <Text style={[styles.label, { color: colors.text }]}>End time</Text>
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

      {/* Exercise picker - full screen with search, gifs, multi-select */}
      <Modal visible={pickerVisible} animationType="slide" onRequestClose={() => setPickerVisible(false)}>
        <CustomHeader
          title="Add exercises"
          showBackButton
          onBackPress={() => setPickerVisible(false)}
          enableSearch
          searchPlaceholder="Search for an exercise..."
          initialQuery={search}
          onSearchQueryChange={setSearch}
          menuOpenOnTap
          menuItems={[{
            title: 'Create Exercise',
            onPress: () => router.push('/exercise/create'),
          }]}
          rightTextButton={{
            label: `ADD (${pickerSelected.size})`,
            disabled: pickerSelected.size === 0,
            color: colors.tint,
            onPress: () => {
              const selected = pickerData.filter((e) => pickerSelected.has(e.exerciseId));
              const now = Date.now();
              setExercises((prev) => [
                ...selected.map((e, i) => ({
                  id: `${e.exerciseId}_${now}_${i}_${Math.random().toString(36).slice(2, 6)}`,
                  exercise: e,
                  sets: [{ weight: '', reps: '', completed: false }],
                })),
                ...prev,
              ]);
              setPickerSelected(new Set());
              setPickerVisible(false);
            },
          }}
        >
          <ThemedView style={styles.container}>
            {pickerLoading ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color={colors.tint} />
              </View>
            ) : (
              <FlatList
                keyboardDismissMode="on-drag"
                keyboardShouldPersistTaps="handled"
                data={pickerData}
                keyExtractor={(item) => item.exerciseId}
                renderItem={({ item }) => {
                  const isSelected = pickerSelected.has(item.exerciseId);
                  const isLetter = item.gifUrl?.startsWith('letter://');
                  const letter = isLetter ? item.gifUrl.replace('letter://', '').slice(0, 1) || 'X' : 'X';
                  const selectedBg = (colorScheme === 'dark') ? 'rgba(10,126,164,0.35)' : 'rgba(10,126,164,0.12)';
                  return (
                    <TouchableOpacity
                      onPress={() => {
                        setPickerSelected((prev) => {
                          const next = new Set(prev);
                          if (next.has(item.exerciseId)) next.delete(item.exerciseId);
                          else next.add(item.exerciseId);
                          return next;
                        });
                      }}
                      style={[styles.exerciseContainer, isSelected && { backgroundColor: selectedBg }]}
                    >
                      <View style={styles.imageWrapper}>
                        {isSelected ? (
                          <Ionicons name="checkmark" size={28} color={colors.tint} />
                        ) : isLetter ? (
                          <View style={styles.letterAvatar}>
                            <Text style={styles.letterText}>{letter}</Text>
                          </View>
                        ) : (
                          <Image source={{ uri: item.gifUrl }} style={styles.exerciseImage} />
                        )}
                      </View>
                      <View style={styles.exerciseDetails}>
                        <ThemedText style={styles.exerciseName}>{toTitleCase(item.name)}</ThemedText>
                        <ThemedText style={styles.exerciseBodyPart}>{toTitleCase(item.bodyParts?.join(', ') || '')}</ThemedText>
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </ThemedView>
        </CustomHeader>
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
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#1e88e5',
    borderRadius: 10,
    minWidth: 220,
    alignItems: 'center',
  },
  addExerciseText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.25,
  },
  cancelWorkout: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 20,
    backgroundColor: '#c62828',
    borderRadius: 10,
    minWidth: 220,
    alignItems: 'center',
  },
  cancelWorkoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.25,
  },
  exerciseRow: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2d2d2d',
  },
  exerciseContainer: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2d2d2d',
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageWrapper: {
    width: 50,
    height: 50,
    marginRight: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  exerciseImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  letterAvatar: {
    width: 50,
    height: 50,
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
  exerciseName: {
    fontSize: 16,
    fontWeight: '700',
  },
  exerciseBodyPart: {
    fontSize: 14,
    color: '#888',
  },
  exerciseDetails: {
    flex: 1,
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


