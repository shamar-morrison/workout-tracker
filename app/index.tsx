import { Redirect } from 'expo-router';

import { useAuth } from '@/context/AuthContext';

export default function Index() {
  const { user, initializing } = useAuth();

  if (initializing) return null;
  if (!user) return <Redirect href="/login" />;

  return <Redirect href="/workouts" />;
}
