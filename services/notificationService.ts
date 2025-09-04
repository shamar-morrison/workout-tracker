import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { Platform } from 'react-native';

const NOTIFICATION_ID = 'workout-session-notification';
const CHANNEL_ID = 'workout-session-channel';
const CATEGORY_ID = 'workout-session';
export const ACTION_COMPLETE_SET = 'COMPLETE_SET';

export async function setupNotificationChannels() {
	if (Platform.OS === 'android') {
		await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
			name: 'Workout Session',
			importance: Notifications.AndroidImportance.MAX,
			vibrationPattern: [0, 250, 250, 250],
			lightColor: '#FF231F7C',
		});
	}
	// Category for in-notification actions
	await Notifications.setNotificationCategoryAsync(CATEGORY_ID, [
		{
			identifier: ACTION_COMPLETE_SET,
			buttonTitle: 'Complete set',
			options: { opensAppToForeground: true },
		},
	]);
}

export async function ensureNotificationPermissions() {
	try {
		const existing = await Notifications.getPermissionsAsync();
		if (existing.granted) return true;
		const { status } = await Notifications.requestPermissionsAsync();
		return status === 'granted';
	} catch {
		return false;
	}
}

// Required configuration for notifications
Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldPlaySound: false,
		shouldSetBadge: false,
		shouldShowBanner: true,
		shouldShowList: true,
	}),
});

// Handle notification tap events (deep linking)
Notifications.addNotificationResponseReceivedListener(response => {
	const url = response.notification.request.content.data?.url;
	if (url) {
		// @ts-ignore - Href type is very strict, but this works
		router.push(url);
	}
});

export async function scheduleWorkoutNotificationContent({ title, body, withCompleteAction }: { title: string; body: string; withCompleteAction?: boolean; }) {
	try { await Notifications.dismissNotificationAsync(NOTIFICATION_ID); } catch {}
	await Notifications.scheduleNotificationAsync({
		identifier: NOTIFICATION_ID,
		content: {
			title,
			body,
			sticky: true,
			data: { url: '/workout/custom' },
			priority: Notifications.AndroidNotificationPriority.MAX,
			categoryIdentifier: withCompleteAction ? CATEGORY_ID : undefined,
		},
		trigger: null,
	});
}

export async function scheduleWorkoutNotification(name: string) {
	await scheduleWorkoutNotificationContent({
		title: 'Workout in Progress',
		body: `Your "${name}" session is active. Tap to resume.`,
		withCompleteAction: false,
	});
}

export async function dismissWorkoutNotification() {
	await Notifications.dismissNotificationAsync(NOTIFICATION_ID);
}

