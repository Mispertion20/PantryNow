import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Button } from '@/components/Button';
import { IngredientManager } from '@/components/IngredientManager';
import { InputField } from '@/components/InputField';
import { RecipeCard } from '@/components/RecipeCard';
import { useAppContext } from '@/context/AppContext';
import type { Recipe, RecipeInput } from '@/db/types';

export default function MyRecipesScreen() {
  const { recipes, getRecipeIngredients, addRecipe, updateRecipe, deleteRecipe, recipeCategories } = useAppContext();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [showIngredientsOnly, setShowIngredientsOnly] = useState(false);
  const [formData, setFormData] = useState<RecipeInput>({
    title: '',
    description: '',
    image_url: '',
    image_data: '',
    category: recipeCategories[0] || 'Breakfast',
    cooking_time: 30,
  });

  const handleOpenModal = (recipe?: Recipe) => {
    if (recipe) {
      setEditingRecipe(recipe);
      setFormData({
        title: recipe.title,
        description: recipe.description,
        image_url: recipe.image_url || '',
        image_data: recipe.image_data || '',
        category: recipe.category,
        cooking_time: recipe.cooking_time,
      });
    } else {
      setEditingRecipe(null);
      setFormData({
        title: '',
        description: '',
        image_url: '',
        image_data: '',
        category: recipeCategories[0] || 'Breakfast',
        cooking_time: 30,
      });
    }
    setShowIngredientsOnly(false);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      alert('Recipe title is required');
      return;
    }

    if (editingRecipe) {
      await updateRecipe({
        ...editingRecipe,
        ...formData,
      });
      setModalVisible(false);
    } else {
      // When creating new recipe, save it first and get the ID
      const recipeId: number = await addRecipe(formData);
      // Immediately set editingRecipe and showIngredientsOnly so user can add ingredients
      setEditingRecipe({
        id: recipeId,
        title: formData.title,
        description: formData.description,
        image_url: formData.image_url || '',
        image_data: formData.image_data || '',
        category: formData.category,
        cooking_time: formData.cooking_time,
        times_cooked: 0,
      });
      setShowIngredientsOnly(true);
    }
  };

  const pickRecipeImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      alert('Permission required to access your media library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      base64: true,
      allowsEditing: true,
      aspect: [16, 9],
    });

    if (result.canceled || !result.assets?.[0]) {
      return;
    }

    const asset = result.assets[0];
    if (!asset.base64) {
      alert('Failed to read selected image. Please try another image.');
      return;
    }

    const mimeType = asset.mimeType || 'image/jpeg';
    const dataUri = `data:${mimeType};base64,${asset.base64}`;

    setFormData((prev) => ({
      ...prev,
      image_data: dataUri,
      image_url: '',
    }));
  };

  const removeRecipeImage = () => {
    setFormData((prev) => ({
      ...prev,
      image_data: '',
      image_url: '',
    }));
  };

  const userRecipes = recipes.filter((r) => !r.is_global);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Recipes</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => handleOpenModal()}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {userRecipes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="book-outline" size={64} color="#ddd" />
          <Text style={styles.emptyText}>No recipes yet</Text>
          <Text style={styles.emptySubText}>Create your first recipe to get started</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent}>
          {userRecipes.map((item) => (
            <RecipeCard
              key={item.id}
              recipe={item}
              onEdit={() => handleOpenModal(item)}
              onDelete={deleteRecipe}
              showActions
            />
          ))}
        </ScrollView>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            style={styles.modalContent}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {showIngredientsOnly && editingRecipe
                  ? `Ingredients for ${editingRecipe.title}`
                  : editingRecipe
                  ? 'Edit Recipe'
                  : 'Create Recipe'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            >
              {!showIngredientsOnly && (
                <>
                  <InputField
                    label="Recipe Title"
                    value={formData.title}
                    onChangeText={(text) => setFormData({ ...formData, title: text })}
                    placeholder="e.g., Spaghetti Carbonara"
                  />

                  <InputField
                    label="Description"
                    value={formData.description}
                    onChangeText={(text) => setFormData({ ...formData, description: text })}
                    placeholder="Tell us about your recipe..."
                    multiline
                  />

                  <View style={styles.imagePickerSection}>
                    <Text style={styles.label}>Recipe Image (optional)</Text>

                    {formData.image_data ? (
                      <Image
                        source={{ uri: formData.image_data }}
                        style={styles.imagePreview}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.imagePlaceholder}>
                        <Ionicons name="image-outline" size={28} color="#999" />
                        <Text style={styles.imagePlaceholderText}>No image selected</Text>
                      </View>
                    )}

                    <View style={styles.imageButtonsRow}>
                      <TouchableOpacity style={styles.imagePickerButton} onPress={pickRecipeImage}>
                        <Ionicons name="images-outline" size={16} color="#FF6347" />
                        <Text style={styles.imagePickerButtonText}>
                          {formData.image_data ? 'Change image' : 'Pick from device'}
                        </Text>
                      </TouchableOpacity>

                      {formData.image_data ? (
                        <TouchableOpacity style={styles.removeImageButton} onPress={removeRecipeImage}>
                          <Ionicons name="trash-outline" size={16} color="#fff" />
                          <Text style={styles.removeImageButtonText}>Remove</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>

                  <View>
                    <Text style={styles.label}>Category</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.categoryScroll}
                    >
                      {recipeCategories.map((cat) => (
                        <TouchableOpacity
                          key={cat}
                          style={[
                            styles.categoryButton,
                            formData.category === cat && styles.categoryButtonActive,
                          ]}
                          onPress={() => setFormData({ ...formData, category: cat })}
                        >
                          <Text
                            style={[
                              styles.categoryText,
                              formData.category === cat && styles.categoryTextActive,
                            ]}
                          >
                            {cat}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  <InputField
                    label="Cooking Time (minutes)"
                    value={formData.cooking_time.toString()}
                    onChangeText={(text) =>
                      setFormData({ ...formData, cooking_time: parseInt(text) || 0 })
                    }
                    keyboardType="numeric"
                  />
                </>
              )}

              {editingRecipe && (
                <>
                  {!showIngredientsOnly && <View style={styles.divider} />}
                  <IngredientManager
                    recipeId={editingRecipe.id}
                    ingredients={getRecipeIngredients(editingRecipe.id)}
                  />
                </>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              {showIngredientsOnly ? (
                <Button
                  title="Done"
                  variant="primary"
                  onPress={() => {
                    setShowIngredientsOnly(false);
                    setModalVisible(false);
                  }}
                />
              ) : (
                <>
                  <Button
                    title="Cancel"
                    variant="secondary"
                    onPress={() => setModalVisible(false)}
                  />
                  <Button
                    title={editingRecipe ? 'Update' : 'Create'}
                    variant="primary"
                    onPress={handleSave}
                  />
                </>
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
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
    paddingTop: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#FF6347',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
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
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  modalBody: {
    padding: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 16,
  },
  modalFooter: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    flexDirection: 'row',
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  categoryScroll: {
    marginVertical: 8,
  },
  categoryButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 36,
  },
  categoryButtonActive: {
    backgroundColor: '#FF6347',
    borderColor: '#FF6347',
  },
  categoryText: {
    fontSize: 13,
    color: '#666',
  },
  categoryTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  imagePickerSection: {
    marginBottom: 16,
  },
  imagePreview: {
    width: '100%',
    height: 160,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    marginBottom: 10,
  },
  imagePlaceholder: {
    height: 120,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#fafafa',
  },
  imagePlaceholderText: {
    marginTop: 6,
    fontSize: 13,
    color: '#999',
  },
  imageButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#FF6347',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#FFF5F1',
  },
  imagePickerButtonText: {
    color: '#FF6347',
    fontSize: 13,
    fontWeight: '600',
  },
  removeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#dc3545',
  },
  removeImageButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});