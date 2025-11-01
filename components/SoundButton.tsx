import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

interface SoundButtonProps {
  isEnabled: boolean;
  onPress: () => void;
}

export const SoundButton: React.FC<SoundButtonProps> = ({ isEnabled, onPress }) => {
  return (
    <TouchableOpacity 
      style={styles.button}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.icon}>{isEnabled ? '🔊' : '🔇'}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  icon: {
    fontSize: 20,
  },
});