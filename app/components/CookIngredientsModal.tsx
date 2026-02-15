import React, { useEffect, useMemo, useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import type { Product, RecipeIngredient } from '../db/types';
import { Button } from './Button';

export interface IngredientUsage {
  productName: string;
  amountUsed: number;
}

interface CookIngredientsModalProps {
  visible: boolean;
  recipeTitle: string;
  ingredients: RecipeIngredient[];
  products: Product[];
  onCancel: () => void;
  onConfirm: (usedIngredients: IngredientUsage[]) => void;
}

interface IngredientUsageRow extends RecipeIngredient {
  amount_used: string;
}

export const CookIngredientsModal: React.FC<CookIngredientsModalProps> = ({
  visible,
  recipeTitle,
  ingredients,
  products,
  onCancel,
  onConfirm,
}) => {
  const [usageRows, setUsageRows] = useState<IngredientUsageRow[]>([]);

  useEffect(() => {
    if (!visible) return;
    setUsageRows(
      ingredients.map((ingredient) => ({
        ...ingredient,
        amount_used: ingredient.amount_required?.toString() ?? '0',
      }))
    );
  }, [visible, ingredients]);

  const productByName = useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach((product) => {
      map.set(product.name.toLowerCase(), product);
    });
    return map;
  }, [products]);

  const handleConfirm = () => {
    let overLimit = false;
    const usedIngredients: IngredientUsage[] = usageRows.map((row) => {
      const product = productByName.get(row.product_name.toLowerCase());
      const available = product?.quantity ?? 0;
      const raw = Number.parseFloat(row.amount_used);
      const normalized = Number.isFinite(raw) ? raw : 0;
      if (normalized > available) overLimit = true;
      const clamped = Math.max(0, Math.min(available, normalized));
      return {
        productName: row.product_name,
        amountUsed: clamped,
      };
    });
    if (overLimit) {
      alert('You cannot use more than you have in stock for any ingredient.');
      return;
    }
    onConfirm(usedIngredients);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Cook {recipeTitle}</Text>
            <TouchableOpacity onPress={onCancel}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body}>
            {usageRows.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No ingredients</Text>
                <Text style={styles.emptySubtitle}>
                  This recipe has no ingredients. You can still mark it as cooked.
                </Text>
              </View>
            ) : (
              usageRows.map((row) => {
                const product = productByName.get(row.product_name.toLowerCase());
                const unit = product?.unit ?? '';
                const available = product?.quantity ?? 0;

                return (
                  <View key={row.id} style={styles.row}>
                    <View style={styles.rowHeader}>
                      <Text style={styles.ingredientName}>{row.product_name}</Text>
                      <Text style={styles.requiredText}>
                        Required: {row.amount_required} {unit}
                      </Text>
                    </View>

                    <View style={styles.rowMeta}>
                      <Text style={styles.availableText}>
                        Available: {available} {unit}
                      </Text>
                    </View>

                    <View style={styles.inputRow}>
                      <Text style={styles.inputLabel}>Used</Text>
                      <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        value={row.amount_used}
                        onChangeText={(text) =>
                          setUsageRows((prev) =>
                            prev.map((item) =>
                              item.id === row.id ? { ...item, amount_used: text } : item
                            )
                          )
                        }
                        placeholder="0"
                      />
                      <Text style={styles.unitText}>{unit}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          <View style={styles.footer}>
            <Button title="Cancel" variant="secondary" onPress={onCancel} />
            <Button title="Cook" variant="primary" onPress={handleConfirm} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
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
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  closeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6347',
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  row: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ingredientName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  requiredText: {
    fontSize: 12,
    color: '#999',
  },
  rowMeta: {
    marginTop: 6,
  },
  availableText: {
    fontSize: 12,
    color: '#666',
  },
  inputRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },
  unitText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#666',
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    flexDirection: 'row',
    gap: 8,
  },
});
