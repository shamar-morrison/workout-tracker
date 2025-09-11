import { addDoc, collection, getDocs, query, serverTimestamp } from 'firebase/firestore';

// Local storage helpers

import { auth, db } from './firebase';

const BASE_URL = 'https://exercisedb-api-psi.vercel.app/api/v1';

export interface Exercise {
  exerciseId: string;
  name: string;
  gifUrl: string;
  targetMuscles: string[];
  bodyParts: string[];
  equipments: string[];
  secondaryMuscles: string[];
  instructions: string[];
}

export type ExerciseFilterOptions = {
  bodyPart?: string;
  target?: string;
  equipment?: string;
};

export async function saveCustomExercise(ex: Omit<Exercise, 'exerciseId'>): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const customExercisesCol = collection(db, `users/${user.uid}/customExercises`);
  const docRef = await addDoc(customExercisesCol, {
    ...ex,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getCustomExercises(): Promise<Exercise[]> {
  const user = auth.currentUser;
  if (!user) return [];

  try {
    const customExercisesCol = collection(db, `users/${user.uid}/customExercises`);
    const q = query(customExercisesCol);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (d) =>
        ({
          ...d.data(),
          exerciseId: d.id,
        }) as Exercise,
    );
  } catch {
    return [];
  }
}

export const fetchExercises = async (
  limit = 10,
  search = '',
  options: ExerciseFilterOptions = {},
): Promise<Exercise[]> => {
  const remote = await fetchRemoteExercises(limit, search, options).catch(() => [] as Exercise[]);
  const local = await getCustomExercises();

  const matchesFilter = (e: Exercise) => {
    if (
      options.bodyPart &&
      !e.bodyParts.map((b) => b.toLowerCase()).includes(options.bodyPart.toLowerCase())
    )
      return false;
    if (
      options.target &&
      !e.targetMuscles.map((t) => t.toLowerCase()).includes(options.target.toLowerCase())
    )
      return false;
    if (
      options.equipment &&
      !e.equipments.map((t) => t.toLowerCase()).includes(options.equipment.toLowerCase())
    )
      return false;
    return true;
  };

  const matchesSearch = (e: Exercise) =>
    search ? e.name.toLowerCase().includes(search.toLowerCase()) : true;

  const merged = [...local.filter(matchesFilter).filter(matchesSearch), ...remote];
  // De-dup by exerciseId (prefer local first)
  const seen = new Set<string>();
  const deduped: Exercise[] = [];
  for (const e of merged) {
    if (seen.has(e.exerciseId)) continue;
    seen.add(e.exerciseId);
    deduped.push(e);
  }
  return deduped.slice(0, limit);
};

async function fetchRemoteExercises(
  limit = 10,
  search = '',
  options: ExerciseFilterOptions = {},
): Promise<Exercise[]> {
  const { bodyPart, target, equipment } = options;

  const params = new URLSearchParams({ limit: String(limit) });
  if (search) params.append('search', search);
  if (bodyPart) params.append('bodyPart', bodyPart);
  if (target) params.append('target', target);
  if (equipment) params.append('equipment', equipment);

  const candidates: string[] = [`${BASE_URL}/exercises?${params.toString()}`];

  if (bodyPart) {
    const alt = new URLSearchParams({ limit: String(limit) });
    if (search) alt.append('search', search);
    candidates.push(
      `${BASE_URL}/exercises/bodyPart/${encodeURIComponent(bodyPart)}?${alt.toString()}`,
    );
  }
  if (target) {
    const alt = new URLSearchParams({ limit: String(limit) });
    if (search) alt.append('search', search);
    candidates.push(`${BASE_URL}/exercises/target/${encodeURIComponent(target)}?${alt.toString()}`);
  }
  if (equipment) {
    const alt = new URLSearchParams({ limit: String(limit) });
    if (search) alt.append('search', search);
    candidates.push(
      `${BASE_URL}/exercises/equipment/${encodeURIComponent(equipment)}?${alt.toString()}`,
    );
  }

  let lastError: unknown = null;
  for (const url of candidates) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        lastError = new Error(`HTTP ${res.status}`);
        continue;
      }
      const json = await res.json();
      const data = Array.isArray(json) ? json : json.data;
      if (!Array.isArray(data)) throw new Error('Unexpected response shape');
      return data as Exercise[];
    } catch (e) {
      lastError = e;
    }
  }
  if (lastError) throw lastError;
  return [];
}

export const fetchBodyParts = async (): Promise<string[]> => {
  // Not used anymore in create; kept for compatibility
  return [
    'Chest',
    'Back',
    'Legs',
    'Arms',
    'Shoulders',
    'Core',
    'Glutes',
    'Calves',
    'Full body',
    'Other',
  ];
};

export const fetchTargets = async (): Promise<string[]> => {
  return ['Chest', 'Back', 'Legs', 'Arms', 'Shoulders', 'Core', 'Glutes', 'Calves'];
};

export const fetchEquipments = async (): Promise<string[]> => {
  return ['Barbell', 'Dumbbell', 'Machine', 'Bodyweight', 'Kettlebell', 'Cable'];
};
