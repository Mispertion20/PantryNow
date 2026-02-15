import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useAppContext } from '../context/AppContext';
import type { RecipeIngredient } from '../db/types';
import { Button } from './Button';
import { ConfirmDialog } from './ConfirmDialog';
import { InputField } from './InputField';

interface IngredientManagerProps {
  recipeId: number;
  ingredients: RecipeIngredient[];
}

export const IngredientManager: React.FC<IngredientManagerProps> = ({
  recipeId,
  ingredients,
}) => {
  const { addRecipeIngredient, updateRecipeIngredient, deleteRecipeIngredient } =
    useAppContext();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<RecipeIngredient | null>(null);
  const [ingredientToDelete, setIngredientToDelete] = useState<RecipeIngredient | null>(null);
  const [formData, setFormData] = useState({ productName: '', amountRequired: '' });

  const handleOpenModal = (ingredient?: RecipeIngredient) => {
    if (ingredient) {
      setEditingIngredient(ingredient);
      setFormData({
        productName: ingredient.product_name,
        amountRequired: ingredient.amount_required.toString(),
      });
    } else {
      setEditingIngredient(null);
      setFormData({ productName: '', amountRequired: '' });
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.productName.trim() || !formData.amountRequired.trim()) {
      alert('Please fill in all fields');
      return;
    }

    const amountRequired = parseFloat(formData.amountRequired);
    if (isNaN(amountRequired)) {
      alert('Amount must be a number');
      return;
    }

    try {
      if (editingIngredient) {
        await updateRecipeIngredient(
          editingIngredient.id,
          formData.productName,
          amountRequired
        );
      } else {
        await addRecipeIngredient(recipeId, formData.productName, amountRequired);
      }

      setEditingIngredient(null);
      setFormData({ productName: '', amountRequired: '' });
      setModalVisible(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to save ingredient');
    }
  };

  const handleDelete = (ingredient: RecipeIngredient) => {
    setIngredientToDelete(ingredient);
  };

  const confirmDelete = async () => {
    if (!ingredientToDelete) return;

    try {
      await deleteRecipeIngredient(ingredientToDelete.id);
      setIngredientToDelete(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete ingredient');
    }
  };

  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.title}>Ingredients</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => handleOpenModal()}
        >
          <Ionicons name="add" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {ingredients.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No ingredients added yet</Text>
          <Text style={styles.emptySubText}>Tap + to add ingredients</Text>
        </View>
      ) : (
        <View>
          {ingredients.map((item) => (
            <View key={item.id} style={styles.ingredientItem}>
              <View style={styles.ingredientInfo}>
                <Text style={styles.ingredientName}>{item.product_name}</Text>
                <Text style={styles.ingredientAmount}>{item.amount_required}</Text>
              </View>
              <View style={styles.ingredientActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleOpenModal(item)}
                >
                  <Ionicons name="pencil" size={16} color="#2196F3" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDelete(item)}
                >
                  <Ionicons name="trash" size={16} color="#F44336" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingIngredient ? 'Edit Ingredient' : 'Add Ingredient'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <InputField
                label="Product Name"
                value={formData.productName}
                onChangeText={(text) => setFormData({ ...formData, productName: text })}
                placeholder="e.g., Pasta, Eggs, Butter"
              />

              <InputField
                label="Amount Required"
                value={formData.amountRequired}
                onChangeText={(text) => setFormData({ ...formData, amountRequired: text })}
                placeholder="e.g., 500"
                keyboardType="decimal-pad"
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setModalVisible(false)}
              />
              <Button
                title={editingIngredient ? 'Update' : 'Add'}
                variant="primary"
                onPress={handleSave}
              />
            </View>
          </View>
        </View>
      </Modal>

      <ConfirmDialog
        visible={!!ingredientToDelete}
        title="Delete Ingredient"
        message={ingredientToDelete ? `Delete ${ingredientToDelete.product_name}?` : 'Delete ingredient?'}
        onConfirm={confirmDelete}
        onCancel={() => setIngredientToDelete(null)}
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous
      />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#FF6347',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  emptySubText: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 4,
  },
  ingredientItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 3,
    borderLeftColor: '#FF6347',
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  ingredientAmount: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  ingredientActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '95%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalBody: {
    padding: 16,
  },
  modalFooter: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    flexDirection: 'row',
    gap: 8,
  },
});
