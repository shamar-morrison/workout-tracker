import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { Platform } from 'react-native';

const NOTIFICATION_ID = 'workout-session-notification';
const CHANNEL_ID = 'workout-session-channel';

export async function setupNotificationChannels() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Workout Session',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
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

export async function scheduleWorkoutNotification(name: string) {
  // Request permissions first
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    // alert('You need to enable notifications for the workout session to persist.');
    return;
  }

  await Notifications.scheduleNotificationAsync({
    identifier: NOTIFICATION_ID,
    content: {
      title: 'Workout in Progress',
      body: `Your "${name}" session is active. Tap to resume.`,
      sticky: true, // Android-specific: makes it ongoing
      data: {
        url: '/workout/custom'
      },
      priority: Notifications.AndroidNotificationPriority.MAX,
    },
    trigger: {
      channelId: CHANNEL_ID, // Assign to the channel
    },
  });
}

export async function dismissWorkoutNotification() {
  await Notifications.dismissNotificationAsync(NOTIFICATION_ID);
}

