import { Exercise } from '@/services/exerciseService';
import { dismissWorkoutNotification, ensureNotificationPermissions, scheduleWorkoutNotification } from '@/services/notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import { AppState, AppStateStatus } from 'react-native';

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

	// Background/foreground notification behavior
	React.useEffect(() => {
		const appStateRef = { current: AppState.currentState } as { current: AppStateStatus };
		const sub = AppState.addEventListener('change', (nextState) => {
			const prev = appStateRef.current;
			appStateRef.current = nextState;

			if (!isActive) {
				dismissWorkoutNotification();
				return;
			}

			// When leaving the app, show the notification (once)
			if ((nextState === 'inactive' || nextState === 'background') && prev === 'active') {
				scheduleWorkoutNotification(session.name);
			}

			// When returning, dismiss it
			if (nextState === 'active') {
				dismissWorkoutNotification();
			}
		});
		return () => sub.remove();
	}, [isActive, session.name]);

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


