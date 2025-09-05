import AsyncStorage from '@react-native-async-storage/async-storage';

export type CompletedSet = { weight: number; reps: number };

export type CompletedExerciseSummary = {
  exerciseId: string;
  name: string;
  setCount: number;
  bestSet: CompletedSet | null;
};

export type CompletedWorkout = {
  id: string;
  name: string;
  completedAt: number; // epoch ms
  durationSec: number;
  totalVolume: number; // sum weight * reps
  prs: number; // number of PRs hit in this workout
  exercises: CompletedExerciseSummary[];
};

const STORAGE_KEY = 'workout_history_v1';

export async function loadHistory(): Promise<CompletedWorkout[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as CompletedWorkout[];
    return [];
  } catch {
    return [];
  }
}

async function saveHistory(next: CompletedWorkout[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}
}

export async function getWorkoutCount(): Promise<number> {
  const history = await loadHistory();
  return history.length;
}

export async function getWorkoutById(id: string): Promise<CompletedWorkout | null> {
  const history = await loadHistory();
  return history.find((w) => w.id === id) ?? null;
}

export async function listWorkouts(): Promise<CompletedWorkout[]> {
  const history = await loadHistory();
  return [...history].sort((a, b) => b.completedAt - a.completedAt);
}

function compareSets(a: CompletedSet | null, b: CompletedSet | null): number {
  if (!a && !b) return 0;
  if (a && !b) return 1;
  if (!a && b) return -1;
  // Prefer higher weight; tiebreaker higher reps
  if ((a as CompletedSet).weight !== (b as CompletedSet).weight) {
    return (a as CompletedSet).weight - (b as CompletedSet).weight;
  }
  return (a as CompletedSet).reps - (b as CompletedSet).reps;
}

export async function recordCompletedWorkout(input: Omit<CompletedWorkout, 'id' | 'prs'>): Promise<{ id: string; workoutNumber: number; prs: number }> {
  const history = await loadHistory();

  // Build previous best by exercise
  const prevBest = new Map<string, CompletedSet | null>();
  for (const w of history) {
    for (const ex of w.exercises) {
      const current = prevBest.get(ex.exerciseId) ?? null;
      const cmp = compareSets(ex.bestSet, current);
      if (cmp > 0) prevBest.set(ex.exerciseId, ex.bestSet);
    }
  }

  let prs = 0;
  for (const ex of input.exercises) {
    const previous = prevBest.get(ex.exerciseId) ?? null;
    if (compareSets(ex.bestSet, previous) > 0) prs += 1;
  }

  const id = `w_${Date.now()}`;
  const saved: CompletedWorkout = { id, prs, ...input };
  const nextHistory = [...history, saved];
  await saveHistory(nextHistory);
  return { id, workoutNumber: nextHistory.length, prs };
}


