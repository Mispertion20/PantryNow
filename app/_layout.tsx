import { AppProvider } from '@/context/AppContext';
import { AuthProvider, useAuthContext } from '@/context/AuthContext';
import { initDB } from '@/db';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

function RootNavigator() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, loading, user } = useAuthContext();

  useEffect(() => {
    if (loading) return;

    const inAuthRoute = segments[0] === '(auth)';
    const inSurveyRoute = segments[0] === 'survey';
    const surveyCompleted = !!user?.survey_completed;

    if (!isAuthenticated && !inAuthRoute) {
      router.replace('/(auth)/login');
      return;
    }

    if (isAuthenticated && !surveyCompleted && !inSurveyRoute) {
      router.replace('/survey');
      return;
    }

    if (isAuthenticated && surveyCompleted && inSurveyRoute) {
      router.replace('/products');
      return;
    }

    if (isAuthenticated && inAuthRoute) {
      router.replace(surveyCompleted ? '/products' : '/survey');
    }
  }, [isAuthenticated, loading, segments, router, user?.survey_completed]);

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
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <AuthProvider>
          <AppProvider>
            <RootNavigator />
          </AppProvider>
        </AuthProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
