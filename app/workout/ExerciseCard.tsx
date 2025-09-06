import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { ActivityIndicator, Alert, Animated, FlatList, Modal, Platform, StyleSheet, Text, TextInput, ToastAndroid, TouchableOpacity, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

import SimpleMenu from '@/components/SimpleMenu';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

import CustomHeader from '@/components/CustomHeader';
import { WorkoutExercise } from '@/context/WorkoutSessionContext';
import { Exercise, fetchExercises } from '@/services/exerciseService';

type ExerciseCardProps = {
  item: WorkoutExercise;
  onUpdate: (next: WorkoutExercise) => void;
  onRemove: () => void;
  onInputFocus?: (refocus: () => void) => void;
};

export default function ExerciseCard({ item, onUpdate, onRemove, onInputFocus }: ExerciseCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [menuVisible, setMenuVisible] = React.useState(false);
  const menuIconRef = React.useRef<View>(null);
  const [menuAnchorY, setMenuAnchorY] = React.useState<number | undefined>(undefined);
  const shakeMapRef = React.useRef<Record<number, Animated.Value>>({});

  // Replace exercise modal state
  const [replaceVisible, setReplaceVisible] = React.useState(false);
  const [replaceSearch, setReplaceSearch] = React.useState('');
  const [replaceLoading, setReplaceLoading] = React.useState(false);
  const [replaceData, setReplaceData] = React.useState<Exercise[]>([]);
  const [replaceSelected, setReplaceSelected] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!replaceVisible) return;
    let cancelled = false;
    setReplaceLoading(true);
    fetchExercises(25, replaceSearch)
      .then((data) => { if (!cancelled) setReplaceData(data); })
      .finally(() => { if (!cancelled) setReplaceLoading(false); });
    return () => { cancelled = true; };
  }, [replaceVisible, replaceSearch]);

  const toTitleCase = React.useCallback((str: string) => {
    if (!str) return '';
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  }, []);

  const LB_PER_KG = 2.20462;
  const handleChangeSet = (index: number, key: 'weight' | 'reps' | 'completed', value: string | boolean) => {
    const nextSets = item.sets.map((s, i) => {
      if (i !== index) return s;
      if (key === 'weight') {
        const text = (value as string) ?? '';
        const parsed = parseFloat(text.replace(',', '.'));
        const weightLbs = isFinite(parsed) ? (item.weightUnit === 'kg' ? parsed * LB_PER_KG : parsed) : undefined;
        return { ...s, weight: text, weightLbs };
      }
      return { ...s, [key]: value } as any;
    });
    onUpdate({ ...item, sets: nextSets });
  };

  const addSet = () => {
    onUpdate({ ...item, sets: [...item.sets, { weight: '', reps: '', completed: false }] });
  };

  const hasData = React.useMemo(() => {
    return item.sets.some((s) => {
      const weightHas = /\d/.test((s.weight ?? '').trim());
      const repsHas = /\d/.test((s.reps ?? '').trim());
      const completedHas = !!s.completed;
      return weightHas || repsHas || completedHas;
    });
  }, [item.sets]);

  const formatFromLbs = React.useCallback((lbs: number, toUnit: 'lbs' | 'kg') => {
    const val = toUnit === 'kg' ? lbs / LB_PER_KG : lbs;
    const rounded = Math.round(val * 10) / 10; // display to 0.1
    return rounded.toFixed(1).replace(/\.0$/, '');
  }, []);

  const handleToggleUnit = React.useCallback(() => {
    const nextUnit: 'lbs' | 'kg' = item.weightUnit === 'kg' ? 'lbs' : 'kg';
    setMenuVisible(false);
    // If there are no positive numeric weights entered, just switch units silently
    const hasPositiveWeight = item.sets.some((s) => {
      const v = parseFloat((s.weight || '').replace(',', '.'));
      return isFinite(v) && v > 0;
    });
    if (!hasPositiveWeight) {
      onUpdate({ ...item, weightUnit: nextUnit });
      return;
    }
    const parseToLbsFromCurrentUnit = (str: string) => {
      const v = parseFloat((str || '').replace(',', '.'));
      if (!isFinite(v)) return undefined;
      return (item.weightUnit === 'kg' ? v * LB_PER_KG : v);
    };
    const convertAndUpdate = () => {
      const nextSets = item.sets.map((s) => {
        const lbs = s.weightLbs ?? parseToLbsFromCurrentUnit(s.weight);
        if (typeof lbs !== 'number') return s;
        return { ...s, weight: formatFromLbs(lbs, nextUnit), weightLbs: lbs };
      });
      onUpdate({ ...item, weightUnit: nextUnit, sets: nextSets });
    };
    const justSwitch = () => {
      const nextSets = item.sets.map((s) => {
        const v = parseFloat((s.weight || '').replace(',', '.'));
        if (!isFinite(v)) return { ...s };
        const lbs = nextUnit === 'kg' ? v * LB_PER_KG : v;
        return { ...s, weightLbs: lbs };
      });
      onUpdate({ ...item, weightUnit: nextUnit, sets: nextSets });
    };

    Alert.alert(
      'Change weight unit',
      `Switch this exercise to ${nextUnit.toUpperCase()}? You can also convert existing weights.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Just switch', onPress: justSwitch },
        { text: 'Convert values', onPress: convertAndUpdate },
      ]
    );
  }, [item, onUpdate, formatFromLbs]);

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
          items={[
            {
              title: `Use ${item.weightUnit === 'kg' ? 'LBS (Pounds)' : 'KG (Kilograms)'}`,
              onPress: handleToggleUnit,
            },
            {
              title: 'Replace exercise',
              onPress: () => {
                setMenuVisible(false);
                setReplaceVisible(true);
              },
            },
            {
              title: 'Remove exercise',
              destructive: hasData,
              onPress: onRemove,
              confirmTitle: hasData ? 'Remove exercise?' : undefined,
              confirmMessage: hasData ? 'This will delete any recorded sets for this exercise.' : undefined,
              confirmConfirmText: hasData ? 'Remove' : undefined,
              confirmCancelText: hasData ? 'Cancel' : undefined,
            },
          ]}
          anchorY={menuAnchorY}
        />
      </View>

      <View style={cardStyles.headersRow}>
        <ThemedText numberOfLines={1} style={[cardStyles.headerLabel, { width: 40 }]}>SET</ThemedText>
        <ThemedText numberOfLines={1} style={[cardStyles.headerLabel, { flex: 1 }]}>PREVIOUS</ThemedText>
        <ThemedText numberOfLines={1} style={[cardStyles.headerLabel, { width: 70 }]}>{(item.weightUnit || 'lbs').toUpperCase()}</ThemedText>
        <ThemedText numberOfLines={1} style={[cardStyles.headerLabel, { width: 70 }]}>REPS</ThemedText>
        <View style={{ width: 36 }} />
      </View>

      {item.sets.map((set, idx) => (
        <Swipeable
          key={idx}
          renderRightActions={(progress, dragX) => {
            const translateX = dragX.interpolate({ inputRange: [-100, 0], outputRange: [0, 80], extrapolate: 'clamp' });
            return (
              <Animated.View style={[cardStyles.deleteAction, { transform: [{ translateX }] }]}> 
                <Ionicons name="trash" size={22} color="#fff" />
              </Animated.View>
            );
          }}
          onSwipeableRightOpen={() => {
            const next = item.sets.filter((_, i) => i !== idx);
            onUpdate({ ...item, sets: next });
          }}
        >
        <View style={cardStyles.setRow}>
          <ThemedText style={[cardStyles.setIndex, { width: 40 }]}>
            {idx + 1}
          </ThemedText>
          <ThemedText style={[cardStyles.previousText, { flex: 1 }]}>—</ThemedText>
          {(() => {
            let weightInput: any = null;
            let repsInput: any = null;
            return (
              <>
          <TextInput
            ref={(r) => { weightInput = r; }}
            style={[cardStyles.numInput, { width: 70, borderColor: Colors[colorScheme ?? 'light'].icon, color: colors.text }]}
            keyboardType="numeric"
            value={set.weight}
            onChangeText={(t) => handleChangeSet(idx, 'weight', t.replace(/[^0-9.]/g, ''))}
            placeholder=""
            onFocus={() => { onInputFocus && onInputFocus(() => weightInput?.focus()); }}
          />
          <TextInput
            ref={(r) => { repsInput = r; }}
            style={[cardStyles.numInput, { width: 70, borderColor: Colors[colorScheme ?? 'light'].icon, color: colors.text }]}
            keyboardType="numeric"
            value={set.reps}
            onChangeText={(t) => handleChangeSet(idx, 'reps', t.replace(/[^0-9]/g, ''))}
            placeholder=""
            onFocus={() => { onInputFocus && onInputFocus(() => repsInput?.focus()); }}
          />
              </>
            );
          })()}
          {(() => {
            // Shake animation per-row
            const shakeRef = (shakeMapRef.current[idx] ||= new Animated.Value(0));
            const translateX = shakeRef.interpolate({ inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1], outputRange: [0, -6, 6, -4, 4, 0] });
            const triggerShake = () => {
              shakeRef.setValue(0);
              Animated.timing(shakeRef, { toValue: 1, duration: 400, useNativeDriver: true }).start();
            };
            return (
              <Animated.View style={{ transform: [{ translateX }], width: 36 }}>
                <TouchableOpacity
                  onPress={() => {
                    const hasWeight = /\d/.test((set.weight ?? '').trim());
                    const hasReps = /\d/.test((set.reps ?? '').trim());
                    if (!set.completed && (!hasWeight || !hasReps)) {
                      if (Platform.OS === 'android') {
                        ToastAndroid.show('Enter weight and reps', ToastAndroid.SHORT);
                      } else {
                        triggerShake();
                      }
                      return;
                    }
                    handleChangeSet(idx, 'completed', !set.completed);
                  }}
                  style={[cardStyles.checkButton, set.completed && { backgroundColor: colors.tint }]}
                >
                  <Ionicons name="checkmark" size={18} color={set.completed ? '#fff' : Colors[colorScheme ?? 'light'].icon} />
                </TouchableOpacity>
              </Animated.View>
            );
          })()}
        </View>
        </Swipeable>
      ))}

      <TouchableOpacity onPress={addSet} style={cardStyles.addSetButton}>
        <Text style={cardStyles.addSetText}>ADD SET</Text>
      </TouchableOpacity>

      {/* Replace Exercise Modal */}
      <Modal visible={replaceVisible} animationType="slide" onRequestClose={() => setReplaceVisible(false)}>
        <CustomHeader
          title="Replace Exercise"
          showBackButton
          onBackPress={() => setReplaceVisible(false)}
          enableSearch
          searchPlaceholder="Search for an exercise..."
          initialQuery={replaceSearch}
          onSearchQueryChange={setReplaceSearch}
          rightTextButton={{
            label: 'REPLACE',
            disabled: !replaceSelected,
            color: Colors[colorScheme ?? 'light'].tint,
            onPress: () => {
              const selected = replaceData.find((e) => e.exerciseId === replaceSelected);
              if (selected) {
                onUpdate({ ...item, exercise: selected });
              }
              setReplaceVisible(false);
              setReplaceSelected(null);
            },
          }}
        >
          <View style={{ flex: 1 }}>
            {replaceLoading ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
              </View>
            ) : (
              <FlatList
                keyboardDismissMode="on-drag"
                keyboardShouldPersistTaps="handled"
                data={replaceData}
                keyExtractor={(it) => it.exerciseId}
                renderItem={({ item: ex }) => {
                  const isSelected = replaceSelected === ex.exerciseId;
                  const selectedBg = (colorScheme === 'dark') ? 'rgba(10,126,164,0.35)' : 'rgba(10,126,164,0.12)';
                  const isLetter = ex.gifUrl?.startsWith('letter://');
                  const letter = isLetter ? ex.gifUrl.replace('letter://', '').slice(0, 1) || 'X' : 'X';
                  return (
                    <TouchableOpacity
                      onPress={() => setReplaceSelected((prev) => (prev === ex.exerciseId ? null : ex.exerciseId))}
                      style={[cardStyles.rExerciseContainer, isSelected && { backgroundColor: selectedBg }]}
                    >
                      <View style={cardStyles.rImageWrapper}>
                        {isSelected ? (
                          <Ionicons name="checkmark" size={28} color={Colors[colorScheme ?? 'light'].tint} />
                        ) : isLetter ? (
                          <View style={cardStyles.letterAvatar}><Text style={cardStyles.letterText}>{letter}</Text></View>
                        ) : (
                          <Image source={{ uri: ex.gifUrl }} style={cardStyles.exerciseImage} />
                        )}
                      </View>
                      <View style={cardStyles.rExerciseDetails}>
                        <ThemedText style={cardStyles.rExerciseName}>{toTitleCase(ex.name)}</ThemedText>
                        <ThemedText style={cardStyles.rExerciseBodyPart}>{toTitleCase(ex.bodyParts?.join(', ') || '')}</ThemedText>
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        </CustomHeader>
      </Modal>
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
    letterSpacing: 1,
    textAlign: 'left',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    columnGap: 12 as any,
  },
  setIndex: {
    width: 40,
    color: '#1e88e5',
    fontSize: 18,
    fontWeight: '700',
  },
  previousText: {
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
  deleteAction: {
    backgroundColor: '#ef5350',
    width: 88,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
    borderRadius: 10,
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
  // Replace picker styles matching add-exercise list
  rExerciseContainer: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2d2d2d',
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rImageWrapper: {
    width: 50,
    height: 50,
    marginRight: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  exerciseImage: { width: 50, height: 50, borderRadius: 8 },
  letterAvatar: { width: 50, height: 50, borderRadius: 8, backgroundColor: '#0a7ea4', alignItems: 'center', justifyContent: 'center' },
  letterText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  rExerciseDetails: { flex: 1 },
  rExerciseName: { fontSize: 16, fontWeight: '700' },
  rExerciseBodyPart: { fontSize: 14, color: '#888' },
});


