import React from 'react';

import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { usePathname, useRouter } from 'expo-router';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/Colors';
import { useWorkoutSession } from '@/context/WorkoutSessionContext';
import { useColorScheme } from '@/hooks/useColorScheme';

function formatElapsed(from: number | null): string {
  if (!from) return '00:00';
  const secs = Math.max(0, Math.floor((Date.now() - from) / 1000));
  const h = Math.floor(secs / 3600)
    .toString()
    .padStart(2, '0');
  const m = Math.floor((secs % 3600) / 60)
    .toString()
    .padStart(2, '0');
  const s = Math.floor(secs % 60)
    .toString()
    .padStart(2, '0');
  return `${h !== '00' ? h + ':' : ''}${m}:${s}`;
}

export default function ActiveWorkoutBanner() {
  const { isActive, session } = useWorkoutSession();
  const pathname = usePathname();
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];
  const insets = useSafeAreaInsets();

  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    if (!isActive) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [isActive]);

  if (!isActive) return null;
  if (pathname?.startsWith('/workout/custom')) return null;

  const bottomOffset = Math.max(insets.bottom + 76, 80);

  return (
    <View pointerEvents="box-none" style={[styles.container, { bottom: bottomOffset }]}>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => router.push('/workout/custom')}
        style={[styles.banner, { backgroundColor: colors.tint }]}
        activeOpacity={0.85}
      >
        <Text style={styles.bannerText}>
          Resume: {session.name} • {formatElapsed(session.startTime)}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  banner: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    maxWidth: '92%',
    borderRadius: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  bannerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
