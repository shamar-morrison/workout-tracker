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
import { mapFirebaseAuthError } from '@/utils/authErrors';

export default function LoginScreen() {
  const { signInWithEmail } = useAuth();
  const router = useRouter();
  const headerHeight = useHeaderHeight();

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
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return false;
    }
    return true;
  }

  async function handleSignIn() {
    if (!validateFields()) return;
    try {
      setLoading(true);
      setError(null);
      await signInWithEmail(email.trim(), password);
      router.replace('/');
    } catch (e: any) {
      setError(mapFirebaseAuthError(e.code));
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
              <View style={styles.passwordContainer}>
                <TextInput
                  autoCapitalize="none"
                  secureTextEntry={!isPasswordVisible}
                  placeholder="Password"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={setPassword}
                  style={styles.input}
                  returnKeyType="go"
                  onSubmitEditing={handleSignIn}
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
              <TouchableOpacity onPress={handleSignIn} style={styles.ctaButton} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText style={styles.ctaButtonText}>Sign In</ThemedText>
                )}
              </TouchableOpacity>
              <View style={{ height: 20 }} />
              <Link href="/signup">
                <ThemedText type="link">Create an account</ThemedText>
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
    gap: 1,
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
