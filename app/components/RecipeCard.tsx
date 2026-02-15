import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Recipe } from '../db/types';

import { ConfirmDialog } from './ConfirmDialog';

interface RecipeCardProps {
  recipe: Recipe;
  onPress?: (recipe: Recipe) => void;
  onEdit?: (recipe: Recipe) => void;
  onDelete?: (id: number) => Promise<void>;
  showActions?: boolean;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  onPress,
  onEdit,
  onDelete,
  showActions = false,
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const imageUri = recipe.image_data || recipe.image_url;
  
  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setShowDeleteDialog(false);
      if (onDelete) await onDelete(recipe.id);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.card}
        onPress={() => onPress?.(recipe)}
        disabled={!onPress}
      >
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : null}
        <View style={styles.content}>
          <Text style={styles.title}>{recipe.title}</Text>
          <Text style={styles.description} numberOfLines={2}>
            {recipe.description}
          </Text>
          <View style={styles.footer}>
            <Text style={styles.category}>{recipe.category}</Text>
            <Text style={styles.cookCount}>Cooked: {recipe.times_cooked}x</Text>
          </View>
        </View>
        {showActions && (onEdit || onDelete) && (
          <View style={styles.actions}>
            {onEdit && (
              <TouchableOpacity onPress={() => onEdit(recipe)} style={styles.iconButton}>
                <Ionicons name="pencil" size={20} color="#FF6347" />
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity onPress={handleDelete} style={styles.iconButton}>
                <Ionicons name="trash" size={20} color="#dc3545" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </TouchableOpacity>

      <ConfirmDialog
        visible={showDeleteDialog}
        title="Delete Recipe"
        message={`Are you sure you want to delete "${recipe.title}"?`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteDialog(false)}
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous
      />
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 140,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  category: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  cookCount: {
    fontSize: 12,
    color: '#FF6347',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    justifyContent: 'flex-end',
  },
  iconButton: {
    padding: 4,
  },
});
