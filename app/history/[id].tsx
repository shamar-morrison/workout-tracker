import React from 'react';

import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';

import { Ionicons } from '@expo/vector-icons';

import CustomHeader from '@/components/CustomHeader';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { CompletedWorkout, getWorkoutById } from '@/services/historyService';

export default function HistoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];
  const [workout, setWorkout] = React.useState<CompletedWorkout | null>(null);
  const [loading, setLoading] = React.useState(true);

  const handleDelete = React.useCallback(async () => {
    if (!workout?.id) return;
    const { deleteWorkoutById } = await import('@/services/historyService');
    await deleteWorkoutById(workout.id);
    try {
      const { ToastAndroid, Platform, Alert } = require('react-native');
      if (Platform.OS === 'android') ToastAndroid.show('Workout deleted', ToastAndroid.SHORT);
      else Alert.alert('Workout deleted');
    } catch {}
    router.back();
  }, [router, workout?.id]);

  React.useEffect(() => {
    let cancelled = false;
    getWorkoutById(id as string).then((w) => {
      if (!cancelled) {
        setWorkout(w);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <ThemedView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.tint} />
      </ThemedView>
    );
  }

  if (!workout) {
    return (
      <ThemedView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <Text style={{ color: colors.text, textAlign: 'center' }}>Workout not found.</Text>
      </ThemedView>
    );
  }

  const date = new Date(workout.completedAt);
  const startTime = new Date(workout.completedAt - workout.durationSec * 1000);

  return (
    <ThemedView style={{ flex: 1 }}>
      <CustomHeader
        title={workout.name}
        showBackButton
        onBackPress={() => router.back()}
        menuOpenOnTap
        menuItems={[
          {
            title: 'Delete workout',
            destructive: true,
            confirmTitle: 'Delete workout?',
            confirmMessage: 'This action cannot be undone.',
            confirmConfirmText: 'Delete',
            onPress: handleDelete,
          },
        ]}
      >
        <View style={styles.container}>
          <View style={styles.topMeta}>
            <ThemedText style={styles.dateText}>
              {date.toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </ThemedText>
            <ThemedText style={styles.metaText}>
              Started at {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
              • Duration {formatDuration(workout.durationSec)}
            </ThemedText>
          </View>

          <View style={styles.metricsRow}>
            <View style={styles.metric}>
              <Ionicons name="barbell-outline" size={18} color={colors.text} />
              <Text style={[styles.metricText, { color: colors.text }]}>
                Total volume: {workout.totalVolume}
              </Text>
            </View>
            <View style={styles.metric}>
              <Ionicons name="trophy-outline" size={18} color={colors.text} />
              <Text style={[styles.metricText, { color: colors.text }]}>{workout.prs} PRs</Text>
            </View>
          </View>

          <FlatList
            contentContainerStyle={{ paddingBottom: 24 }}
            data={workout.exercises}
            keyExtractor={(e) => e.exerciseId}
            renderItem={({ item: ex }) => (
              <View style={[styles.exerciseCard, { borderColor: colors.icon }]}>
                <ThemedText style={styles.exerciseTitle}>{title(ex.name)}</ThemedText>
                {ex.sets && ex.sets.length > 0 ? (
                  <View style={{ marginTop: 6 }}>
                    <View style={styles.setHeaderRow}>
                      <Text style={[styles.setHeader, { width: 50, color: colors.text }]}>SET</Text>
                      <Text style={[styles.setHeader, { width: 90, color: colors.text }]}>
                        WEIGHT
                      </Text>
                      <Text style={[styles.setHeader, { width: 60, color: colors.text }]}>
                        REPS
                      </Text>
                    </View>
                    {ex.sets.map((s, i) => (
                      <View key={i} style={styles.setRow}>
                        <Text style={[styles.setText, { width: 50, color: colors.text }]}>
                          {i + 1}
                        </Text>
                        <Text style={[styles.setText, { width: 90, color: colors.text }]}>
                          {s.weight}
                        </Text>
                        <Text style={[styles.setText, { width: 60, color: colors.text }]}>
                          {s.reps}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={{ color: colors.icon }}>
                    Best set: {ex.bestSet ? `${ex.bestSet.weight} × ${ex.bestSet.reps}` : '—'}
                  </Text>
                )}
              </View>
            )}
          />
        </View>
      </CustomHeader>
    </ThemedView>
  );
}

function formatDuration(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return `${h > 0 ? `${h}h ` : ''}${m}m ${h === 0 ? `${s}s` : ''}`.trim();
}

function title(s: string) {
  return (s || '').replace(/\w\S*/g, (t) => t[0].toUpperCase() + t.slice(1).toLowerCase());
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  topMeta: { marginBottom: 8 },
  dateText: { fontSize: 16, fontWeight: '700' },
  metaText: { marginTop: 2 },
  metricsRow: { flexDirection: 'row', gap: 16, marginVertical: 6 },
  metric: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metricText: { fontWeight: '600' },
  exerciseCard: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 12 },
  exerciseTitle: { fontSize: 16, fontWeight: '700' },
  setHeaderRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  setHeader: { fontWeight: '700' },
  setRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  setText: {},
});
