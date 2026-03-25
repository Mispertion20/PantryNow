import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Button } from '../components/Button';
import { InputField } from '../components/InputField';
import { ProductCard } from '../components/ProductCard';
import { useAppContext } from '../context/AppContext';
import type { AIShoppingRecommendations, Product, ShoppingSuggestion } from '../db/types';
import { apiRequest } from '../lib/api';

export default function ProductsScreen() {
  const { products, loading, addProduct, updateProduct, deleteProduct } = useAppContext();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({ name: '', quantity: '', unit: 'g' });

  const [shoppingLoading, setShoppingLoading] = useState(false);
  const [shoppingError, setShoppingError] = useState<string | null>(null);
  const [shoppingReasoning, setShoppingReasoning] = useState('');
  const [shoppingSuggestions, setShoppingSuggestions] = useState<ShoppingSuggestion[]>([]);
  const [detailsSuggestion, setDetailsSuggestion] = useState<ShoppingSuggestion | null>(null);
  const [isAISectionCollapsed, setIsAISectionCollapsed] = useState(false);

  const units = ['g', 'kg', 'ml', 'l', 'pc', 'cup', 'tbsp'];

  const fetchShoppingSuggestions = useCallback(async () => {
    setShoppingLoading(true);
    setShoppingError(null);
    try {
      const response = await apiRequest<{ data: AIShoppingRecommendations }>('/ai/shopping-recommendations', {
        method: 'POST',
      });
      setShoppingSuggestions(response.data.suggestions || []);
      setShoppingReasoning(response.data.reasoning || '');
    } catch (error) {
      setShoppingError(error instanceof Error ? error.message : 'Failed to load buy recommendations');
    } finally {
      setShoppingLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading) {
      void fetchShoppingSuggestions();
    }
  }, [loading, fetchShoppingSuggestions, products.length]);

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        quantity: product.quantity.toString(),
        unit: product.unit,
      });
    } else {
      setEditingProduct(null);
      setFormData({ name: '', quantity: '', unit: 'g' });
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.quantity.trim()) {
      alert('Please fill in all fields');
      return;
    }

    const quantity = parseFloat(formData.quantity);
    if (isNaN(quantity)) {
      alert('Quantity must be a number');
      return;
    }

    if (editingProduct) {
      await updateProduct(editingProduct.id, {
        name: formData.name.trim(),
        quantity,
        unit: formData.unit,
      });
    } else {
      await addProduct(formData.name.trim(), quantity, formData.unit);
    }

    setModalVisible(false);
    setFormData({ name: '', quantity: '', unit: 'g' });
    void fetchShoppingSuggestions();
  };

  const handleAddSuggestionToPantry = async (suggestion: ShoppingSuggestion) => {
    const existing = products.find(
      (product) => product.name.trim().toLowerCase() === suggestion.product_name.trim().toLowerCase()
    );

    if (existing) {
      await updateProduct(existing.id, {
        quantity: existing.quantity + suggestion.suggested_amount,
        unit: existing.unit || suggestion.unit,
      });
    } else {
      await addProduct(suggestion.product_name, suggestion.suggested_amount, suggestion.unit);
    }

    setDetailsSuggestion(null);
    void fetchShoppingSuggestions();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF6347" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Products</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => handleOpenModal()}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.listContent}>
        <View style={styles.aiSection}>
          <View style={styles.aiSectionHeader}>
            <View style={styles.aiTitleRow}>
              <Ionicons name="sparkles" size={20} color="#9C27B0" />
              <Text style={styles.aiSectionTitle}>AI Buy Recommendations</Text>
            </View>
            <View style={styles.aiHeaderActions}>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={() => {
                  void fetchShoppingSuggestions();
                }}
              >
                <Ionicons name="refresh" size={16} color="#9C27B0" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.collapseButton}
                onPress={() => setIsAISectionCollapsed((prev) => !prev)}
              >
                <Ionicons
                  name={isAISectionCollapsed ? 'chevron-down' : 'chevron-up'}
                  size={18}
                  color="#6A1B9A"
                />
              </TouchableOpacity>
            </View>
          </View>

          {isAISectionCollapsed ? (
            <Text style={styles.collapsedHint}>
              Section collapsed. Expand to see personalized product suggestions.
            </Text>
          ) : shoppingLoading ? (
            <View style={styles.aiStateCard}>
              <ActivityIndicator size="small" color="#6A1B9A" />
              <Text style={styles.aiStateText}>Analyzing your pantry, goals, history and favorites...</Text>
            </View>
          ) : shoppingError ? (
            <View style={styles.aiStateCard}>
              <Text style={styles.aiErrorText}>{shoppingError}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => void fetchShoppingSuggestions()}>
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {shoppingReasoning ? (
                <View style={styles.reasoningBox}>
                  <Ionicons name="information-circle-outline" size={14} color="#6A1B9A" />
                  <Text style={styles.reasoningText}>{shoppingReasoning}</Text>
                </View>
              ) : null}

              {shoppingSuggestions.length === 0 ? (
                <View style={styles.aiStateCard}>
                  <Ionicons name="checkmark-circle-outline" size={22} color="#4CAF50" />
                  <Text style={styles.aiStateText}>No urgent products to buy right now.</Text>
                </View>
              ) : (
                <View style={styles.aiSuggestionsList}>
                  {shoppingSuggestions.map((suggestion, index) => (
                    <View key={`${suggestion.product_name}-${index}`} style={styles.aiSuggestionCard}>
                      <View style={styles.aiSuggestionTopRow}>
                        <Text style={styles.aiSuggestionTitle}>{suggestion.product_name}</Text>
                        <View style={styles.priorityBadge}>
                          <Text style={styles.priorityBadgeText}>Priority {Math.max(1, Math.round(suggestion.priority_score / 20))}/5</Text>
                        </View>
                      </View>

                      <Text style={styles.aiSuggestionAmount}>
                        Buy about {suggestion.suggested_amount} {suggestion.unit}
                      </Text>

                      <Text style={styles.aiSuggestionReason}>{suggestion.short_reason}</Text>

                      <View style={styles.aiSuggestionActions}>
                        <TouchableOpacity style={styles.whyButton} onPress={() => setDetailsSuggestion(suggestion)}>
                          <Ionicons name="help-circle-outline" size={14} color="#6A1B9A" />
                          <Text style={styles.whyButtonText}>Why this?</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.quickAddButton}
                          onPress={() => {
                            void handleAddSuggestionToPantry(suggestion);
                          }}
                        >
                          <Ionicons name="add-circle-outline" size={14} color="#fff" />
                          <Text style={styles.quickAddButtonText}>Add to pantry</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </View>

        {products.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color="#ddd" />
            <Text style={styles.emptyText}>No products yet</Text>
            <Text style={styles.emptySubText}>Add your first product to get started</Text>
          </View>
        ) : (
          products.map((item) => (
            <ProductCard
              key={item.id}
              product={item}
              onEdit={() => handleOpenModal(item)}
              onDelete={deleteProduct}
            />
          ))
        )}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingProduct ? 'Edit Product' : 'Add Product'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <InputField
                label="Product Name"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="e.g., Tomatoes"
              />

              <InputField
                label="Quantity"
                value={formData.quantity}
                onChangeText={(text) => setFormData({ ...formData, quantity: text })}
                placeholder="0"
                keyboardType="decimal-pad"
              />

              <View>
                <Text style={styles.label}>Unit</Text>
                <View style={styles.unitGrid}>
                  {units.map((unit) => (
                    <TouchableOpacity
                      key={unit}
                      style={[styles.unitButton, formData.unit === unit && styles.unitButtonActive]}
                      onPress={() => setFormData({ ...formData, unit })}
                    >
                      <Text style={[styles.unitText, formData.unit === unit && styles.unitTextActive]}>{unit}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button title="Cancel" variant="secondary" onPress={() => setModalVisible(false)} />
              <Button title={editingProduct ? 'Update' : 'Add'} variant="primary" onPress={() => void handleSave()} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!detailsSuggestion} transparent animationType="fade" onRequestClose={() => setDetailsSuggestion(null)}>
        <View style={styles.detailsBackdrop}>
          <View style={styles.detailsCard}>
            <View style={styles.detailsHeader}>
              <Text style={styles.detailsTitle}>Why buy this?</Text>
              <TouchableOpacity onPress={() => setDetailsSuggestion(null)}>
                <Ionicons name="close" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.detailsProductName}>{detailsSuggestion?.product_name}</Text>

            <ScrollView style={styles.detailsScroll} contentContainerStyle={styles.detailsScrollContent}>
              {detailsSuggestion?.reason_points?.map((point, index) => (
                <View key={`${detailsSuggestion.product_name}-point-${index}`} style={styles.detailsPointRow}>
                  <Text style={styles.detailsBullet}>•</Text>
                  <Text style={styles.detailsPointText}>{point}</Text>
                </View>
              ))}
            </ScrollView>

            {detailsSuggestion ? (
              <TouchableOpacity
                style={styles.detailsAddButton}
                onPress={() => {
                  void handleAddSuggestionToPantry(detailsSuggestion);
                }}
              >
                <Text style={styles.detailsAddButtonText}>
                  Add {detailsSuggestion.suggested_amount} {detailsSuggestion.unit} to pantry
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingBottom: 28,
    gap: 10,
  },
  aiSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    marginBottom: 2,
  },
  aiSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  aiHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3E5F5',
  },
  collapseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3E5F5',
  },
  collapsedHint: {
    fontSize: 12,
    color: '#6A1B9A',
    lineHeight: 17,
  },
  reasoningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#F3E5F5',
    borderRadius: 8,
    padding: 9,
    marginBottom: 10,
  },
  reasoningText: {
    flex: 1,
    fontSize: 12,
    color: '#6A1B9A',
    lineHeight: 17,
  },
  aiStateCard: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    gap: 8,
  },
  aiStateText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  aiErrorText: {
    fontSize: 13,
    color: '#C62828',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 2,
    backgroundColor: '#F3E5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  retryButtonText: {
    color: '#6A1B9A',
    fontSize: 12,
    fontWeight: '600',
  },
  aiSuggestionsList: {
    gap: 8,
  },
  aiSuggestionCard: {
    borderWidth: 1,
    borderColor: '#ECECEC',
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#fff',
  },
  aiSuggestionTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  aiSuggestionTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#FFF5F1',
  },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FF6347',
  },
  aiSuggestionAmount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 4,
  },
  aiSuggestionReason: {
    fontSize: 12,
    color: '#666',
    lineHeight: 17,
    marginBottom: 8,
  },
  aiSuggestionActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  whyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3E5F5',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  whyButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6A1B9A',
  },
  quickAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FF6347',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  quickAddButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 28,
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
    maxHeight: '90%',
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
  unitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  unitButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flex: 0.3,
    alignItems: 'center',
  },
  unitButtonActive: {
    backgroundColor: '#FF6347',
    borderColor: '#FF6347',
  },
  unitText: {
    fontSize: 14,
    color: '#666',
  },
  unitTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  detailsBackdrop: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 20,
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    maxHeight: '72%',
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6A1B9A',
  },
  detailsProductName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
  },
  detailsScroll: {
    maxHeight: 280,
  },
  detailsScrollContent: {
    paddingBottom: 8,
  },
  detailsPointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 8,
  },
  detailsBullet: {
    fontSize: 16,
    lineHeight: 20,
    color: '#6A1B9A',
  },
  detailsPointText: {
    flex: 1,
    fontSize: 13,
    color: '#444',
    lineHeight: 20,
  },
  detailsAddButton: {
    marginTop: 10,
    backgroundColor: '#FF6347',
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 10,
  },
  detailsAddButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});
