import React from 'react';

import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { Ionicons } from '@expo/vector-icons';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { CompletedWorkout, getWorkoutById } from '@/services/historyService';

function formatDuration(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${h > 0 ? `${h}h ` : ''}${m}m`;
}

export default function WorkoutSummaryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];
  const [workout, setWorkout] = React.useState<CompletedWorkout | null>(null);
  const insets = useSafeAreaInsets();

  React.useEffect(() => {
    getWorkoutById(id).then(setWorkout);
  }, [id]);

  if (!workout) {
    return <ThemedView style={{ flex: 1 }} />;
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingTop: Math.max(16, insets.top + 8),
          paddingBottom: Math.max(24, insets.bottom + 24),
        }}
      >
        <View style={[styles.banner, { backgroundColor: colors.tint }]}>
          <Text style={styles.bannerTitle}>Congratulations!</Text>
          <Text style={styles.bannerSub}>That’s your workout number</Text>
        </View>

        <View style={[styles.card, { borderColor: colors.icon }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{workout.name}</Text>
          <Text style={{ color: colors.icon, marginBottom: 8 }}>
            {new Date(workout.completedAt).toLocaleDateString(undefined, {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>

          <View style={styles.metricsRow}>
            <View style={styles.metric}>
              <Ionicons name="time-outline" size={18} color={colors.text} />
              <Text style={[styles.metricText, { color: colors.text }]}>
                {formatDuration(workout.durationSec)}
              </Text>
            </View>
            <View style={styles.metric}>
              <Ionicons name="barbell-outline" size={18} color={colors.text} />
              <Text style={[styles.metricText, { color: colors.text }]}>
                {workout.totalVolume} kg
              </Text>
            </View>
            <View style={styles.metric}>
              <Ionicons name="trophy-outline" size={18} color={colors.text} />
              <Text style={[styles.metricText, { color: colors.text }]}>{workout.prs} PRs</Text>
            </View>
          </View>

          <View style={styles.exHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Exercise</Text>
            <View style={{ flex: 1 }} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Best Set</Text>
          </View>
          {workout.exercises.map((ex) => (
            <View key={ex.exerciseId} style={styles.exerciseRow}>
              <Text style={[styles.exerciseName, { color: colors.text }]}>
                {ex.name.replace(/\w\S*/g, (t) => t[0].toUpperCase() + t.slice(1).toLowerCase())}
              </Text>
              <View style={{ flex: 1 }} />
              <Text style={[styles.bestSet, { color: colors.text }]}>
                {ex.bestSet ? `${ex.bestSet.weight} kg × ${ex.bestSet.reps}` : '—'}
              </Text>
            </View>
          ))}
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => router.replace('/(tabs)/history')}
          activeOpacity={0.85}
          style={[styles.homeButton, { backgroundColor: colors.tint }]}
        >
          <Ionicons name="time-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.homeButtonText}>View in History</Text>
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  banner: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  bannerSub: {
    color: '#fff',
    marginTop: 4,
    opacity: 0.9,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 16,
    marginVertical: 6,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricText: { fontWeight: '600' },
  sectionTitle: { marginTop: 12, fontWeight: '700' },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
  },
  exHeaderRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingBottom: 4 },
  exerciseName: { fontWeight: '400' },
  bestSet: { marginLeft: 12, fontWeight: '400' },
  homeButton: {
    marginTop: 16,
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  homeButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
