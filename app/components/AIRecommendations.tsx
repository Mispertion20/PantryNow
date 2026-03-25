import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ActivityIndicator,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import type { RecommendedRecipe } from '../db/types';

interface AIRecommendationsProps {
  recommendations: RecommendedRecipe[];
  reasoning: string;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onCook: (recipe: RecommendedRecipe) => void;
  onViewRecipe: (recipeId: number) => void;
}

const tagConfig: Record<string, { icon: string; color: string; label: string }> = {
  favourite: { icon: 'heart', color: '#E91E63', label: 'Favourite' },
  'pantry-ready': { icon: 'checkmark-circle', color: '#4CAF50', label: 'Ready' },
  'quick-meal': { icon: 'flash', color: '#00ACC1', label: 'Quick' },
  'meal-time-fit': { icon: 'restaurant', color: '#3F51B5', label: 'Meal Fit' },
  'new-discovery': { icon: 'sparkles', color: '#9C27B0', label: 'New' },
  'similar-taste': { icon: 'color-palette', color: '#FF9800', label: 'Similar' },
};

const TagBadge: React.FC<{ tag: string }> = ({ tag }) => {
  const config = tagConfig[tag] || { icon: 'pricetag', color: '#607D8B', label: tag };
  return (
    <View style={[styles.tag, { backgroundColor: config.color + '18' }]}>
      <Ionicons name={config.icon as any} size={11} color={config.color} />
      <Text style={[styles.tagText, { color: config.color }]}>{config.label}</Text>
    </View>
  );
};

const AvailabilityBar: React.FC<{ percentage: number; available: number; total: number }> = ({
  percentage,
  available,
  total,
}) => {
  const barColor = percentage === 100 ? '#4CAF50' : percentage >= 50 ? '#FF9800' : '#F44336';
  return (
    <View style={styles.availabilityContainer}>
      <View style={styles.availabilityBarBg}>
        <View style={[styles.availabilityBarFill, { width: `${percentage}%`, backgroundColor: barColor }]} />
      </View>
      <Text style={[styles.availabilityText, { color: barColor }]}>
        {available}/{total} ingredients
      </Text>
    </View>
  );
};

