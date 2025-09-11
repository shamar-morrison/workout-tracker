import { useEffect, useState } from 'react';

import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { Link, Stack, useRouter } from 'expo-router';

import { useHeaderHeight } from '@react-navigation/elements';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/context/AuthContext';

export default function LoginScreen() {
  const { signInWithEmail, signUpWithEmail } = useAuth();
  const router = useRouter();
  const headerHeight = useHeaderHeight();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  async function handleSignIn() {
    try {
      setLoading(true);
      await signInWithEmail(email.trim(), password);
      router.replace('/');
    } catch (e: any) {
      Alert.alert('Sign in failed', e?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp() {
    try {
      setLoading(true);
      await signUpWithEmail(email.trim(), password);
      router.replace('/');
    } catch (e: any) {
      Alert.alert('Sign up failed', e?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Login' }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
        style={{ flex: 1 }}
      >
        <ThemedView style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              keyboardVisible ? styles.alignTop : styles.alignCenter,
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.select({ ios: 'on-drag', default: 'none' })}
            showsVerticalScrollIndicator={false}
          >
            <ThemedView style={styles.container}>
              <ThemedText type="title">Welcome back</ThemedText>
              <View style={{ height: 16 }} />
              <TextInput
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                placeholder="Email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                returnKeyType="next"
              />
              <View style={{ height: 12 }} />
              <TextInput
                autoCapitalize="none"
                secureTextEntry
                placeholder="Password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                returnKeyType="go"
                onSubmitEditing={handleSignIn}
              />
              <View style={{ height: 16 }} />
              <View style={styles.row}>
                <ThemedText onPress={handleSignIn} style={styles.cta}>
                  {loading ? 'Signing in…' : 'Sign In'}
                </ThemedText>
                <View style={{ width: 16 }} />
                <ThemedText onPress={handleSignUp} style={styles.secondaryCta}>
                  {loading ? 'Please wait…' : 'Create Account'}
                </ThemedText>
              </View>
              <View style={{ height: 20 }} />
              <Link href="/">
                <ThemedText type="link">Skip for now</ThemedText>
              </Link>
            </ThemedView>
          </ScrollView>
        </ThemedView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 24,
  },
  alignCenter: {
    justifyContent: 'center',
  },
  alignTop: {
    justifyContent: 'flex-start',
  },
  container: {
    padding: 24,
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.select({ ios: 14, default: 12 }),
    backgroundColor: '#fff',
    color: '#111',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cta: {
    backgroundColor: '#111827',
    color: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    overflow: 'hidden',
  },
  secondaryCta: {
    backgroundColor: '#e5e7eb',
    color: '#111827',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    overflow: 'hidden',
  },
});
