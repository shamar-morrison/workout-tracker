import { BottomTabBar, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Colors } from '@/constants/Colors';
import { useWorkoutSession } from '@/context/WorkoutSessionContext';
import { useColorScheme } from '@/hooks/useColorScheme';

const OVERLAY_HEIGHT = 36;

export default function ActiveWorkoutTabBar(props: BottomTabBarProps) {
  const { isActive, session } = useWorkoutSession();
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];

  return (
    <View style={{ position: 'relative' }}>
      {isActive ? (
        <TouchableOpacity
          accessibilityRole="button"
          activeOpacity={0.85}
          onPress={() => router.push('/workout/custom')}
          style={[styles.overlay, { backgroundColor: colors.tint }]}
        >
          <Text style={styles.overlayText}>Resume: {session.name}</Text>
        </TouchableOpacity>
      ) : null}
      <View style={{ paddingTop: isActive ? OVERLAY_HEIGHT + 8 : 0 }}>
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
    marginHorizontal: 16,
    height: OVERLAY_HEIGHT,
    borderRadius: OVERLAY_HEIGHT / 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  overlayText: {
    color: '#fff',
    fontWeight: '700',
  },
});


