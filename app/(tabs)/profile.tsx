import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/context/AuthContext';

export default function ProfileScreen() {
  const { user, signOutUser } = useAuth();

  return (
    <ThemedView style={styles.container}>
      <View style={{ padding: 24, gap: 12 }}>
        <ThemedText type="title">Profile</ThemedText>
        {user && <ThemedText>Signed in as {user.email ?? user.displayName ?? user.uid}</ThemedText>}
        <ThemedText onPress={signOutUser} style={styles.signOut}>
          Sign out
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  signOut: {
    marginTop: 8,
    backgroundColor: '#ef4444',
    color: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
});
