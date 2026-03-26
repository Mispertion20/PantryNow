import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { AIRecommendationsList } from '../components/AIRecommendations';
import { CookIngredientsModal } from '../components/CookIngredientsModal';
import { useAppContext } from '../context/AppContext';
import { useAuthContext } from '../context/AuthContext';
import type { AIRecommendations, Recipe, RecommendedRecipe } from '../db/types';
import { apiRequest } from '../lib/api';

export default function HomeScreen() {
  const { recipes, products, cookRecipeWithIngredients, getRecipeIngredients } = useAppContext();
  const { user, token } = useAuthContext();
  const router = useRouter();
  const [cookModalVisible, setCookModalVisible] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  // AI recommendations state
  const [aiRecs, setAiRecs] = useState<RecommendedRecipe[]>([]);
  const [aiReasoning, setAiReasoning] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiFetched, setAiFetched] = useState(false);

  const fetchAIRecommendations = useCallback(async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await apiRequest<{ data: AIRecommendations }>('/ai/recommendations', {
        method: 'POST',
      });
      setAiRecs(res.data.recommendations);
      setAiReasoning(res.data.reasoning);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Failed to get recommendations');
    } finally {
      setAiLoading(false);
      setAiFetched(true);
    }
  }, []);

  // Auto-fetch once when user is logged in and data is loaded
  useEffect(() => {
    if (token && recipes.length > 0 && !aiFetched) {
      fetchAIRecommendations();
    }
  }, [token, recipes.length, aiFetched, fetchAIRecommendations]);

  const getTimeOfDay = (): 'Breakfast' | 'Lunch' | 'Dinner' => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Breakfast';
    if (hour < 18) return 'Lunch';
    return 'Dinner';
  };

  const timeOfDay = getTimeOfDay();

  const openCookModal = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setCookModalVisible(true);
  };

  const handleCookAIRec = (rec: RecommendedRecipe) => {
    openCookModal(rec.recipe);
  };

  const handleViewRecipe = (recipeId: number) => {
    router.push(`/recipes/${recipeId}`);
  };

  const handleConfirmCook = async (usedIngredients: { productName: string; amountUsed: number }[]) => {
    if (!selectedRecipe) return;
    await cookRecipeWithIngredients(selectedRecipe.id, usedIngredients);
    setCookModalVisible(false);
    setSelectedRecipe(null);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Welcome Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerContent}>
          <View>
          <Text style={styles.greeting}>Good {timeOfDay === 'Breakfast' ? 'morning' : timeOfDay === 'Lunch' ? 'afternoon' : 'evening'},</Text>
            <Text style={styles.title}>What’s for {timeOfDay.toLowerCase()}?</Text>
            {user ? <Text style={styles.userName}>@{user.name}</Text> : null}
          </View>
        </View>
        <View style={styles.bannerIcon}>
          <Ionicons
            name={
              timeOfDay === 'Breakfast'
                ? 'sunny'
                : timeOfDay === 'Lunch'
                  ? 'cloudy-night'
                  : 'moon'
            }
            size={48}
            color="#FF6347"
          />
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="restaurant-outline" size={28} color="#FF6347" />
          <Text style={styles.statNumber}>{recipes.length}</Text>
          <Text style={styles.statLabel}>Recipes</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="cube-outline" size={28} color="#4CAF50" />
          <Text style={styles.statNumber}>{products.length}</Text>
          <Text style={styles.statLabel}>Products</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle-outline" size={28} color="#2196F3" />
          <Text style={styles.statNumber}>
            {recipes.reduce((sum, r) => sum + r.times_cooked, 0)}
          </Text>
          <Text style={styles.statLabel}>Cooked</Text>
        </View>
      </View>

      {/* AI Recommendations */}
      <AIRecommendationsList
        recommendations={aiRecs}
        reasoning={aiReasoning}
        loading={aiLoading}
        error={aiError}
        onRefresh={fetchAIRecommendations}
        onCook={handleCookAIRec}
        onViewRecipe={handleViewRecipe}
      />

      <CookIngredientsModal
        visible={cookModalVisible}
        recipeTitle={selectedRecipe?.title ?? 'Recipe'}
        ingredients={selectedRecipe ? getRecipeIngredients(selectedRecipe.id) : []}
        products={products}
        onCancel={() => {
          setCookModalVisible(false);
          setSelectedRecipe(null);
        }}
        onConfirm={handleConfirmCook}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  banner: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bannerIcon: {
    width: 80,
    height: 80,
    backgroundColor: '#FFF5F1',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  userName: {
    marginTop: 4,
    fontSize: 12,
    color: '#777',
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
});
