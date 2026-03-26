import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppContext } from '../context/AppContext';
import type { Recipe } from '../db/types';

interface RecipeCardWithStatusProps {
  recipe: Recipe;
  onPress?: (recipe: Recipe) => void;
}

export const RecipeCardWithStatus: React.FC<RecipeCardWithStatusProps> = ({
  recipe,
  onPress,
}) => {
  const { products, getRecipeIngredients } = useAppContext();
  const imageUri = recipe.image_data || recipe.image_url;

  const getMissingIngredients = () => {
    const ingredients = getRecipeIngredients(recipe.id);
    
    if (ingredients.length === 0) {
      return [];
    }

    return ingredients.filter((ingredient) => {
      const product = products.find(
        (p) => p.name.toLowerCase() === ingredient.product_name.toLowerCase()
      );
      return !product || product.quantity < ingredient.amount_required;
    });
  };

  const missingIngredients = getMissingIngredients();
  const canCook = missingIngredients.length === 0;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress?.(recipe)}
      activeOpacity={0.7}
    >
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : null}
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{recipe.title}</Text>
          <View style={[styles.statusBadge, canCook ? styles.statusReady : styles.statusMissing]}>
            <Ionicons
              name={canCook ? 'checkmark-circle' : 'alert-circle'}
              size={14}
              color="#fff"
              style={styles.badgeIcon}
            />
            <Text style={styles.statusText}>{canCook ? 'Ready' : 'Missing'}</Text>
          </View>
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {recipe.description}
        </Text>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={14} color="#666" />
            <Text style={styles.infoText}>{recipe.cooking_time} mins</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-done" size={14} color="#666" />
            <Text style={styles.infoText}>{recipe.times_cooked}x cooked</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="pricetag" size={14} color="#666" />
            <Text style={styles.infoText}>{recipe.category}</Text>
          </View>
        </View>

        {!canCook && (
          <View style={styles.missingSection}>
            <Text style={styles.missingLabel}>Missing {missingIngredients.length} ingredient{missingIngredients.length !== 1 ? 's' : ''}</Text>
            <View style={styles.missingList}>
              {missingIngredients.slice(0, 2).map((ing, idx) => (
                <Text key={idx} style={styles.missingItem}>
                  • {ing.product_name}
                </Text>
              ))}
              {missingIngredients.length > 2 && (
                <Text style={styles.missingItem}>• +{missingIngredients.length - 2} more</Text>
              )}
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: {
    width: '100%',
    height: 150,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    marginLeft: 8,
  },
  statusReady: {
    backgroundColor: '#4CAF50',
  },
  statusMissing: {
    backgroundColor: '#FF9800',
  },
  badgeIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  description: {
    fontSize: 13,
    color: '#666',
    marginBottom: 10,
    lineHeight: 18,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
  },
  missingSection: {
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
  },
  missingLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E65100',
    marginBottom: 6,
  },
  missingList: {
    gap: 4,
  },
  missingItem: {
    fontSize: 11,
    color: '#E65100',
    lineHeight: 16,
  },
});
