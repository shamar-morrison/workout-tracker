import { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Link, Stack, useRouter } from 'expo-router';

import { Ionicons } from '@expo/vector-icons';

import { useHeaderHeight } from '@react-navigation/elements';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/context/AuthContext';

export default function SignUpScreen() {
  const { signUpWithEmail } = useAuth();
  const router = useRouter();
  const headerHeight = useHeaderHeight();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  function validateFields() {
    if (!email.trim() || !password.trim() || !displayName.trim()) {
      setError('All fields are required.');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return false;
    }
    return true;
  }

  async function handleSignUp() {
    if (!validateFields()) return;
    try {
      setLoading(true);
      setError(null);
      await signUpWithEmail(email.trim(), password, displayName.trim());
      router.replace('/');
    } catch (e: any) {
      setError(e?.message ?? 'Sign up failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Create Account' }} />
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
              <ThemedText type="title">Get started</ThemedText>
              <View style={{ height: 16 }} />
              <TextInput
                autoCapitalize="words"
                autoComplete="name"
                placeholder="Display Name"
                placeholderTextColor="#999"
                value={displayName}
                onChangeText={setDisplayName}
                style={styles.input}
                returnKeyType="next"
              />
              <View style={{ height: 12 }} />
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
              <View style={styles.passwordContainer}>
                <TextInput
                  autoCapitalize="none"
                  secureTextEntry={!isPasswordVisible}
                  placeholder="Password (min. 6 characters)"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={setPassword}
                  style={styles.input}
                  returnKeyType="go"
                  onSubmitEditing={handleSignUp}
                />
                <TouchableOpacity
                  onPress={() => setPasswordVisible((prev) => !prev)}
                  style={styles.eyeIcon}
                >
                  <Ionicons name={isPasswordVisible ? 'eye-off' : 'eye'} size={22} color="#666" />
                </TouchableOpacity>
              </View>
              {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}
              <View style={{ height: 16 }} />
              <TouchableOpacity onPress={handleSignUp} style={styles.ctaButton} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText style={styles.ctaButtonText}>Create Account</ThemedText>
                )}
              </TouchableOpacity>
              <View style={{ height: 20 }} />
              <Link href="/login">
                <ThemedText type="link">Back to Login</ThemedText>
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
  passwordContainer: {
    position: 'relative',
    justifyContent: 'center',
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
  eyeIcon: {
    position: 'absolute',
    right: 15,
  },
  errorText: {
    color: '#b91c1c',
    marginTop: 6,
  },
  ctaButton: {
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  ctaButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
