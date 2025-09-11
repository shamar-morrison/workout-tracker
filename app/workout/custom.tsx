import React from 'react';

import {
  ActivityIndicator,
  Alert,
  FlatList,
  InteractionManager,
  Keyboard,
  KeyboardAvoidingView,
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

import { Image } from 'expo-image';
import { Stack, router } from 'expo-router';

import { Ionicons } from '@expo/vector-icons';

import DraggableFlatList from 'react-native-draggable-flatlist';

import CustomHeader from '@/components/CustomHeader';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { WorkoutExercise, useWorkoutSession } from '@/context/WorkoutSessionContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Exercise, fetchExercises } from '@/services/exerciseService';
import { recordCompletedWorkout } from '@/services/historyService';

import ExerciseCardItem from './ExerciseCard';

export default function CustomWorkoutScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { session, isActive, start, update, finish } = useWorkoutSession();

  // Local state for name and note is temporary until full sync
  const [name, setName] = React.useState(session.name || 'Custom Workout');
  const [note, setNote] = React.useState(session.note || '');

  // Timer state is derived from session
  const [endTime, setEndTime] = React.useState<number | null>(null);
  const [seconds, setSeconds] = React.useState(0);

  // UI state for modals/pickers
  const [editSheetVisible, setEditSheetVisible] = React.useState(false);
  const [pickerVisible, setPickerVisible] = React.useState(false);
  const [reorderMode, setReorderMode] = React.useState(false);
  const dragMapRef = React.useRef<Record<string, (() => void) | undefined>>({});
  const pendingDragIdRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!reorderMode) return;
    const id = pendingDragIdRef.current;
    if (!id) return;
    let attempts = 0;
    const tryStart = () => {
      const start = dragMapRef.current[id];
      if (start) {
        pendingDragIdRef.current = null;
        setTimeout(() => start(), 10);
      } else if (attempts < 20) {
        attempts += 1;
        setTimeout(tryStart, 30);
      }
    };
    tryStart();
  }, [reorderMode, session.exercises]);

  // Picker-related state
  const [search, setSearch] = React.useState('');
  const [pickerData, setPickerData] = React.useState<Exercise[]>([]);
  const [pickerLoading, setPickerLoading] = React.useState(false);
  const [pickerSelected, setPickerSelected] = React.useState<Set<string>>(new Set());
  const selectionOrder = React.useMemo(() => Array.from(pickerSelected), [pickerSelected]);

  // Track keyboard height to pad list so last inputs stay visible
  const [keyboardHeight, setKeyboardHeight] = React.useState(0);
  React.useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates?.height ?? 0);
      },
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Ensure a session exists and keep timer ticking from session.startTime
  React.useEffect(() => {
    if (!isActive) start(name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync local UI with session state changes
  React.useEffect(() => {
    setName(session.name || 'Custom Workout');
    setNote(session.note || '');
  }, [session.name, session.note]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      const base = endTime ?? Date.now();
      const startAt = session.startTime ?? Date.now();
      const delta = Math.max(0, Math.floor((base - startAt) / 1000));
      setSeconds(delta);
    }, 1000);
    return () => clearInterval(interval);
  }, [session.startTime, endTime]);

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
    return str.replace(
      /\w\S*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(),
    );
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
        onPress: () => {
          finish();
          router.back();
        },
      },
    ]);
  };

  const handleFinish = () => {
    // If no exercises at all
    if (session.exercises.length === 0) {
      const message = 'Please add at least one exercise before finishing.';
      if (Platform.OS === 'android') ToastAndroid.show(message, ToastAndroid.SHORT);
      else Alert.alert('Add exercises first', message);
      return;
    }

    const isValid = (s: { weight: string; reps: string }) =>
      /\d/.test((s.weight ?? '').trim()) && /\d/.test((s.reps ?? '').trim());

    const completedSets = session.exercises.reduce(
      (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
      0,
    );
    const validNotCompleted = session.exercises.reduce(
      (acc, ex) => acc + ex.sets.filter((s) => !s.completed && isValid(s)).length,
      0,
    );
    const invalidSets = session.exercises.reduce(
      (acc, ex) => acc + ex.sets.filter((s) => !s.completed && !isValid(s)).length,
      0,
    );

    // No completed or valid sets at all
    if (completedSets === 0 && validNotCompleted === 0) {
      const message = 'Complete at least one set before finishing.';
      if (Platform.OS === 'android') ToastAndroid.show(message, ToastAndroid.SHORT);
      else Alert.alert('Complete a set first', message);
      return;
    }

    const finalize = async () => {
      // Mark valid sets as complete; drop empty/invalid sets
      const cleaned = session.exercises
        .map((ex) => {
          const kept = ex.sets
            .filter((s) => s.completed || isValid(s))
            .map((s) => (s.completed ? s : { ...s, completed: true }));
          return { ...ex, sets: kept };
        })
        // Drop exercises that ended up with no valid/completed sets
        .filter((ex) => ex.sets.length > 0);

      // Build summary metrics
      const durationSec = Math.max(
        0,
        Math.floor((Date.now() - (session.startTime ?? Date.now())) / 1000),
      );
      let totalVolume = 0;
      const exercisesSummary = cleaned
        .map((ex) => {
          let best: { weight: number; reps: number } | null = null;
          let setCount = 0;
          for (const s of ex.sets) {
            const weight = parseFloat(s.weight || '0');
            const reps = parseInt(s.reps || '0', 10);
            if (weight > 0 && reps > 0) {
              totalVolume += weight * reps;
              setCount += 1;
              if (!best || weight > best.weight || (weight === best.weight && reps > best.reps)) {
                best = { weight, reps };
              }
            }
          }
          return {
            exerciseId: ex.exercise.exerciseId,
            name: ex.exercise.name,
            setCount,
            bestSet: best,
          };
        })
        // Save only exercises with at least one valid/completed set
        .filter((ex) => ex.setCount > 0);

      const { id, workoutNumber, prs } = await recordCompletedWorkout({
        name: session.name,
        completedAt: Date.now(),
        durationSec,
        totalVolume,
        exercises: exercisesSummary,
      });

      update({ exercises: cleaned });
      setEndTime(Date.now());
      finish();
      router.replace({ pathname: '/workout/summary', params: { id } });
    };

    if (validNotCompleted > 0 || invalidSets > 0) {
      const msg = `You have ${validNotCompleted + invalidSets} incomplete set${
        validNotCompleted + invalidSets === 1 ? '' : 's'
      }. Empty sets will be discarded and sets with data will be marked as complete.`;
      Alert.alert('Finish workout?', msg, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Finish', style: 'destructive', onPress: finalize },
      ]);
      return;
    }

    // Nothing to resolve; finish normally
    finalize();
  };

  const listRef = React.useRef<FlatList<any> | null>(null);
  // expose ref for child callback usage without prop-drilling through wrappers
  // (kept simple; not meant for general global usage)
  (global as any).__customWorkoutListRef = null;

  React.useEffect(() => {
    (global as any).__customWorkoutListRef = listRef.current;
    return () => {
      (global as any).__customWorkoutListRef = null;
    };
  }, []);

  const pendingRefocus = React.useRef<(() => void) | null>(null);
  const pendingTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleRefocus = React.useCallback((fn: () => void) => {
    if (pendingTimer.current) clearTimeout(pendingTimer.current);
    pendingRefocus.current = fn;
    pendingTimer.current = setTimeout(() => {
      if (pendingRefocus.current) {
        const cb = pendingRefocus.current;
        pendingRefocus.current = null;
        cb();
      }
    }, 260);
  }, []);
  const flushRefocus = React.useCallback(() => {
    if (pendingTimer.current) {
      clearTimeout(pendingTimer.current);
      pendingTimer.current = null;
    }
    if (pendingRefocus.current) {
      const cb = pendingRefocus.current;
      pendingRefocus.current = null;
      InteractionManager.runAfterInteractions(() => cb());
    }
  }, []);

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <CustomHeader
        title={session.name || name}
        showBackButton
        onBackPress={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/workouts');
          }
        }}
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
            <Ionicons
              name="time-outline"
              size={18}
              color={colors.text}
              style={{ marginRight: 8 }}
            />
            <ThemedText style={styles.timerText}>{formattedTime}</ThemedText>
          </View>

          <TextInput
            style={[styles.noteInput, { color: colors.text, borderColor: colors.icon }]}
            placeholder="Workout note"
            placeholderTextColor={colors.icon}
            value={note}
            onChangeText={(text) => {
              setNote(text);
              update({ note: text });
            }}
            multiline
          />

          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            {reorderMode ? (
              <DraggableFlatList
                contentContainerStyle={{ padding: 8, paddingBottom: 24 }}
                data={session.exercises}
                keyExtractor={(item) => item.id}
                activationDistance={12}
                onDragEnd={({ data }) => update({ exercises: data })}
                onLayout={() => {
                  const id = pendingDragIdRef.current;
                  if (id) {
                    const startDrag = dragMapRef.current[id];
                    pendingDragIdRef.current = null;
                    if (startDrag) {
                      // slight delay to ensure items are mounted
                      setTimeout(() => startDrag(), 30);
                    }
                  }
                }}
                ListHeaderComponent={() => (
                  <View style={{ paddingHorizontal: 8, paddingVertical: 6 }}>
                    <ThemedText style={{ opacity: 0.8 }}>
                      Press and hold to drag and reorder exercises.
                    </ThemedText>
                  </View>
                )}
                renderItem={({ item, drag, isActive, getIndex }) => (
                  <TouchableOpacity
                    onLayout={() => {
                      dragMapRef.current[item.id] = drag;
                      if (pendingDragIdRef.current === item.id) {
                        // Immediately start dragging for the item that triggered reorder
                        setTimeout(() => drag(), 10);
                      }
                    }}
                    onLongPress={drag}
                    activeOpacity={0.9}
                    style={{
                      minHeight: 56,
                      paddingVertical: 12,
                      paddingHorizontal: 14,
                      borderRadius: 12,
                      borderWidth: StyleSheet.hairlineWidth,
                      borderColor: colors.icon,
                      marginBottom: 10,
                      backgroundColor: isActive
                        ? colorScheme === 'dark'
                          ? 'rgba(10,126,164,0.25)'
                          : 'rgba(10,126,164,0.10)'
                        : colorScheme === 'dark'
                          ? 'rgba(255,255,255,0.02)'
                          : '#fff',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          backgroundColor: colors.tint,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ color: '#fff', fontWeight: '700' }}>
                          {(getIndex?.() ?? 0) + 1}
                        </Text>
                      </View>
                      <ThemedText
                        style={{ fontWeight: '700', maxWidth: '74%' }}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {toTitleCase(item.exercise.name)}
                      </ThemedText>
                    </View>
                    <Ionicons name="reorder-three-outline" size={22} color={colors.icon} />
                  </TouchableOpacity>
                )}
                ListFooterComponent={() => (
                  <View style={{ paddingVertical: 8 }}>
                    <TouchableOpacity
                      style={[styles.addExercise, { backgroundColor: '#607D8B' }]}
                      onPress={() => setReorderMode(false)}
                      accessibilityRole="button"
                      activeOpacity={0.8}
                    >
                      <Text style={styles.addExerciseText}>DONE REORDERING</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            ) : (
              <FlatList
                ref={(r) => {
                  listRef.current = r as any;
                  (global as any).__customWorkoutListRef = r;
                }}
                data={session.exercises}
                keyExtractor={(item) => item.id}
                keyboardDismissMode="none"
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: keyboardHeight + 24 }}
                onMomentumScrollEnd={flushRefocus}
                onScrollEndDrag={flushRefocus}
                renderItem={({ item, index }) => (
                  <Pressable
                    onLongPress={() => {
                      pendingDragIdRef.current = item.id;
                      setReorderMode(true);
                    }}
                    delayLongPress={280}
                  >
                    <ExerciseCardItem
                      item={item}
                      onInputFocus={(refocus) => {
                        const scrollRef = listRef.current as any;
                        if (!scrollRef || !scrollRef.scrollToIndex) return;
                        try {
                          const isLast = index === session.exercises.length - 1;
                          scrollRef.scrollToIndex({
                            index,
                            viewPosition: isLast ? 0 : 0.1,
                            animated: true,
                          });
                          if (refocus) scheduleRefocus(refocus);
                        } catch {
                          const current = scrollRef._scrollMetrics?.offset || 0;
                          scrollRef.scrollToOffset?.({ offset: current + 120, animated: true });
                          if (refocus) scheduleRefocus(refocus);
                        }
                      }}
                      onUpdate={(updated) => {
                        const nextExercises = session.exercises.map((ex) =>
                          ex.id === updated.id ? updated : ex,
                        );
                        update({ exercises: nextExercises });
                      }}
                      onRemove={() => {
                        const nextExercises = session.exercises.filter((ex) => ex.id !== item.id);
                        update({ exercises: nextExercises });
                      }}
                    />
                  </Pressable>
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

                    <TouchableOpacity
                      style={[styles.addExercise, { backgroundColor: '#607D8B' }]}
                      onLongPress={() => setReorderMode(true)}
                      onPress={() => setReorderMode(true)}
                      accessibilityRole="button"
                      activeOpacity={0.8}
                    >
                      <Text style={styles.addExerciseText}>REORDER EXERCISES</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            )}
          </KeyboardAvoidingView>
        </ThemedView>
      </CustomHeader>

      {/* Edit details sheet */}
      <Modal
        visible={editSheetVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditSheetVisible(false)}
      >
        <Pressable style={styles.sheetBackdrop} onPress={() => setEditSheetVisible(false)}>
          <Pressable
            style={[styles.sheet, { backgroundColor: colors.background }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.sheetTitle, { color: colors.text }]}>Edit details</Text>
            <Text style={[styles.label, { color: colors.text }]}>Name</Text>
            <TextInput
              style={[styles.textInput, { color: colors.text, borderColor: colors.icon }]}
              value={name}
              onChangeText={setName}
              onEndEditing={() => update({ name })}
              placeholder="Workout name"
              placeholderTextColor={colors.icon}
            />
            <View style={{ height: 10 }} />
            <Text style={[styles.label, { color: colors.text }]}>Start time</Text>
            <TextInput
              style={[styles.textInput, { color: colors.text, borderColor: colors.icon }]}
              value={new Date(session.startTime ?? 0).toLocaleString()}
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
                update({ startTime: Date.now() });
                setEndTime(null);
              }}
            >
              <Text style={styles.sheetButtonText}>Reset timer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sheetButton, { backgroundColor: '#0a7ea4' }]}
              onPress={() => setEditSheetVisible(false)}
            >
              <Text style={styles.sheetButtonText}>Done</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Exercise picker - full screen with search, gifs, multi-select */}
      <Modal
        visible={pickerVisible}
        animationType="slide"
        onRequestClose={() => setPickerVisible(false)}
      >
        <CustomHeader
          title="Add exercises"
          showBackButton
          onBackPress={() => setPickerVisible(false)}
          enableSearch
          searchPlaceholder="Search for an exercise..."
          initialQuery={search}
          onSearchQueryChange={setSearch}
          menuOpenOnTap
          menuItems={[
            {
              title: 'Create Exercise',
              onPress: () => router.push('/exercise/create'),
            },
          ]}
          rightTextButton={{
            label: `ADD (${pickerSelected.size})`,
            disabled: pickerSelected.size === 0,
            color: colors.tint,
            onPress: () => {
              const ids = Array.from(pickerSelected);
              const map = new Map(pickerData.map((e) => [e.exerciseId, e] as const));
              const selected = ids.map((id) => map.get(id)).filter(Boolean) as Exercise[];
              const now = Date.now();
              const newExercises: WorkoutExercise[] = selected.map((e, i) => ({
                id: `${e.exerciseId}_${now}_${i}_${Math.random().toString(36).slice(2, 6)}`,
                exercise: e,
                sets: [{ weight: '', reps: '', completed: false }],
              }));
              update({ exercises: [...session.exercises, ...newExercises] });
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
                  const rankIndex = selectionOrder.indexOf(item.exerciseId);
                  const isSelected = rankIndex !== -1;
                  const isLetter = item.gifUrl?.startsWith('letter://');
                  const letter = isLetter
                    ? item.gifUrl.replace('letter://', '').slice(0, 1) || 'X'
                    : 'X';
                  const selectedBg =
                    colorScheme === 'dark' ? 'rgba(10,126,164,0.35)' : 'rgba(10,126,164,0.12)';
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
                      style={[
                        styles.exerciseContainer,
                        isSelected && { backgroundColor: selectedBg },
                      ]}
                    >
                      <View style={styles.imageWrapper}>
                        {isSelected ? (
                          <View
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 14,
                              backgroundColor: colors.tint,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Text style={{ color: '#fff', fontWeight: '700' }}>
                              {rankIndex + 1}
                            </Text>
                          </View>
                        ) : isLetter ? (
                          <View style={styles.letterAvatar}>
                            <Text style={styles.letterText}>{letter}</Text>
                          </View>
                        ) : (
                          <Image source={{ uri: item.gifUrl }} style={styles.exerciseImage} />
                        )}
                      </View>
                      <View style={styles.exerciseDetails}>
                        <ThemedText style={styles.exerciseName}>
                          {toTitleCase(item.name)}
                        </ThemedText>
                        <ThemedText style={styles.exerciseBodyPart}>
                          {toTitleCase(item.bodyParts?.join(', ') || '')}
                        </ThemedText>
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
