import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useState } from 'react';
import {
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Button } from '../components/Button';
import { CookIngredientsModal } from '../components/CookIngredientsModal';
import { RecipeCard } from '../components/RecipeCard';
import { useAppContext } from '../context/AppContext';
import { useAuthContext } from '../context/AuthContext';
import type { Recipe } from '../db/types';

export default function HomeScreen() {
  const { recipes, products, cookRecipeWithIngredients, getRecipeIngredients } = useAppContext();
  const { user, logout } = useAuthContext();
  const [cookModalVisible, setCookModalVisible] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const getTimeOfDay = (): 'Breakfast' | 'Lunch' | 'Dinner' => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Breakfast';
    if (hour < 18) return 'Lunch';
    return 'Dinner';
  };

  const canCookRecipe = useCallback((recipe: Recipe): boolean => {
    // Check if all required ingredients are available in the pantry with sufficient quantity
    const ingredients = getRecipeIngredients(recipe.id);
    
    if (ingredients.length === 0) {
      // Recipe has no ingredients defined, can still cook it
      return true;
    }
    
    // Check if all ingredients exist in products with sufficient quantity
    return ingredients.every((ingredient) => {
      const product = products.find(
        (p) => p.name.toLowerCase() === ingredient.product_name.toLowerCase()
      );
      return product && product.quantity >= ingredient.amount_required;
    });
  }, [getRecipeIngredients, products]);

  const recommendedRecipes = useMemo(() => {
    const timeOfDay = getTimeOfDay();
    const categoryMap: Record<string, string[]> = {
      Breakfast: ['Breakfast'],
      Lunch: ['Main Course'],
      Dinner: ['Main Course'],
    };

    const preferredCategories = categoryMap[timeOfDay] || [];

    const scored = recipes
      .filter((recipe) => canCookRecipe(recipe))
      .map((recipe) => {
        const matchesCategory = preferredCategories.includes(recipe.category);

        let score = recipe.times_cooked;
        if (matchesCategory) score += 1000;
        score += 500;

        return {
          recipe,
          score,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((entry) => entry.recipe);

    return scored;
  }, [canCookRecipe, recipes]);

  const mostCooked = useMemo(() => {
    return recipes
      .filter((r) => r.times_cooked > 0)
      .sort((a, b) => b.times_cooked - a.times_cooked)
      .slice(0, 5);
  }, [recipes]);

  const timeOfDay = getTimeOfDay();

  const openCookModal = (recipe: Recipe) => {
    if (!canCookRecipe(recipe)) return;
    setSelectedRecipe(recipe);
    setCookModalVisible(true);
  };

  const handleConfirmCook = async (usedIngredients: { productName: string; amountUsed: number }[]) => {
    if (!selectedRecipe) return;
    await cookRecipeWithIngredients(selectedRecipe.id, usedIngredients);
    setCookModalVisible(false);
    setSelectedRecipe(null);
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined'
        ? window.confirm('Do you want to sign out from this account?')
        : true;

      if (confirmed) {
        void logout();
      }

      return;
    }

    Alert.alert('Logout', 'Do you want to sign out from this account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          void logout();
        },
      },
    ]);
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

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#FF6347" />
          </TouchableOpacity>
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

      {/* Recommended for You */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recommended for You</Text>
        {recommendedRecipes.length > 0 ? (
          <View>
            {recommendedRecipes.map((recipe) => (
              <View key={recipe.id} style={styles.recommendedCard}>
                <RecipeCard recipe={recipe} />
                <Button
                  title="Let's Cook!"
                  variant="primary"
                  onPress={() => openCookModal(recipe)}
                />
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="sad-outline" size={48} color="#ddd" />
            <Text style={styles.emptyText}>No recipes available</Text>
            <Text style={styles.emptySubText}>
              Create recipes or add products to get recommendations
            </Text>
          </View>
        )}
      </View>

      {/* Most Cooked */}
      {mostCooked.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Favorites</Text>
          <View style={styles.favoritesList}>
            {mostCooked.map((recipe) => (
              <View key={recipe.id} style={styles.favoriteItem}>
                <View style={styles.favoriteInfo}>
                  <Text style={styles.favoriteName} numberOfLines={1}>
                    {recipe.title}
                  </Text>
                  <View style={styles.favoriteStats}>
                    <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                    <Text style={styles.favoriteCount}>Cooked {recipe.times_cooked}x</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => openCookModal(recipe)}
                  style={styles.cookButton}
                >
                  <Ionicons name="play-circle-outline" size={24} color="#FF6347" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}

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
  logoutButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#FFF5F1',
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
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  recommendedCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    elevation: 2,
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 32,
    alignItems: 'center',
    elevation: 2,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
  },
  emptySubText: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
    paddingHorizontal: 24,
    textAlign: 'center',
  },
  favoritesList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  favoriteItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  favoriteInfo: {
    flex: 1,
    marginRight: 12,
  },
  favoriteName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  favoriteStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  favoriteCount: {
    fontSize: 12,
    color: '#999',
  },
  cookButton: {
    padding: 8,
  },
});
