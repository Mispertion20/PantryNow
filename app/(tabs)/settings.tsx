import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button } from '../components/Button';
import * as db from '../db';
import type { RecommendationGoal } from '../db/types';

const GOAL_OPTIONS: {
  value: RecommendationGoal;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}[] = [
  {
    value: 'deficit',
    title: 'Calorie Deficit (Diet Mode)',
    subtitle: 'Prioritize lighter recommendations with lower estimated filling score.',
    icon: 'trending-down-outline',
    color: '#43A047',
  },
  {
    value: 'surplus',
    title: 'Calorie Surplus (Bulking Mode)',
    subtitle: 'Prioritize more filling recommendations with higher estimated calories.',
    icon: 'barbell-outline',
    color: '#FB8C00',
  },
  {
    value: 'neutral',
    title: 'Neutral / Casual Cooking',
    subtitle: 'Balanced recommendations without strong calorie target bias.',
    icon: 'restaurant-outline',
    color: '#5E35B1',
  },
];

export default function SettingsScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentGoal, setCurrentGoal] = useState<RecommendationGoal>('neutral');
  const [selectedGoal, setSelectedGoal] = useState<RecommendationGoal>('neutral');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const goal = await db.getRecommendationGoal();
        setCurrentGoal(goal);
        setSelectedGoal(goal);
      } catch (error) {
        console.error('Failed to load recommendation goal:', error);
        Alert.alert('Error', 'Failed to load your personalization settings.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleSave = async () => {
    if (selectedGoal === currentGoal) {
      return;
    }

    try {
      setSaving(true);
      const savedGoal = await db.updateRecommendationGoal(selectedGoal);
      setCurrentGoal(savedGoal);
      setSelectedGoal(savedGoal);
      setSaveMessage('Saved successfully. New recommendations will use this goal.');
    } catch (error) {
      console.error('Failed to save recommendation goal:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save settings.');
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
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Personalization Goal</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recommendation Goal</Text>
        <Text style={styles.sectionDescription}>
          This goal is stored per account and is always applied to AI recommendations.
        </Text>

        <View style={styles.currentGoalCard}>
          <Ionicons name="information-circle-outline" size={18} color="#5E35B1" />
          <Text style={styles.currentGoalText}>
            Current goal: <Text style={styles.currentGoalValue}>{GOAL_OPTIONS.find((goal) => goal.value === currentGoal)?.title || 'Neutral / Casual Cooking'}</Text>
          </Text>
        </View>

        {GOAL_OPTIONS.map((option) => {
          const selected = selectedGoal === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.goalCard, selected && styles.goalCardSelected]}
              onPress={() => setSelectedGoal(option.value)}
              activeOpacity={0.85}
            >
              <View style={[styles.goalIconWrap, { backgroundColor: `${option.color}20` }]}>
                <Ionicons name={option.icon} size={22} color={option.color} />
              </View>

              <View style={styles.goalTextWrap}>
                <Text style={styles.goalTitle}>{option.title}</Text>
                <Text style={styles.goalSubtitle}>{option.subtitle}</Text>
              </View>

              <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                {selected ? <View style={styles.radioInner} /> : null}
              </View>
            </TouchableOpacity>
          );
        })}

        {saveMessage ? (
          <View style={styles.successMessageWrap}>
            <Ionicons name="checkmark-circle" size={16} color="#43A047" />
            <Text style={styles.successMessageText}>{saveMessage}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.footer}>
        <Button
          title={saving ? 'Saving...' : 'Save Goal'}
          onPress={() => {
            void handleSave();
          }}
          disabled={saving || selectedGoal === currentGoal}
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
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    marginTop: 2,
    fontSize: 14,
    color: '#777',
  },
  section: {
    marginTop: 14,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  sectionDescription: {
    marginTop: 4,
    marginBottom: 12,
    fontSize: 13,
    color: '#777',
    lineHeight: 18,
  },
  currentGoalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F3E5F5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  currentGoalText: {
    flex: 1,
    fontSize: 12,
    color: '#5E35B1',
    lineHeight: 18,
  },
  currentGoalValue: {
    fontWeight: '700',
  },
  goalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#efefef',
    elevation: 1,
  },
  goalCardSelected: {
    borderColor: '#FF6347',
    backgroundColor: '#FFF8F6',
  },
  goalIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  goalTextWrap: {
    flex: 1,
    marginRight: 10,
  },
  goalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 2,
  },
  goalSubtitle: {
    fontSize: 12,
    color: '#777',
    lineHeight: 17,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: '#FF6347',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF6347',
  },
  footer: {
    marginTop: 8,
    paddingHorizontal: 16,
  },
  successMessageWrap: {
    marginTop: 6,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  successMessageText: {
    flex: 1,
    fontSize: 12,
    color: '#2E7D32',
  },
});
