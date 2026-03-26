import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';

interface ButtonProps {
  onPress: () => void | Promise<void>;
  title: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  onPress,
  title,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const [internalLoading, setInternalLoading] = useState(false);

  const isLoading = loading || internalLoading;

  const handlePress = async () => {
    if (disabled || isLoading) {
      return;
    }

    try {
      const maybePromise = onPress();
      if (maybePromise && typeof (maybePromise as Promise<void>).then === 'function') {
        setInternalLoading(true);
        await maybePromise;
      }
    } finally {
      setInternalLoading(false);
    }
  };

  const spinnerColor = variant === 'secondary' ? '#333' : '#fff';

  return (
    <TouchableOpacity
      onPress={() => {
        void handlePress();
      }}
      disabled={disabled || isLoading}
      style={[styles.button, styles[variant], (disabled || isLoading) && styles.disabled, style]}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={spinnerColor} />
      ) : (
        <Text style={[styles.text, styles[`${variant}Text`], textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  primary: {
    backgroundColor: '#FF6347',
  },
  secondary: {
    backgroundColor: '#f0f0f0',
  },
  danger: {
    backgroundColor: '#dc3545',
  },
  success: {
    backgroundColor: '#28a745',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryText: {
    color: '#fff',
  },
  secondaryText: {
    color: '#333',
  },
  dangerText: {
    color: '#fff',
  },
  successText: {
    color: '#fff',
  },
});
