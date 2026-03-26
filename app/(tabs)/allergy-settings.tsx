import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Button } from '../components/Button';
import { InputField } from '../components/InputField';
import { useAuthContext } from '../context/AuthContext';
import * as db from '../db';
import type { PersonalizationSurvey, PersonalizationSurveyInput } from '../db/types';

export default function AllergySettingsScreen() {
  const router = useRouter();
  const { refreshProfile } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [survey, setSurvey] = useState<PersonalizationSurvey | null>(null);
  const [allergyInput, setAllergyInput] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const payload = await db.getPersonalizationSurvey();
        setSurvey(payload.survey);
      } catch (error) {
        console.error('Failed to load allergy settings:', error);
        Alert.alert('Error', 'Failed to load your allergy settings.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const currentAllergies = survey?.allergies ?? [];

  const handleAddAllergy = () => {
    const value = allergyInput.trim().toLowerCase();
    if (!value) return;

    if (currentAllergies.includes(value)) {
      setAllergyInput('');
      return;
    }

    if (currentAllergies.length >= 15) {
      Alert.alert('Limit reached', 'You can add up to 15 allergy items.');
      return;
    }

    setSurvey((prev) => {
      if (!prev) return prev;
      return { ...prev, allergies: [...prev.allergies, value] };
    });
    setAllergyInput('');
  };

  const handleRemoveAllergy = (value: string) => {
    setSurvey((prev) => {
      if (!prev) return prev;
      return { ...prev, allergies: prev.allergies.filter((item) => item !== value) };
    });
  };

  const handleSave = async () => {
    if (!survey) return;

    try {
      setSaving(true);
      const payload: PersonalizationSurveyInput = {
        mainGoals: survey.mainGoals,
        dietChanges: survey.dietChanges,
        restrictions: survey.restrictions,
        allergies: survey.allergies,
        otherRestriction: survey.otherRestriction,
        cookingTime: survey.cookingTime,
        activityLevel: survey.activityLevel,
        mealPattern: survey.mealPattern,
        priorities: survey.priorities,
      };

      await db.updatePersonalizationSurvey(payload);
      await refreshProfile();
      Alert.alert('Saved', 'Allergy list updated successfully.');
      router.replace('/(tabs)/settings');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save allergy settings.');
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

  if (!survey) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>Unable to load survey data.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/(tabs)/settings')}>
          <Ionicons name="chevron-back" size={20} color="#333" />
          <Text style={styles.backText}>Settings</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Allergy Settings</Text>
        <Text style={styles.subtitle}>Add ingredient names that should be avoided in AI recommendations.</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.inputRow}>
          <View style={styles.inputWrap}>
            <InputField
              label="Allergy ingredient"
              value={allergyInput}
              onChangeText={setAllergyInput}
              placeholder="e.g. peanuts"
            />
          </View>
          <TouchableOpacity style={styles.addButton} onPress={handleAddAllergy}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        {currentAllergies.length > 0 ? (
          <View style={styles.chipsWrap}>
            {currentAllergies.map((item) => (
              <TouchableOpacity key={item} style={styles.chip} onPress={() => handleRemoveAllergy(item)}>
                <Text style={styles.chipText}>{item} ✕</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text style={styles.helperText}>No allergy ingredients added yet.</Text>
        )}
      </View>

      <View style={styles.footer}>
        <Button
          title={saving ? 'Saving...' : 'Save allergies'}
          onPress={handleSave}
          disabled={saving}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    paddingBottom: 24,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 2,
    marginBottom: 8,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#222',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#777',
    lineHeight: 18,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  inputWrap: {
    flex: 1,
  },
  addButton: {
    backgroundColor: '#FF6347',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FFE8E2',
    borderWidth: 1,
    borderColor: '#FFD2C7',
  },
  chipText: {
    fontSize: 12,
    color: '#B42318',
    fontWeight: '600',
  },
  helperText: {
    marginTop: 8,
    fontSize: 12,
    color: '#6A1B9A',
  },
  footer: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
});
