import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface PlayingOverlayProps {
  score: number;
  onQuit: () => void;
}

export const PlayingOverlay: React.FC<PlayingOverlayProps> = ({ score, onQuit }) => {
  return (
    <>
      {/* Quit Button */}
      <TouchableOpacity 
        style={styles.quitButton} 
        onPress={onQuit}
        activeOpacity={0.7}
      >
        <Text style={styles.quitText}>✕</Text>
      </TouchableOpacity>

      {/* Score */}
      <View style={styles.topBar} pointerEvents="none">
        <Text style={styles.scoreText}>SCORE: {score}</Text>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  quitButton: {
    position: 'absolute',
    top: 50,
    left: 25,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 0, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quitText: {
    fontSize: 24,
    fontWeight: '300',
    color: '#ff0000',
  },
  topBar: {
    paddingTop: 60,
    paddingHorizontal: 30,
    alignItems: 'flex-end',
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ff0000',
    letterSpacing: 3,
    textShadowColor: '#ff0000',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
});