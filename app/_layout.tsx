import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuthContext } from './context/AuthContext';
import { initDB } from './db';

function RootNavigator() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, loading } = useAuthContext();

  useEffect(() => {
    if (loading) return;

    const inAuthRoute = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthRoute) {
      router.replace('/login');
      return;
    }

    if (isAuthenticated && inAuthRoute) {
      router.replace('/products');
    }
  }, [isAuthenticated, loading, segments, router]);

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  useEffect(() => {
    const init = async () => {
      try {
        await initDB();
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }
    };
    
    init();
  }, []);

  return (
    <AuthProvider>
      <AppProvider>
        <RootNavigator />
      </AppProvider>
    </AuthProvider>
  );
}
