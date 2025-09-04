import { Exercise } from '@/services/exerciseService';
import { dismissWorkoutNotification, scheduleWorkoutNotification } from '@/services/notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';

export type WorkoutSet = {
  weight: string;
  reps: string;
  completed: boolean;
};

export type WorkoutExercise = {
  id: string; // unique per added card
  exercise: Exercise;
  sets: WorkoutSet[];
};

type SessionState = {
  id: string | null;
  name: string;
  startTime: number | null; // epoch ms
  note: string;
  exercises: WorkoutExercise[];
};

type WorkoutSessionContextValue = {
  session: SessionState;
  isActive: boolean;
  start: (name?: string) => void;
  update: (patch: Partial<SessionState>) => void;
  finish: () => void;
};

const DEFAULT: SessionState = { id: null, name: 'Custom Workout', startTime: null, note: '', exercises: [] };
const STORAGE_KEY = 'active_workout_session_v1';

export const WorkoutSessionContext = React.createContext<WorkoutSessionContextValue | undefined>(undefined);

export function WorkoutSessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<SessionState>(DEFAULT);

  const isActive = !!session.id && !!session.startTime;

  React.useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.id && parsed.startTime) {
            setSession({ ...DEFAULT, ...parsed });
          }
        }
      } catch {}
    })();
  }, []);

  const persist = React.useCallback(async (next: SessionState) => {
    setSession(next);
    try {
      if (next.id) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY);
      }
    } catch {}
  }, []);

  const start = React.useCallback(
    (name: string = 'Custom Workout') => {
      const next: SessionState = {
        id: `sess_${Date.now()}`,
        name,
        startTime: Date.now(),
        note: '',
        exercises: [],
      };
      persist(next);
      scheduleWorkoutNotification(name);
    },
    [persist]
  );

  const update = React.useCallback(
    (patch: Partial<SessionState>) => {
      persist({ ...session, ...patch });
    },
    [persist, session]
  );

  const finish = React.useCallback(() => {
    persist(DEFAULT);
    dismissWorkoutNotification();
  }, [persist]);

  const value = React.useMemo(
    () => ({ session, isActive, start, update, finish }),
    [session, isActive, start, update, finish]
  );

  return <WorkoutSessionContext.Provider value={value}>{children}</WorkoutSessionContext.Provider>;
}

export function useWorkoutSession(): WorkoutSessionContextValue {
  const ctx = React.useContext(WorkoutSessionContext);
  if (!ctx) throw new Error('useWorkoutSession must be used within WorkoutSessionProvider');
  return ctx;
}


