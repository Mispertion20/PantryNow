import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { InputField } from '../components/InputField';
import { useAuthContext } from '../context/AuthContext';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuthContext();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Missing fields', 'Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Password and confirm password do not match.');
      return;
    }

    try {
      setSubmitting(true);
      await register(name.trim(), email.trim().toLowerCase(), password);
      router.replace('/survey');
    } catch (error) {
      Alert.alert('Registration failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <View style={styles.logoCircle}>
          <Ionicons name="person-add" size={36} color="#FF6347" />
        </View>
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Build your personal pantry and recipe space</Text>

        <InputField
          label="Name"
          value={name}
          onChangeText={setName}
          placeholder="Your name"
        />

        <InputField
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="you@example.com"
        />

        <InputField
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          placeholder="At least 6 characters"
        />

        <InputField
          label="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoCapitalize="none"
          placeholder="Repeat password"
        />

        {submitting ? (
          <ActivityIndicator size="large" color="#FF6347" style={styles.loader} />
        ) : (
          <Button title="Register" onPress={handleRegister} />
        )}

        <Text style={styles.switchText}>
          Already have an account?{' '}
          <Link href="../login" style={styles.link}>
            Login
          </Link>
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 3,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF5F1',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#222',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 18,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  loader: {
    marginVertical: 12,
  },
  switchText: {
    marginTop: 12,
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
  },
  link: {
    color: '#FF6347',
    fontWeight: '700',
  },
});
