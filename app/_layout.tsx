import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

// Active banner is now integrated into TabBar; keeping import commented if needed in future
// import ActiveWorkoutBanner from '@/components/ActiveWorkoutBanner';
import { WorkoutSessionProvider } from '@/context/WorkoutSessionContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { setupNotificationChannels } from '@/services/notificationService';
import { ExpoContextMenuProvider } from '@appandflow/expo-context-menu';
import { useEffect } from 'react';

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
        <WorkoutSessionProvider>
          <>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="exercise/create" options={{ headerShown: false }} />
              <Stack.Screen name="workout/custom" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" />
            </Stack>
            {/* Banner moved into custom TabBar */}
          </>
          <StatusBar style="auto" />
        </WorkoutSessionProvider>
      </ExpoContextMenuProvider>
    </ThemeProvider>
  );
}
