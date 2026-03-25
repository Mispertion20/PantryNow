import React, { useMemo, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import type {
    PersonalizationSurvey,
    PersonalizationSurveyInput,
    SurveyActivityLevel,
    SurveyCookingTime,
    SurveyDietChange,
    SurveyMainGoal,
    SurveyMealPattern,
    SurveyPriority,
    SurveyRestriction,
} from '../db/types';
import { Button } from './Button';
import { InputField } from './InputField';

const MAIN_GOALS: { value: SurveyMainGoal; label: string }[] = [
  { value: 'improve-overall-health', label: 'Improve overall health' },
  { value: 'reduce-weight', label: 'Reduce weight' },
  { value: 'gain-weight-muscle', label: 'Gain weight / muscle mass' },
  { value: 'increase-energy-productivity', label: 'Increase energy and productivity' },
  { value: 'improve-skin-hair', label: 'Improve skin / hair condition' },
  { value: 'eat-more-consciously', label: 'Just eat more consciously' },
];

const DIET_CHANGES: { value: SurveyDietChange; label: string }[] = [
  { value: 'eat-more-vegetables-fruits', label: 'Eat more vegetables and fruits' },
  { value: 'reduce-sugar', label: 'Reduce sugar intake' },
  { value: 'limit-fatty-foods', label: 'Limit fatty foods' },
  { value: 'cut-down-fast-food', label: 'Cut down on fast food' },
  { value: 'increase-protein', label: 'Increase protein intake' },
  { value: 'drink-more-water', label: 'Drink more water' },
  { value: 'eat-regularly', label: 'Eat regularly (do not skip meals)' },
];

const RESTRICTIONS: { value: SurveyRestriction; label: string }[] = [
  { value: 'vegetarian', label: 'Vegetarianism' },
  { value: 'vegan', label: 'Veganism' },
  { value: 'halal', label: 'Halal food' },
  { value: 'lactose-free', label: 'Lactose-free nutrition' },
  { value: 'gluten-free', label: 'Gluten-free food' },
  { value: 'no-restrictions', label: 'No restrictions' },
  { value: 'other', label: 'Other' },
];

const COOKING_TIME: { value: SurveyCookingTime; label: string }[] = [
  { value: 'minimum', label: 'Minimum (up to 15 minutes)' },
  { value: 'medium', label: 'Medium (15-40 minutes)' },
  { value: 'long', label: 'Ready to cook for a long time if it is useful' },
];

const ACTIVITY_LEVEL: { value: SurveyActivityLevel; label: string }[] = [
  { value: 'low', label: 'Low (little movement)' },
  { value: 'medium', label: 'Medium (sometimes sports/walking)' },
  { value: 'high', label: 'High (regular workouts)' },
];

const MEAL_PATTERN: { value: SurveyMealPattern; label: string }[] = [
  { value: 'irregular', label: 'Irregularly, as it turns out' },
  { value: '2-3', label: '2-3 times a day' },
  { value: '3-4', label: '3-4 times a day' },
  { value: 'often-snack', label: 'I often snack' },
];

const PRIORITIES: { value: SurveyPriority; label: string }[] = [
  { value: 'fast-cooking', label: 'Fast cooking' },
  { value: 'availability-of-products', label: 'Availability of products' },
  { value: 'taste', label: 'Taste' },
  { value: 'health-benefits', label: 'Health benefits' },
  { value: 'calorie-reduction', label: 'Calorie reduction' },
];

const defaultSurvey: PersonalizationSurveyInput = {
  mainGoals: [],
  dietChanges: [],
  restrictions: ['no-restrictions'],
  allergies: [],
  otherRestriction: '',
  cookingTime: '',
  activityLevel: '',
  mealPattern: '',
  priorities: [],
};

type Props = {
  title: string;
  subtitle: string;
  submitLabel: string;
  initialSurvey?: PersonalizationSurvey | PersonalizationSurveyInput | null;
  saving: boolean;
  onSubmit: (survey: PersonalizationSurveyInput) => Promise<void>;
};

const mergeInitialSurvey = (
  incoming?: PersonalizationSurvey | PersonalizationSurveyInput | null
): PersonalizationSurveyInput => {
  if (!incoming) return { ...defaultSurvey };
  return {
    mainGoals: incoming.mainGoals ?? [],
    dietChanges: incoming.dietChanges ?? [],
    restrictions: incoming.restrictions?.length ? incoming.restrictions : ['no-restrictions'],
    allergies: incoming.allergies ?? [],
    otherRestriction: incoming.otherRestriction ?? '',
    cookingTime: incoming.cookingTime ?? '',
    activityLevel: incoming.activityLevel ?? '',
    mealPattern: incoming.mealPattern ?? '',
    priorities: incoming.priorities ?? [],
  };
};

const ToggleChip = ({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.chip, selected && styles.chipSelected]}
    activeOpacity={0.85}
  >
    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
  </TouchableOpacity>
);

