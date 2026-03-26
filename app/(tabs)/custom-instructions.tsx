import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Button } from '@/components/Button';
import { InputField } from '@/components/InputField';
import * as db from '@/db';

export default function CustomInstructionsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [instructions, setInstructions] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const value = await db.getCustomInstructions();
        setInstructions(value);
      } catch (error) {
        console.error('Failed to load custom instructions:', error);
        Alert.alert('Error', 'Failed to load custom instructions.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const saved = await db.updateCustomInstructions(instructions.trim());
      setInstructions(saved);
      Alert.alert('Saved', 'Custom instructions updated.');
      router.replace('/(tabs)/settings');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save custom instructions.');
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 16 : 0}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/(tabs)/settings')}>
          <Ionicons name="chevron-back" size={20} color="#333" />
          <Text style={styles.backText}>Settings</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Custom Instructions</Text>
        <Text style={styles.subtitle}>
          Describe any special preferences for AI recommendations. Example: “Prefer Mediterranean style and avoid very spicy food.”
        </Text>
      </View>

      <View style={styles.section}>
        <InputField
          label="Your custom AI instructions"
          value={instructions}
          onChangeText={(text) => setInstructions(text.slice(0, 1500))}
          placeholder="Write your custom guidance here"
          multiline
        />
        <Text style={styles.counterText}>{instructions.length}/1500</Text>
      </View>

      <View style={styles.footer}>
        <Button
          title={saving ? 'Saving...' : 'Save instructions'}
          onPress={handleSave}
          disabled={saving}
        />
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  counterText: {
    marginTop: -8,
    fontSize: 12,
    color: '#777',
    textAlign: 'right',
  },
  footer: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
});
