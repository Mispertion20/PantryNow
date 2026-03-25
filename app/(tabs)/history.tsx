import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useAppContext } from '../context/AppContext';
import * as db from '../db';
import type { HistoryItem } from '../db/types';

type UsedProduct = {
  name: string;
  amount: number;
  unit: string;
};

type HistoryDetail = HistoryItem & {
  recipeTitle: string;
  usedProducts: UsedProduct[];
};

export default function StatsScreen() {
  const { recipes, products, likedRecipes, toggleRecipeLike } = useAppContext();

  const stats = useMemo(() => {
    const totalRecipesCooked = recipes.reduce((sum, r) => sum + r.times_cooked, 0);
    const mostCooked = [...recipes].sort((a, b) => b.times_cooked - a.times_cooked);
    const favoriteRecipe = mostCooked[0];
    const avgCookingTime =
      recipes.length > 0
        ? Math.round(recipes.reduce((sum, r) => sum + r.cooking_time, 0) / recipes.length)
        : 0;

    return {
      totalRecipesCooked,
      favoriteRecipe,
      avgCookingTime,
      mostCooked: mostCooked.slice(0, 5),
    };
  }, [recipes]);


  // Cooked history state
  const [cookingHistory, setCookingHistory] = useState<HistoryItem[]>([]);
  const [historyDetails, setHistoryDetails] = useState<HistoryDetail[]>([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await db.getCookingHistory();
        setCookingHistory(history);
      } catch (error) {
        console.error('Failed to load cooking history:', error);
      }
    };
    fetchHistory();
  }, []);

  useEffect(() => {
    const details = cookingHistory.map((item) => {
      const fallbackRecipeTitle = recipes.find((r) => r.id === item.recipe_id)?.title || 'Unknown Recipe';
      const recipeTitle = item.recipe_title || fallbackRecipeTitle;
      const usedProducts: UsedProduct[] = Array.isArray(item.used_ingredients)
        ? item.used_ingredients.map((ingredient) => ({
            name: ingredient.product_name,
            amount: ingredient.amount_used,
            unit: ingredient.unit || '',
          }))
        : [];

      return {
        ...item,
        recipeTitle,
        usedProducts,
      };
    });

    setHistoryDetails(details);
  }, [cookingHistory, recipes]);

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Statistics</Text>
      </View>

      {/* Overall Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <View style={styles.statIconContainer}>
            <Ionicons name="checkmark-circle" size={32} color="#4CAF50" />
          </View>
          <Text style={styles.statValue}>{stats.totalRecipesCooked}</Text>
          <Text style={styles.statLabel}>Recipes Cooked</Text>
        </View>

        <View style={styles.statBox}>
          <View style={styles.statIconContainer}>
            <Ionicons name="time" size={32} color="#2196F3" />
          </View>
          <Text style={styles.statValue}>{stats.avgCookingTime}</Text>
          <Text style={styles.statLabel}>Avg Cook Time (min)</Text>
        </View>

        <View style={styles.statBox}>
          <View style={styles.statIconContainer}>
            <Ionicons name="cube-outline" size={32} color="#FF9800" />
          </View>
          <Text style={styles.statValue}>{products.length}</Text>
          <Text style={styles.statLabel}>Total Products</Text>
        </View>


      </View>

      {/* Favorite Recipe */}
      {stats.favoriteRecipe && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Favorite</Text>
          <View style={styles.favoriteCard}>
            <View style={styles.favoriteIcon}>
              <Ionicons name="heart" size={32} color="#FF6347" />
            </View>
            <View style={styles.favoriteContent}>
              <Text style={styles.favoriteName} numberOfLines={1}>
                {stats.favoriteRecipe.title}
              </Text>
              <Text style={styles.favoriteDetail}>
                Cooked {stats.favoriteRecipe.times_cooked} times
              </Text>
              <Text style={styles.favoriteCategory}>
                {stats.favoriteRecipe.category} • {stats.favoriteRecipe.cooking_time} min
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Most Cooked Recipes */}
      {stats.mostCooked.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Most Cooked Recipes</Text>
          <View style={styles.list}>
            {stats.mostCooked.map((recipe, index) => (
              <View key={recipe.id} style={styles.listItem}>
                <View style={styles.listRank}>
                  <Text style={styles.listRankText}>#{index + 1}</Text>
                </View>
                <View style={styles.listContent}>
                  <Text style={styles.listTitle} numberOfLines={1}>
                    {recipe.title}
                  </Text>
                  <Text style={styles.listSubtitle}>
                    Cooked {recipe.times_cooked}x • {recipe.cooking_time} min
                  </Text>
                </View>
                <View style={styles.listCount}>
                  <Text style={styles.listCountText}>{recipe.times_cooked}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Liked Recipes */}
      {likedRecipes.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Liked Recipes</Text>
          <View style={styles.list}>
            {likedRecipes.map((recipe) => (
              <View key={recipe.id} style={styles.listItem}>
                <View style={styles.historyContent}>
                  <Text style={styles.listTitle} numberOfLines={1}>
                    {recipe.title}
                  </Text>
                  <Text style={styles.listSubtitle}>
                    {recipe.category} • {recipe.cooking_time} min • Cooked {recipe.times_cooked}x
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.unlikeButton}
                  onPress={() => {
                    void toggleRecipeLike(recipe.id);
                  }}
                >
                  <Ionicons name="heart" size={18} color="#E91E63" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}




      {/* Cooking History */}
      {historyDetails.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cooking History</Text>
          <View style={styles.list}>
            {historyDetails.map((item) => (
              <View key={item.id} style={styles.listItem}>
                <View style={styles.historyContent}>
                  <Text style={styles.listTitle} numberOfLines={1}>
                    {item.recipeTitle}
                  </Text>
                  <Text style={styles.listSubtitle}>
                    Cooked at: {new Date(item.cooked_at).toLocaleString()}
                  </Text>
                  {item.usedProducts.length > 0 && (
                    <View style={styles.usedProductsBlock}>
                      <Text style={styles.usedProductsTitle}>Products used:</Text>
                      {item.usedProducts.map((prod, idx) => (
                        <Text key={`${prod.name}-${idx}`} style={styles.usedProductLine}>
                          • {prod.name}: {prod.amount} {prod.unit}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    paddingVertical: 12,
    gap: 8,
  },
  statBox: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    elevation: 2,
  },
  statIconContainer: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  favoriteCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  favoriteIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF5F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  favoriteContent: {
    flex: 1,
  },
  favoriteName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  favoriteDetail: {
    fontSize: 13,
    color: '#FF6347',
    marginTop: 4,
  },
  favoriteCategory: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  list: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  listRank: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF6347',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  listRankText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  listContent: {
    flex: 1,
  },
  listTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  listSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  listCount: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#FFF5F1',
    borderRadius: 6,
  },
  listCountText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF6347',
  },
  historyContent: {
    flex: 1,
  },
  usedProductsBlock: {
    marginTop: 4,
  },
  usedProductsTitle: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  usedProductLine: {
    fontSize: 12,
    color: '#666',
  },
  unlikeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF1F6',
  },
  alertList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  alertIcon: {
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  alertQuantity: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  productList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  productQuantity: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  productStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  productStatusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});