export const PersonalizationSurveyForm: React.FC<Props> = ({
  title,
  subtitle,
  submitLabel,
  initialSurvey,
  saving,
  onSubmit,
}) => {
  const [survey, setSurvey] = useState<PersonalizationSurveyInput>(() => mergeInitialSurvey(initialSurvey));

  const restrictionsText = useMemo(() => {
    if (survey.restrictions.includes('other') && survey.otherRestriction.trim()) {
      return `Other: ${survey.otherRestriction.trim()}`;
    }
    return null;
  }, [survey.otherRestriction, survey.restrictions]);

  const toggleMulti = <T extends string>(
    currentValues: T[],
    value: T,
    maxItems: number,
    setter: (values: T[]) => void,
    special?: { noRestrictions?: boolean }
  ) => {
    const exists = currentValues.includes(value);
    if (exists) {
      const next = currentValues.filter((item) => item !== value);
      setter(next.length > 0 ? next : (special?.noRestrictions ? (['no-restrictions'] as T[]) : next));
      return;
    }

    if (special?.noRestrictions && value === 'no-restrictions') {
      setter(['no-restrictions'] as T[]);
      return;
    }

    let base = currentValues;
    if (special?.noRestrictions) {
      base = currentValues.filter((item) => item !== ('no-restrictions' as T));
    }

    if (base.length >= maxItems) {
      Alert.alert('Selection limit', `You can select up to ${maxItems} options.`);
      return;
    }

    setter([...base, value]);
  };

  const handleSubmit = async () => {
    if (survey.mainGoals.length === 0) {
      Alert.alert('Survey incomplete', 'Please select at least 1 main goal.');
      return;
    }

    if (!survey.cookingTime || !survey.activityLevel || !survey.mealPattern) {
      Alert.alert('Survey incomplete', 'Please answer all single-choice questions.');
      return;
    }

    if (survey.priorities.length === 0) {
      Alert.alert('Survey incomplete', 'Please select at least 1 priority.');
      return;
    }

    if (survey.restrictions.includes('other') && !survey.otherRestriction.trim()) {
      Alert.alert('Survey incomplete', 'Please specify your restriction in “Other”.');
      return;
    }

    await onSubmit({
      ...survey,
      otherRestriction: survey.restrictions.includes('other') ? survey.otherRestriction.trim() : '',
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. What is your main goal? (choose 1-2)</Text>
        <View style={styles.chipsWrap}>
          {MAIN_GOALS.map((item) => (
            <ToggleChip
              key={item.value}
              label={item.label}
              selected={survey.mainGoals.includes(item.value)}
              onPress={() => toggleMulti(survey.mainGoals, item.value, 2, (values) => setSurvey({ ...survey, mainGoals: values }))}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. What changes do you want in your diet? (multiple)</Text>
        <View style={styles.chipsWrap}>
          {DIET_CHANGES.map((item) => (
            <ToggleChip
              key={item.value}
              label={item.label}
              selected={survey.dietChanges.includes(item.value)}
              onPress={() =>
                toggleMulti(survey.dietChanges, item.value, 7, (values) => setSurvey({ ...survey, dietChanges: values }))
              }
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. Restrictions or preferences</Text>
        <View style={styles.chipsWrap}>
          {RESTRICTIONS.map((item) => (
            <ToggleChip
              key={item.value}
              label={item.label}
              selected={survey.restrictions.includes(item.value)}
              onPress={() =>
                toggleMulti(
                  survey.restrictions,
                  item.value,
                  5,
                  (values) => setSurvey({ ...survey, restrictions: values }),
                  { noRestrictions: true }
                )
              }
            />
          ))}
        </View>

        {survey.restrictions.includes('other') ? (
          <View style={styles.otherBox}>
            <InputField
              label="Other restriction"
              value={survey.otherRestriction}
              onChangeText={(text) => setSurvey({ ...survey, otherRestriction: text.slice(0, 120) })}
              placeholder="Type your preference"
            />
          </View>
        ) : null}

        {restrictionsText ? <Text style={styles.helperText}>{restrictionsText}</Text> : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. Cooking time willingness</Text>
        <View style={styles.chipsWrap}>
          {COOKING_TIME.map((item) => (
            <ToggleChip
              key={item.value}
              label={item.label}
              selected={survey.cookingTime === item.value}
              onPress={() => setSurvey({ ...survey, cookingTime: item.value })}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>5. Activity level</Text>
        <View style={styles.chipsWrap}>
          {ACTIVITY_LEVEL.map((item) => (
            <ToggleChip
              key={item.value}
              label={item.label}
              selected={survey.activityLevel === item.value}
              onPress={() => setSurvey({ ...survey, activityLevel: item.value })}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>6. How do you usually eat now?</Text>
        <View style={styles.chipsWrap}>
          {MEAL_PATTERN.map((item) => (
            <ToggleChip
              key={item.value}
              label={item.label}
              selected={survey.mealPattern === item.value}
              onPress={() => setSurvey({ ...survey, mealPattern: item.value })}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>7. Most important to you? (choose up to 2)</Text>
        <View style={styles.chipsWrap}>
          {PRIORITIES.map((item) => (
            <ToggleChip
              key={item.value}
              label={item.label}
              selected={survey.priorities.includes(item.value)}
              onPress={() => toggleMulti(survey.priorities, item.value, 2, (values) => setSurvey({ ...survey, priorities: values }))}
            />
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          title={saving ? 'Saving survey...' : submitLabel}
          onPress={() => {
            void handleSubmit();
          }}
          disabled={saving}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    paddingBottom: 24,
  },
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 26,
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
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  chipSelected: {
    borderColor: '#FF6347',
    backgroundColor: '#FFF5F1',
  },
  chipText: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#C2410C',
    fontWeight: '700',
  },
  otherBox: {
    marginTop: 8,
  },
  helperText: {
    marginTop: 6,
    fontSize: 12,
    color: '#6A1B9A',
  },
  allergyInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  allergyInputWrap: {
    flex: 1,
  },
  addAllergyButton: {
    backgroundColor: '#FF6347',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
  },
  addAllergyButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  allergyChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FFE8E2',
    borderWidth: 1,
    borderColor: '#FFD2C7',
  },
  allergyChipText: {
    fontSize: 12,
    color: '#B42318',
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
});
