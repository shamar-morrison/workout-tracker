import { BottomTabBar, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Colors } from '@/constants/Colors';
import { useWorkoutSession } from '@/context/WorkoutSessionContext';
import { useColorScheme } from '@/hooks/useColorScheme';

const OVERLAY_HEIGHT = 36;

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

export default function ActiveWorkoutTabBar(props: BottomTabBarProps) {
  const { isActive, session } = useWorkoutSession();
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];

  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    if (!isActive) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [isActive]);

  return (
    <View style={{ position: 'relative' }}>
      {isActive ? (
        <TouchableOpacity
          accessibilityRole="button"
          activeOpacity={0.85}
          onPress={() => router.push('/workout/custom')}
          style={[styles.overlay, { backgroundColor: colors.tint }]}
        >
          <Text style={styles.overlayText}>
            Resume: {session.name} • {formatElapsed(session.startTime)}
          </Text>
        </TouchableOpacity>
      ) : null}
      <View style={{ paddingTop: isActive ? OVERLAY_HEIGHT : 0 }}>
        <BottomTabBar {...props} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: OVERLAY_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  overlayText: {
    color: '#fff',
    fontWeight: '700',
  },
});


