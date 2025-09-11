import React from 'react';

import { AppState, AppStateStatus } from 'react-native';

import * as Notifications from 'expo-notifications';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { Exercise } from '@/services/exerciseService';
import {
  ACTION_COMPLETE_SET,
  dismissWorkoutNotification,
  ensureNotificationPermissions,
  scheduleWorkoutNotificationContent,
} from '@/services/notificationService';

export type WorkoutSet = {
  id?: string;
  weight: string;
  reps: string;
  completed: boolean;
  // Canonical weight in pounds (if parsed). Keeps precision across unit toggles.
  weightLbs?: number;
};

export type WorkoutExercise = {
  id: string; // unique per added card
  exercise: Exercise;
  sets: WorkoutSet[];
  weightUnit?: 'lbs' | 'kg';
  note?: string;
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

const DEFAULT: SessionState = {
  id: null,
  name: 'Custom Workout',
  startTime: null,
  note: '',
  exercises: [],
};
const STORAGE_KEY = 'active_workout_session_v1';

export const WorkoutSessionContext = React.createContext<WorkoutSessionContextValue | undefined>(
  undefined,
);

function titleCase(str: string) {
  return (str || '').replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase(),
  );
}

function buildNotificationFromSession(session: SessionState): {
  title: string;
  body: string;
  withCompleteAction: boolean;
} {
  if (!session.exercises || session.exercises.length === 0) {
    return {
      title: 'Workout session in progress',
      body: 'No exercises added yet',
      withCompleteAction: false,
    };
  }

  // Find first exercise with an incomplete set
  for (const ex of session.exercises) {
    const idx = ex.sets.findIndex((s) => !s.completed);
    if (idx !== -1) {
      const set = ex.sets[idx];
      const hasValues = set.weight?.trim().length > 0 && set.reps?.trim().length > 0;
      return {
        title: titleCase(ex.exercise.name || 'Exercise'),
        body: hasValues
          ? `${set.weight} ${ex.weightUnit || 'lbs'} x ${set.reps} - (${idx + 1} of ${ex.sets.length})`
          : 'Add values to mark as completed',
        withCompleteAction: hasValues,
      };
    }
  }

  // If all sets are completed, default to last exercise summary
  const last = session.exercises[session.exercises.length - 1];
  return {
    title: titleCase(last.exercise.name || 'Workout'),
    body: 'All sets completed',
    withCompleteAction: false,
  };
}

function markFirstIncompleteSetCompleted(current: SessionState): SessionState {
  for (let ei = 0; ei < current.exercises.length; ei++) {
    const ex = current.exercises[ei];
    const si = ex.sets.findIndex((s) => !s.completed);
    if (si !== -1) {
      const nextExercises = current.exercises.map((e, idx) =>
        idx !== ei
          ? e
          : {
              ...e,
              sets: e.sets.map((s, j) => (j === si ? { ...s, completed: true } : s)),
            },
      );
      return { ...current, exercises: nextExercises };
    }
  }
  return current;
}

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
      // Proactively request notification permission when starting a session
      ensureNotificationPermissions();
      const next: SessionState = {
        id: `sess_${Date.now()}`,
        name,
        startTime: Date.now(),
        note: '',
        exercises: [],
      };
      persist(next);
    },
    [persist],
  );

  const update = React.useCallback(
    (patch: Partial<SessionState>) => {
      persist({ ...session, ...patch });
    },
    [persist, session],
  );

  const finish = React.useCallback(() => {
    persist(DEFAULT);
    dismissWorkoutNotification();
  }, [persist]);

  // Respond to notification actions (e.g., Complete set)
  React.useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      if (response.actionIdentifier === ACTION_COMPLETE_SET) {
        const next = markFirstIncompleteSetCompleted(session);
        if (next !== session) {
          persist(next);
        }
      }
    });
    return () => subscription.remove();
  }, [session, persist]);

  // Background/foreground notification behavior
  React.useEffect(() => {
    const appStateRef = { current: AppState.currentState } as { current: AppStateStatus };
    const sub = AppState.addEventListener('change', async (nextState) => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;

      if (!isActive) {
        dismissWorkoutNotification();
        return;
      }

      // When leaving the app, show the notification with dynamic content
      if ((nextState === 'inactive' || nextState === 'background') && prev === 'active') {
        const perm = await ensureNotificationPermissions();
        if (!perm) return;
        const content = buildNotificationFromSession(session);
        scheduleWorkoutNotificationContent(content);
      }

      // When returning, dismiss it
      if (nextState === 'active') {
        dismissWorkoutNotification();
      }
    });
    return () => sub.remove();
  }, [isActive, session]);

  const value = React.useMemo(
    () => ({ session, isActive, start, update, finish }),
    [session, isActive, start, update, finish],
  );

  return <WorkoutSessionContext.Provider value={value}>{children}</WorkoutSessionContext.Provider>;
}

export function useWorkoutSession(): WorkoutSessionContextValue {
  const ctx = React.useContext(WorkoutSessionContext);
  if (!ctx) throw new Error('useWorkoutSession must be used within WorkoutSessionProvider');
  return ctx;
}