export const AIRecommendationsList: React.FC<AIRecommendationsProps> = ({
  recommendations,
  reasoning,
  loading,
  error,
  onRefresh,
  onCook,
  onViewRecipe,
}) => {
  const [selectedRecommendation, setSelectedRecommendation] = React.useState<RecommendedRecipe | null>(null);

  const getWhyThisRecipePoints = (rec: RecommendedRecipe): string[] => {
    if (Array.isArray(rec.why_this_recipe_points) && rec.why_this_recipe_points.length > 0) {
      return rec.why_this_recipe_points;
    }

    if (rec.why_this_recipe && rec.why_this_recipe.trim().length > 0) {
      return rec.why_this_recipe
        .split(/(?<=[.!?])\s+/)
        .map((point) => point.trim())
        .filter((point) => point.length > 0)
        .slice(0, 6);
    }

    const pantrySummary = rec.availability.total > 0
      ? `Pantry fit: ${rec.availability.available}/${rec.availability.total} ingredients are available.`
      : 'Pantry fit: this recipe has minimal tracked ingredient constraints.';

    return [
      rec.reason,
      pantrySummary,
      'Priority factors: pantry availability, meal-time fit, your history/favorites, and your saved goal.',
    ];
  };

  if (loading) {
    return (
      <View style={styles.section}>
        <View style={styles.headerRow}>
          <View style={styles.aiTitleRow}>
            <Ionicons name="sparkles" size={20} color="#9C27B0" />
            <Text style={styles.sectionTitle}>AI Recommendations</Text>
          </View>
        </View>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="small" color="#9C27B0" />
          <Text style={styles.loadingText}>Analysing your pantry & taste...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.section}>
        <View style={styles.headerRow}>
          <View style={styles.aiTitleRow}>
            <Ionicons name="sparkles" size={20} color="#9C27B0" />
            <Text style={styles.sectionTitle}>AI Recommendations</Text>
          </View>
          <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
            <Ionicons name="refresh" size={18} color="#9C27B0" />
          </TouchableOpacity>
        </View>
        <View style={styles.errorCard}>
          <Ionicons name="cloud-offline-outline" size={32} color="#ccc" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <View style={styles.aiTitleRow}>
          <Ionicons name="sparkles" size={20} color="#9C27B0" />
          <Text style={styles.sectionTitle}>AI Recommendations</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={18} color="#9C27B0" />
        </TouchableOpacity>
      </View>

      {reasoning ? (
        <View style={styles.reasoningBox}>
          <Ionicons name="bulb-outline" size={14} color="#9C27B0" />
          <Text style={styles.reasoningText}>{reasoning}</Text>
        </View>
      ) : null}

      {recommendations.map((rec, index) => {
        const imageUri = rec.recipe.image_data || rec.recipe.image_url;
        return (
          <TouchableOpacity
            key={rec.recipe.id}
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => onViewRecipe(rec.recipe.id)}
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.cardImage} resizeMode="cover" />
            ) : null}

            <View style={styles.cardBody}>
              {index === 0 && (
                <View style={styles.topPickBadge}>
                  <Ionicons name="trophy" size={12} color="#fff" />
                  <Text style={styles.topPickText}>Top Pick</Text>
                </View>
              )}

              <View style={styles.cardTopRow}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {rec.recipe.title}
                </Text>
              </View>

              <Text style={styles.cardReason} numberOfLines={3}>
                {rec.reason}
              </Text>

              <TouchableOpacity
                style={styles.whyButton}
                onPress={(event) => {
                  event.stopPropagation();
                  setSelectedRecommendation(rec);
                }}
              >
                <Ionicons name="help-circle-outline" size={15} color="#6A1B9A" />
                <Text style={styles.whyButtonText}>Why this recipe?</Text>
              </TouchableOpacity>

              {rec.tags.length > 0 && (
                <View style={styles.tagsRow}>
                  {rec.tags.map((tag) => (
                    <TagBadge key={tag} tag={tag} />
                  ))}
                </View>
              )}

              <View style={styles.cardMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={13} color="#999" />
                  <Text style={styles.metaText}>{rec.recipe.cooking_time} min</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="checkmark-done" size={13} color="#999" />
                  <Text style={styles.metaText}>{rec.recipe.times_cooked}x cooked</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="pricetag" size={13} color="#999" />
                  <Text style={styles.metaText}>{rec.recipe.category}</Text>
                </View>
              </View>

              {rec.availability.total > 0 && (
                <AvailabilityBar
                  percentage={rec.availability.percentage}
                  available={rec.availability.available}
                  total={rec.availability.total}
                />
              )}

              {rec.availability.percentage === 100 && (
                <TouchableOpacity
                  style={styles.cookButton}
                  onPress={() => onCook(rec)}
                >
                  <Ionicons name="flame" size={16} color="#fff" />
                  <Text style={styles.cookButtonText}>Let's Cook!</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        );
      })}

      <Modal
        visible={!!selectedRecommendation}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedRecommendation(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleWrap}>
                <Ionicons name="bulb-outline" size={18} color="#6A1B9A" />
                <Text style={styles.modalTitle}>Why this recipe?</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedRecommendation(null)} style={styles.modalCloseButton}>
                <Ionicons name="close" size={18} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalRecipeName} numberOfLines={2}>
              {selectedRecommendation?.recipe.title}
            </Text>

            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
              {selectedRecommendation
                ? getWhyThisRecipePoints(selectedRecommendation).map((point, index) => (
                    <View key={`${selectedRecommendation.recipe.id}-${index}`} style={styles.modalBulletRow}>
                      <Text style={styles.modalBullet}>•</Text>
                      <Text style={styles.modalBodyText}>{point}</Text>
                    </View>
                  ))
                : null}
            </ScrollView>

            <TouchableOpacity style={styles.modalActionButton} onPress={() => setSelectedRecommendation(null)}>
              <Text style={styles.modalActionText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshButton: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#F3E5F5',
  },
  reasoningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#F3E5F5',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  reasoningText: {
    flex: 1,
    fontSize: 12,
    color: '#6A1B9A',
    lineHeight: 18,
  },
  // Loading
  loadingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    elevation: 2,
  },
  loadingText: {
    fontSize: 13,
    color: '#999',
  },
  // Error
  errorCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    elevation: 2,
  },
  errorText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3E5F5',
  },
  retryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9C27B0',
  },
  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  topPickBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#9C27B0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  topPickText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  cardImage: {
    width: '100%',
    height: 130,
  },
  cardBody: {
    padding: 14,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginRight: 8,
  },
  cardReason: {
    fontSize: 12.5,
    color: '#666',
    lineHeight: 19,
    marginBottom: 6,
  },
  whyButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F3E5F5',
    marginBottom: 8,
  },
  whyButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6A1B9A',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 11,
    color: '#999',
  },
  // Availability bar
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  availabilityBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  availabilityBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  availabilityText: {
    fontSize: 11,
    fontWeight: '600',
    minWidth: 90,
    textAlign: 'right',
  },
  // Cook button
  cookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FF6347',
    borderRadius: 8,
    paddingVertical: 10,
    marginTop: 4,
  },
  cookButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    maxHeight: '70%',
    padding: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6A1B9A',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalRecipeName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
  },
  modalScroll: {
    maxHeight: 280,
  },
  modalScrollContent: {
    paddingBottom: 8,
  },
  modalBodyText: {
    flex: 1,
    fontSize: 13,
    color: '#444',
    lineHeight: 20,
  },
  modalBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 6,
  },
  modalBullet: {
    fontSize: 16,
    lineHeight: 20,
    color: '#6A1B9A',
  },
  modalActionButton: {
    marginTop: 12,
    backgroundColor: '#6A1B9A',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalActionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});
