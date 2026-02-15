import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Button } from '../components/Button';
import { InputField } from '../components/InputField';
import { ProductCard } from '../components/ProductCard';
import { useAppContext } from '../context/AppContext';
import type { Product } from '../db/types';

export default function ProductsScreen() {
  const { products, loading, addProduct, updateProduct, deleteProduct } = useAppContext();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({ name: '', quantity: '', unit: 'g' });

  const units = ['g', 'kg', 'ml', 'l', 'pc', 'cup', 'tbsp'];

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
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => handleOpenModal()}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cube-outline" size={64} color="#ddd" />
          <Text style={styles.emptyText}>No products yet</Text>
          <Text style={styles.emptySubText}>Add your first product to get started</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent}>
          {products.map((item) => (
            <ProductCard
              key={item.id}
              product={item}
              onEdit={() => handleOpenModal(item)}
              onDelete={deleteProduct}
            />
          ))}
        </ScrollView>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingProduct ? 'Edit Product' : 'Add Product'}
              </Text>
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
                      style={[
                        styles.unitButton,
                        formData.unit === unit && styles.unitButtonActive,
                      ]}
                      onPress={() => setFormData({ ...formData, unit })}
                    >
                      <Text
                        style={[
                          styles.unitText,
                          formData.unit === unit && styles.unitTextActive,
                        ]}
                      >
                        {unit}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setModalVisible(false)}
              />
              <Button
                title={editingProduct ? 'Update' : 'Add'}
                variant="primary"
                onPress={handleSave}
              />
            </View>
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
});