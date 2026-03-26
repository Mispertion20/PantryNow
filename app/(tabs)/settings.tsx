import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useAuthContext } from '@/context/AuthContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { logout } = useAuthContext();
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);

  const confirmLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
    router.replace('/(auth)/login');
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            router.replace('/(tabs)');
          }}
        >
          <Ionicons name="chevron-back" size={20} color="#333" />
          <Text style={styles.backText}>Home</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Manage your AI personalization preferences.</Text>

        <TouchableOpacity
          style={styles.actionCard}
          activeOpacity={0.88}
          onPress={() => {
            router.push('/(tabs)/survey-retake');
          }}
        >
          <View style={styles.actionIconWrap}>
            <Ionicons name="sparkles-outline" size={22} color="#6A1B9A" />
          </View>
          <View style={styles.actionTextWrap}>
            <Text style={styles.actionTitle}>Retake personalization survey</Text>
            <Text style={styles.actionSubtitle}>
              Update goals, restrictions, cooking style and priorities.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          activeOpacity={0.88}
          onPress={() => {
            router.push('/(tabs)/allergy-settings');
          }}
        >
          <View style={[styles.actionIconWrap, styles.allergyIconWrap]}>
            <Ionicons name="warning-outline" size={22} color="#B42318" />
          </View>
          <View style={styles.actionTextWrap}>
            <Text style={styles.actionTitle}>Manage allergy ingredients</Text>
            <Text style={styles.actionSubtitle}>
              Add or remove allergy names without retaking the full survey.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          activeOpacity={0.88}
          onPress={() => {
            router.push('/(tabs)/custom-instructions');
          }}
        >
          <View style={[styles.actionIconWrap, styles.instructionsIconWrap]}>
            <Ionicons name="chatbox-ellipses-outline" size={22} color="#155EEF" />
          </View>
          <View style={styles.actionTextWrap}>
            <Text style={styles.actionTitle}>Custom instructions</Text>
            <Text style={styles.actionSubtitle}>
              Write specific guidance for AI recommendations.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, styles.logoutCard]}
          activeOpacity={0.88}
          onPress={handleLogout}
        >
          <View style={[styles.actionIconWrap, styles.logoutIconWrap]}>
            <Ionicons name="log-out-outline" size={22} color="#B42318" />
          </View>
          <View style={styles.actionTextWrap}>
            <Text style={styles.actionTitle}>Log out</Text>
            <Text style={styles.actionSubtitle}>
              Sign out from your PantryNow account.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#999" />
        </TouchableOpacity>
      </View>

      <ConfirmDialog
        visible={showLogoutConfirm}
        title="Log out"
        message="Are you sure you want to log out?"
        confirmText="Log out"
        cancelText="Cancel"
        isDangerous
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          void confirmLogout();
        }}
      />
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
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 2,
    paddingVertical: 4,
    paddingRight: 8,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#222',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#777',
  },
  actionCard: {
    marginTop: 18,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#efefef',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
  },
  actionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F3E5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  allergyIconWrap: {
    backgroundColor: '#FEECE8',
  },
  instructionsIconWrap: {
    backgroundColor: '#EAF2FF',
  },
  logoutCard: {
    marginTop: 14,
  },
  logoutIconWrap: {
    backgroundColor: '#FEECE8',
  },
  actionTextWrap: {
    flex: 1,
    marginRight: 8,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
  },
  actionSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#777',
    lineHeight: 17,
  },
});
