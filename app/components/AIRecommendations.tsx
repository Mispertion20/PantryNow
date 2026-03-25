import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ActivityIndicator,
    Image,
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
            {index === 0 && (
              <View style={styles.topPickBadge}>
                <Ionicons name="trophy" size={12} color="#fff" />
                <Text style={styles.topPickText}>Top Pick</Text>
              </View>
            )}

            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.cardImage} resizeMode="cover" />
            ) : null}

            <View style={styles.cardBody}>
              <View style={styles.cardTopRow}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {rec.recipe.title}
                </Text>
                <View style={styles.scoreCircle}>
                  <Text style={styles.scoreText}>{rec.score}</Text>
                </View>
              </View>

              <Text style={styles.cardReason} numberOfLines={2}>
                {rec.reason}
              </Text>

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
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#9C27B0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
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
  scoreCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3E5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9C27B0',
  },
  cardReason: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 8,
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
});
