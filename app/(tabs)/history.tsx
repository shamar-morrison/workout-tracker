import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { CompletedWorkout, listWorkouts } from '@/services/historyService';

function formatDuration(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${h > 0 ? `${h}h ` : ''}${m}m`;
}

export default function HistoryScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];
  const [items, setItems] = React.useState<CompletedWorkout[]>([]);

  React.useEffect(() => {
    listWorkouts().then(setItems);
  }, []);

  return (
    <ThemedView style={styles.container}>
      <FlatList
        contentContainerStyle={{ padding: 16 }}
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push({ pathname: '/history/[id]', params: { id: item.id } })}
            style={[styles.card, { borderColor: colors.icon }]}
          >
            <Text style={[styles.cardTitle, { color: colors.text }]}>{item.name}</Text>
            <Text style={{ color: colors.icon, marginBottom: 8 }}>
              {new Date(item.completedAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
            </Text>
            <View style={styles.metricsRow}>
              <View style={styles.metric}>
                <Ionicons name="time-outline" size={18} color={colors.text} />
                <Text style={[styles.metricText, { color: colors.text }]}>{formatDuration(item.durationSec)}</Text>
              </View>
              <View style={styles.metric}>
                <Ionicons name="barbell-outline" size={18} color={colors.text} />
                <Text style={[styles.metricText, { color: colors.text }]}>{item.totalVolume} kg</Text>
              </View>
              <View style={styles.metric}>
                <Ionicons name="trophy-outline" size={18} color={colors.text} />
                <Text style={[styles.metricText, { color: colors.text }]}>{item.prs} PRs</Text>
              </View>
            </View>
            <View style={styles.exHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Exercise</Text>
              <View style={{ flex: 1 }} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Best Set</Text>
            </View>
            {item.exercises.map((ex) => (
              <View key={ex.exerciseId} style={styles.exerciseRow}>
                <Text style={[styles.exerciseName, { color: colors.text }]}>{ex.name.replace(/\w\S*/g, (t) => t[0].toUpperCase() + t.slice(1).toLowerCase())}</Text>
                <View style={{ flex: 1 }} />
                <Text style={[styles.bestSet, { color: colors.text }]}>
                  {ex.bestSet ? `${ex.bestSet.weight} kg × ${ex.bestSet.reps}` : '—'}
                </Text>
              </View>
            ))}
          </TouchableOpacity>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 18, fontWeight: '700' },
  metricsRow: { flexDirection: 'row', gap: 16, marginVertical: 6 },
  metric: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metricText: { fontWeight: '600' },
  exHeaderRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingBottom: 4 },
  sectionTitle: { marginTop: 0, fontWeight: '700' },
  exerciseRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth, borderColor: '#ccc' },
  exerciseName: { fontWeight: '400' },
  bestSet: { marginLeft: 12, fontWeight: '400' },
});
