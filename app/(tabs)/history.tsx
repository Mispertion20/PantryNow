import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAppContext } from '../context/AppContext';
import { useAuthContext } from '../context/AuthContext';
import * as db from '../db';
import type { HistoryItem } from '../db/types';

type UsedProduct = {
  name: string;
  amount: number;
  unit: string;
};

type HistoryDetail = HistoryItem & {
  recipeTitle: string;
  usedProducts: UsedProduct[];
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, updateProfile, refreshProfile } = useAuthContext();
  const { recipes, products, likedRecipes, toggleRecipeLike } = useAppContext();

  const [cookingHistory, setCookingHistory] = useState<HistoryItem[]>([]);
  const [historyDetails, setHistoryDetails] = useState<HistoryDetail[]>([]);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(user?.name ?? '');
  const [savingName, setSavingName] = useState(false);
  const [updatingAvatar, setUpdatingAvatar] = useState(false);

  useEffect(() => {
    setDraftName(user?.name ?? '');
  }, [user?.name]);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  const stats = useMemo(() => {
    const totalRecipesCooked = recipes.reduce((sum, r) => sum + r.times_cooked, 0);
    const mostCooked = [...recipes].sort((a, b) => b.times_cooked - a.times_cooked);
    const favoriteRecipe = mostCooked[0];
    const avgCookingTime =
      recipes.length > 0
        ? Math.round(recipes.reduce((sum, r) => sum + r.cooking_time, 0) / recipes.length)
        : 0;

    return {
      totalRecipesCooked,
      favoriteRecipe,
      avgCookingTime,
      mostCooked: mostCooked.slice(0, 5),
    };
  }, [recipes]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await db.getCookingHistory();
        setCookingHistory(history);
      } catch (error) {
        console.error('Failed to load cooking history:', error);
      }
    };

    void fetchHistory();
  }, []);

  useEffect(() => {
    const details = cookingHistory.map((item) => {
      const fallbackRecipeTitle = recipes.find((r) => r.id === item.recipe_id)?.title || 'Unknown Recipe';
      const recipeTitle = item.recipe_title || fallbackRecipeTitle;
      const usedProducts: UsedProduct[] = Array.isArray(item.used_ingredients)
        ? item.used_ingredients.map((ingredient) => ({
            name: ingredient.product_name,
            amount: ingredient.amount_used,
            unit: ingredient.unit || '',
          }))
        : [];

      return {
        ...item,
        recipeTitle,
        usedProducts,
      };
    });

    setHistoryDetails(details);
  }, [cookingHistory, recipes]);

  const avatarInitials = useMemo(() => {
    const source = (user?.name || user?.email || '').trim();
    if (!source) return 'U';
    const words = source.split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
    return source.slice(0, 2).toUpperCase();
  }, [user?.email, user?.name]);

  const handleSaveName = async () => {
    const normalizedName = draftName.trim();
    if (normalizedName && normalizedName.length < 2) {
      Alert.alert('Invalid name', 'Name must be at least 2 characters long.');
      return;
    }

    try {
      setSavingName(true);
      await updateProfile({ name: normalizedName });
      setEditingName(false);
    } catch (error) {
      Alert.alert('Failed to update name', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSavingName(false);
    }
  };

  const handlePickAvatar = async () => {
    try {
      setUpdatingAvatar(true);
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please allow photo library access to update your avatar.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (result.canceled || !result.assets[0]?.base64) {
        return;
      }

      const mimeType = result.assets[0].mimeType || 'image/jpeg';
      const avatarData = `data:${mimeType};base64,${result.assets[0].base64}`;
      await updateProfile({ avatar_data: avatarData });
    } catch (error) {
      Alert.alert('Failed to update avatar', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setUpdatingAvatar(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: () => {
          void logout();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.actionPill} onPress={() => router.push('/(tabs)/settings')}>
          <Ionicons name="settings-outline" size={16} color="#374151" />
          <Text style={styles.actionPillText}>Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionPill, styles.logoutPill]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={16} color="#B91C1C" />
          <Text style={styles.logoutPillText}>Log out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.profileCard}>
        <TouchableOpacity onPress={() => void handlePickAvatar()} style={styles.avatarWrap} disabled={updatingAvatar}>
          {user?.avatar_data ? (
            <Image source={{ uri: user.avatar_data }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitials}>{avatarInitials}</Text>
            </View>
          )}
          <View style={styles.avatarEditBadge}>
            <Ionicons name="camera" size={14} color="#fff" />
          </View>
        </TouchableOpacity>

        <View style={styles.profileInfo}>
          {editingName ? (
            <>
              <TextInput
                value={draftName}
                onChangeText={setDraftName}
                style={styles.nameInput}
                placeholder="Enter your name"
                maxLength={40}
                autoCapitalize="words"
              />
              <View style={styles.nameActions}>
                <TouchableOpacity
                  style={[styles.smallButton, styles.cancelButton]}
                  onPress={() => {
                    setDraftName(user?.name ?? '');
                    setEditingName(false);
                  }}
                  disabled={savingName}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.smallButton} onPress={() => void handleSaveName()} disabled={savingName}>
                  <Text style={styles.smallButtonText}>{savingName ? 'Saving...' : 'Save'}</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.profileName}>{user?.name?.trim() || 'Add your name'}</Text>
              <TouchableOpacity onPress={() => setEditingName(true)}>
                <Text style={styles.editNameText}>{user?.name?.trim() ? 'Edit name' : 'Add name'}</Text>
              </TouchableOpacity>
            </>
          )}

          <Text style={styles.profileEmail}>{user?.email || 'No email'}</Text>
          <TouchableOpacity onPress={() => void handlePickAvatar()} disabled={updatingAvatar}>
            <Text style={styles.editAvatarText}>{updatingAvatar ? 'Updating avatar...' : 'Update avatar'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Statistics</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <View style={styles.statIconContainer}>
            <Ionicons name="checkmark-circle" size={32} color="#4CAF50" />
          </View>
          <Text style={styles.statValue}>{stats.totalRecipesCooked}</Text>
          <Text style={styles.statLabel}>Recipes Cooked</Text>
        </View>

        <View style={styles.statBox}>
          <View style={styles.statIconContainer}>
            <Ionicons name="time" size={32} color="#2196F3" />
          </View>
          <Text style={styles.statValue}>{stats.avgCookingTime}</Text>
          <Text style={styles.statLabel}>Avg Cook Time (min)</Text>
        </View>

        <View style={styles.statBox}>
          <View style={styles.statIconContainer}>
            <Ionicons name="cube-outline" size={32} color="#FF9800" />
          </View>
          <Text style={styles.statValue}>{products.length}</Text>
          <Text style={styles.statLabel}>Total Products</Text>
        </View>
      </View>

      {stats.favoriteRecipe && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Favorite</Text>
          <View style={styles.favoriteCard}>
            <View style={styles.favoriteIcon}>
              <Ionicons name="heart" size={32} color="#FF6347" />
            </View>
            <View style={styles.favoriteContent}>
              <Text style={styles.favoriteName} numberOfLines={1}>
                {stats.favoriteRecipe.title}
              </Text>
              <Text style={styles.favoriteDetail}>Cooked {stats.favoriteRecipe.times_cooked} times</Text>
              <Text style={styles.favoriteCategory}>
                {stats.favoriteRecipe.category} • {stats.favoriteRecipe.cooking_time} min
              </Text>
            </View>
          </View>
        </View>
      )}

      {stats.mostCooked.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Most Cooked Recipes</Text>
          <View style={styles.list}>
            {stats.mostCooked.map((recipe, index) => (
              <View key={recipe.id} style={styles.listItem}>
                <View style={styles.listRank}>
                  <Text style={styles.listRankText}>#{index + 1}</Text>
                </View>
                <View style={styles.listContent}>
                  <Text style={styles.listTitle} numberOfLines={1}>
                    {recipe.title}
                  </Text>
                  <Text style={styles.listSubtitle}>Cooked {recipe.times_cooked}x • {recipe.cooking_time} min</Text>
                </View>
                <View style={styles.listCount}>
                  <Text style={styles.listCountText}>{recipe.times_cooked}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {likedRecipes.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Liked Recipes</Text>
          <View style={styles.list}>
            {likedRecipes.map((recipe) => (
              <View key={recipe.id} style={styles.listItem}>
                <View style={styles.historyContent}>
                  <Text style={styles.listTitle} numberOfLines={1}>
                    {recipe.title}
                  </Text>
                  <Text style={styles.listSubtitle}>
                    {recipe.category} • {recipe.cooking_time} min • Cooked {recipe.times_cooked}x
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.unlikeButton}
                  onPress={() => {
                    void toggleRecipeLike(recipe.id);
                  }}
                >
                  <Ionicons name="heart" size={18} color="#E91E63" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}

      {historyDetails.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cooking History</Text>
          <View style={styles.list}>
            {historyDetails.map((item) => (
              <View key={item.id} style={styles.listItem}>
                <View style={styles.historyContent}>
                  <Text style={styles.listTitle} numberOfLines={1}>
                    {item.recipeTitle}
                  </Text>
                  <Text style={styles.listSubtitle}>Cooked at: {new Date(item.cooked_at).toLocaleString()}</Text>
                  {item.usedProducts.length > 0 && (
                    <View style={styles.usedProductsBlock}>
                      <Text style={styles.usedProductsTitle}>Products used:</Text>
                      {item.usedProducts.map((prod, idx) => (
                        <Text key={`${prod.name}-${idx}`} style={styles.usedProductLine}>
                          • {prod.name}: {prod.amount} {prod.unit}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    elevation: 1,
  },
  actionPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  logoutPill: {
    backgroundColor: '#FEE2E2',
  },
  logoutPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B91C1C',
  },
  profileCard: {
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    elevation: 2,
  },
  avatarWrap: {
    width: 82,
    height: 82,
  },
  avatarImage: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#F3F4F6',
  },
  avatarFallback: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#FFE4DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 26,
    fontWeight: '700',
    color: '#C2410C',
  },
  avatarEditBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF6347',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  profileEmail: {
    marginTop: 4,
    fontSize: 13,
    color: '#6B7280',
  },
  editNameText: {
    marginTop: 4,
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
  },
  editAvatarText: {
    marginTop: 8,
    fontSize: 12,
    color: '#FF6347',
    fontWeight: '600',
  },
  nameInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 15,
    color: '#1F2937',
    backgroundColor: '#fff',
  },
  nameActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  smallButton: {
    backgroundColor: '#FF6347',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  smallButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  cancelButton: {
    backgroundColor: '#E5E7EB',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '700',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    paddingBottom: 4,
    gap: 8,
  },
  statBox: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    elevation: 2,
  },
  statIconContainer: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  favoriteCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  favoriteIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF5F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  favoriteContent: {
    flex: 1,
  },
  favoriteName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  favoriteDetail: {
    fontSize: 13,
    color: '#FF6347',
    marginTop: 4,
  },
  favoriteCategory: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  list: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  listRank: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF6347',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  listRankText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  listContent: {
    flex: 1,
  },
  listTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  listSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  listCount: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#FFF5F1',
    borderRadius: 6,
  },
  listCountText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF6347',
  },
  historyContent: {
    flex: 1,
  },
  usedProductsBlock: {
    marginTop: 4,
  },
  usedProductsTitle: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  usedProductLine: {
    fontSize: 12,
    color: '#666',
  },
  unlikeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF1F6',
  },
});
