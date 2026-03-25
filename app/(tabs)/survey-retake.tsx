import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { PersonalizationSurveyForm } from '../components/PersonalizationSurveyForm';
import { useAuthContext } from '../context/AuthContext';
import * as db from '../db';
import type { PersonalizationSurvey, PersonalizationSurveyInput } from '../db/types';

export default function SurveyRetakeScreen() {
  const router = useRouter();
  const { refreshProfile } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialSurvey, setInitialSurvey] = useState<PersonalizationSurvey | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const payload = await db.getPersonalizationSurvey();
        setInitialSurvey(payload.survey);
      } catch (error) {
        console.error('Failed to load personalization survey:', error);
        Alert.alert('Error', 'Failed to load your survey settings.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const handleSubmit = async (survey: PersonalizationSurveyInput) => {
    try {
      setSaving(true);
      await db.updatePersonalizationSurvey(survey);
      await refreshProfile();
      router.replace('/(tabs)/settings');
      Alert.alert('Saved', 'Personalization survey updated.');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save survey.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF6347" />
      </View>
    );
  }

  return (
    <PersonalizationSurveyForm
      title="Retake Personalization Survey"
      subtitle="Update your goals, restrictions, cooking style, and priorities anytime."
      submitLabel="Save survey"
      initialSurvey={initialSurvey}
      saving={saving}
      onSubmit={handleSubmit}
    />
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});
