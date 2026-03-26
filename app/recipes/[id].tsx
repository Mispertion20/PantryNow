import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button } from '@/components/Button';
import { CookIngredientsModal } from '@/components/CookIngredientsModal';
import { useAppContext } from '@/context/AppContext';
import type { AIRecipeInstructions } from '@/db/types';
import { apiRequest } from '@/lib/api';

export default function RecipeDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const {
    recipes,
    products,
    getRecipeIngredients,
    cookRecipeWithIngredients,
    isRecipeLiked,
    toggleRecipeLike,
  } = useAppContext();
  const [cookModalVisible, setCookModalVisible] = useState(false);
  const [aiInstructions, setAiInstructions] = useState<AIRecipeInstructions | null>(null);
  const [aiInstructionsLoading, setAiInstructionsLoading] = useState(false);
  const [aiInstructionsError, setAiInstructionsError] = useState<string | null>(null);

  const recipe = useMemo(() => {
    return recipes.find((r) => r.id === Number(id));
  }, [recipes, id]);

  const recipeIngredients = useMemo(() => {
    if (!recipe) return [];
    return getRecipeIngredients(recipe.id);
  }, [recipe, getRecipeIngredients]);

  const missingIngredients = useMemo(() => {
    return recipeIngredients.filter((ingredient) => {
      const product = products.find(
        (p) => p.name.toLowerCase() === ingredient.product_name.toLowerCase()
      );
      return !product || product.quantity < ingredient.amount_required;
    });
  }, [recipeIngredients, products]);

  const canCook = missingIngredients.length === 0;
  const liked = recipe ? isRecipeLiked(recipe.id) : false;

  const fetchAiInstructions = async () => {
    if (!recipe) return;

    setAiInstructionsLoading(true);
    setAiInstructionsError(null);
    try {
      const response = await apiRequest<{ data: AIRecipeInstructions }>('/ai/recipe-instructions', {
        method: 'POST',
        body: { recipe_id: recipe.id },
      });
      setAiInstructions(response.data);
    } catch (error) {
      setAiInstructionsError(error instanceof Error ? error.message : 'Failed to generate instructions');
    } finally {
      setAiInstructionsLoading(false);
    }
  };

  useEffect(() => {
    if (!recipe) return;
    void fetchAiInstructions();
  }, [recipe?.id]);

  if (!recipe) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recipe Not Found</Text>
          <View style={styles.headerPlaceholder} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#ddd" />
          <Text style={styles.emptyText}>Recipe not found</Text>
        </View>
      </View>
    );
  }

  const imageUri = recipe.image_data || recipe.image_url;

  const handleCook = async () => {
    setCookModalVisible(true);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recipe Details</Text>
        <TouchableOpacity
          style={styles.likeButton}
          onPress={() => {
            if (!recipe) return;
            void toggleRecipeLike(recipe.id);
          }}
        >
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={22} color={liked ? '#E91E63' : '#555'} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Recipe Title & Status Banner */}
        <View style={styles.bannerSection}>
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.recipeImage}
              resizeMode="cover"
            />
          ) : null}
          <View style={styles.titleSection}>
            <Text style={styles.recipeTitle}>{recipe.title}</Text>
            <View
              style={[
                styles.largeBadge,
                canCook ? styles.largeBadgeReady : styles.largeBadgeMissing,
              ]}
            >
              <Ionicons
                name={canCook ? 'checkmark-circle' : 'alert-circle'}
                size={20}
                color="#fff"
              />
              <Text style={styles.largeBadgeText}>{canCook ? 'Ready to Cook' : 'Missing Ingredients'}</Text>
            </View>
          </View>
        </View>

        {/* Recipe Info Cards */}
        <View style={styles.infoCardsSection}>
          <View style={styles.infoCard}>
            <Ionicons name="time-outline" size={24} color="#FF6347" />
            <View>
              <Text style={styles.infoLabel}>Cooking Time</Text>
              <Text style={styles.infoValue}>{recipe.cooking_time} minutes</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="checkmark-done-circle" size={24} color="#4CAF50" />
            <View>
              <Text style={styles.infoLabel}>Times Cooked</Text>
              <Text style={styles.infoValue}>{recipe.times_cooked}x</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="pricetag-outline" size={24} color="#2196F3" />
            <View>
              <Text style={styles.infoLabel}>Category</Text>
              <Text style={styles.infoValue}>{recipe.category}</Text>
            </View>
          </View>
        </View>

        {/* Description */}
        {recipe.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <View style={styles.descriptionBox}>
              <Text style={styles.descriptionText}>{recipe.description}</Text>
            </View>
          </View>
        )}

        {/* Ingredients Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Ingredients ({recipeIngredients.length})
          </Text>

          {recipeIngredients.length === 0 ? (
            <View style={styles.emptyIngredientsBox}>
              <Ionicons name="leaf-outline" size={32} color="#ddd" />
              <Text style={styles.emptyIngredientsText}>No ingredients added yet</Text>
            </View>
          ) : (
            <View>
              {recipeIngredients.map((ingredient, idx) => {
                const product = products.find(
                  (p) => p.name.toLowerCase() === ingredient.product_name.toLowerCase()
                );
                const isAvailable = product && product.quantity >= ingredient.amount_required;

                return (
                  <View key={idx} style={styles.ingredientItem}>
                    <View style={styles.ingredientInfo}>
                      <View
                        style={[
                          styles.ingredientDot,
                          isAvailable ? styles.ingredientDotAvailable : styles.ingredientDotMissing,
                        ]}
                      />
                      <View style={styles.ingredientDetails}>
                        <Text style={styles.ingredientName}>{ingredient.product_name}</Text>
                        <Text style={styles.ingredientAmount}>
                          Required: {ingredient.amount_required} {product?.unit || ''}
                        </Text>
                        {product && (
                          <Text style={[
                            styles.ingredientStock,
                            isAvailable ? styles.ingredientStockOk : styles.ingredientStockMissing,
                          ]}>
                            Available: {product.quantity} {product.unit}
                          </Text>
                        )}
                        {!product && (
                          <Text style={styles.ingredientStockMissing}>
                            Not in pantry
                          </Text>
                        )}
                      </View>
                    </View>
                    {!isAvailable && (
                      <Ionicons name="alert-circle" size={20} color="#FF9800" />
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Missing Ingredients Section */}
        {missingIngredients.length > 0 && (
          <View style={styles.section}>
            <View style={styles.missingHeaderBox}>
              <Ionicons name="warning-outline" size={20} color="#FF6347" />
              <Text style={styles.missingSectionTitle}>Missing Ingredients</Text>
            </View>

            <View style={styles.missingIngredientsBox}>
              {missingIngredients.map((ingredient, idx) => (
                <View key={idx} style={styles.missingIngredientItem}>
                  <Ionicons name="close-circle" size={18} color="#FF6347" />
                  <View style={styles.missingIngredientInfo}>
                    <Text style={styles.missingIngredientName}>{ingredient.product_name}</Text>
                    <Text style={styles.missingIngredientDetail}>
                      Need: {ingredient.amount_required}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.aiSectionHeader}>
            <Text style={styles.sectionTitle}>AI Cooking Instructions</Text>
            <TouchableOpacity
              style={styles.aiRefreshButton}
              onPress={() => {
                void fetchAiInstructions();
              }}
              disabled={aiInstructionsLoading}
            >
              <Ionicons name="refresh" size={14} color="#6A1B9A" />
              <Text style={styles.aiRefreshText}>{aiInstructionsLoading ? 'Generating...' : 'Regenerate'}</Text>
            </TouchableOpacity>
          </View>

          {aiInstructionsLoading ? (
            <View style={styles.aiLoadingBox}>
              <ActivityIndicator size="small" color="#6A1B9A" />
              <Text style={styles.aiLoadingText}>Generating personalized instructions...</Text>
            </View>
          ) : aiInstructionsError ? (
            <View style={styles.aiErrorBox}>
              <Text style={styles.aiErrorText}>{aiInstructionsError}</Text>
              <TouchableOpacity
                onPress={() => {
                  void fetchAiInstructions();
                }}
                style={styles.aiRetryButton}
              >
                <Text style={styles.aiRetryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : aiInstructions ? (
            <View style={styles.aiInstructionsBox}>
              {aiInstructions.intro ? <Text style={styles.aiIntroText}>{aiInstructions.intro}</Text> : null}

              {aiInstructions.steps.map((step, index) => (
                <View key={`ai-step-${index}`} style={styles.aiStepRow}>
                  <View style={styles.aiStepBadge}>
                    <Text style={styles.aiStepBadgeText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.aiStepText}>{step}</Text>
                </View>
              ))}

              {aiInstructions.tips.length > 0 ? (
                <View style={styles.aiTipsBox}>
                  <Text style={styles.aiTipsTitle}>Tips</Text>
                  {aiInstructions.tips.map((tip, index) => (
                    <View key={`ai-tip-${index}`} style={styles.aiTipRow}>
                      <Text style={styles.aiTipBullet}>•</Text>
                      <Text style={styles.aiTipText}>{tip}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {aiInstructions.personalization_note ? (
                <Text style={styles.aiPersonalizationNote}>{aiInstructions.personalization_note}</Text>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Spacer */}
        <View style={styles.spacer} />
      </ScrollView>

      {/* Footer Button */}

      <View style={styles.footer}>
        <Button
          title={canCook ? "Let's Cook!" : 'Cook Anyway'}
          variant="primary"
          onPress={handleCook}
        />
      </View>

      <CookIngredientsModal
        visible={cookModalVisible}
        recipeTitle={recipe.title}
        ingredients={recipeIngredients}
        products={products}
        onCancel={() => setCookModalVisible(false)}
        onConfirm={async (usedIngredients) => {
          await cookRecipeWithIngredients(recipe.id, usedIngredients);
          setCookModalVisible(false);
          router.back();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  headerPlaceholder: {
    width: 36,
  },
  likeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F8',
  },
  scrollView: {
    flex: 1,
    paddingVertical: 16,
  },
  bannerSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  recipeImage: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#f0f0f0',
  },
  titleSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
  },
  recipeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  largeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 8,
  },
  largeBadgeReady: {
    backgroundColor: '#4CAF50',
  },
  largeBadgeMissing: {
    backgroundColor: '#FF9800',
  },
  largeBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  infoCardsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    elevation: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  aiSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  aiRefreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F3E5F5',
  },
  aiRefreshText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6A1B9A',
  },
  aiLoadingBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    elevation: 1,
  },
  aiLoadingText: {
    fontSize: 13,
    color: '#6A1B9A',
    fontWeight: '500',
  },
  aiErrorBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F8D7DA',
  },
  aiErrorText: {
    color: '#B42318',
    fontSize: 13,
    lineHeight: 18,
  },
  aiRetryButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: '#FEECE8',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  aiRetryButtonText: {
    color: '#B42318',
    fontSize: 12,
    fontWeight: '700',
  },
  aiInstructionsBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    elevation: 1,
  },
  aiIntroText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 19,
  },
  aiStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  aiStepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F3E5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  aiStepBadgeText: {
    color: '#6A1B9A',
    fontSize: 11,
    fontWeight: '700',
  },
  aiStepText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: '#333',
  },
  aiTipsBox: {
    marginTop: 2,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
    gap: 7,
  },
  aiTipsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  aiTipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  aiTipBullet: {
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 18,
  },
  aiTipText: {
    flex: 1,
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 18,
  },
  aiPersonalizationNote: {
    marginTop: 2,
    fontSize: 12,
    color: '#6A1B9A',
    lineHeight: 17,
  },
  descriptionBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 1,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  emptyIngredientsBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    elevation: 1,
  },
  emptyIngredientsText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
  ingredientItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 1,
  },
  ingredientInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ingredientDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  ingredientDotAvailable: {
    backgroundColor: '#4CAF50',
  },
  ingredientDotMissing: {
    backgroundColor: '#FF9800',
  },
  ingredientDetails: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  ingredientAmount: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  ingredientStock: {
    fontSize: 12,
    fontWeight: '500',
  },
  ingredientStockOk: {
    color: '#4CAF50',
  },
  ingredientStockMissing: {
    color: '#FF6347',
  },
  missingHeaderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  missingSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF6347',
  },
  missingIngredientsBox: {
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#FFCDD2',
  },
  missingIngredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#FFCDD2',
  },
  missingIngredientInfo: {
    flex: 1,
  },
  missingIngredientName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6347',
    marginBottom: 2,
  },
  missingIngredientDetail: {
    fontSize: 12,
    color: '#E53935',
  },
  spacer: {
    height: 20,
  },
  footer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    elevation: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
});