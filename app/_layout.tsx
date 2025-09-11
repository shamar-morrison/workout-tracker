import { useEffect, useRef } from 'react';

import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { Stack, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { ExpoContextMenuProvider } from '@appandflow/expo-context-menu';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import 'react-native-reanimated';

// Active banner is now integrated into TabBar; keeping import commented if needed in future
// import ActiveWorkoutBanner from '@/components/ActiveWorkoutBanner';
import { AuthProvider } from '@/context/AuthContext';
import { WorkoutSessionProvider } from '@/context/WorkoutSessionContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import {
  dismissWorkoutNotification,
  setupNotificationChannels,
} from '@/services/notificationService';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    Inter: require('../assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium': require('../assets/fonts/Inter-Medium.ttf'),
    'Inter-SemiBold': require('../assets/fonts/Inter-SemiBold.ttf'),
  });

  useEffect(() => {
    setupNotificationChannels();
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <ExpoContextMenuProvider>
        <AuthProvider>
          <WorkoutSessionProvider>
            <NotificationRedirector />
            <>
              <Stack>
                <Stack.Screen name="login" options={{ title: 'Login', headerShown: true }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="exercise/create" options={{ headerShown: false }} />
                <Stack.Screen name="workout/custom" options={{ headerShown: false }} />
                <Stack.Screen name="history/[id]" options={{ headerShown: false }} />
                <Stack.Screen name="+not-found" />
              </Stack>
              {/* Banner moved into custom TabBar */}
            </>
            <StatusBar style="auto" />
          </WorkoutSessionProvider>
        </AuthProvider>
      </ExpoContextMenuProvider>
    </ThemeProvider>
  );
}

function NotificationRedirector() {
  const router = useRouter();
  const pathname = usePathname();
  const lastResponse = Notifications.useLastNotificationResponse();
  const handledIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!lastResponse) return;
    if (lastResponse.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;

    const id = lastResponse.notification.request.identifier as string;
    if (handledIdRef.current === id) return; // already handled this notification
    handledIdRef.current = id;

    const url = lastResponse.notification.request.content.data?.url as string | undefined;
    if (!url) return;
    if (url === '/workout/custom') {
      dismissWorkoutNotification();
      if (pathname !== '/workout/custom') {
        router.replace('/workout/custom');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastResponse]);

  return null;
}
