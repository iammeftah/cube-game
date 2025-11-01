import React from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

interface LandingOverlayProps {
  tapHintOpacity: Animated.Value;
}

export const LandingOverlay: React.FC<LandingOverlayProps> = ({ tapHintOpacity }) => {
  return (
    <View style={styles.container} pointerEvents="none">
      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.titleJapanese}>影の道</Text>
        <View style={styles.titleDivider} />
        <Text style={styles.titleEnglish}>SHADOW PATH</Text>
      </View>

      {/* Tap hint */}
      <Animated.View style={[styles.tapHintContainer, { opacity: tapHintOpacity }]}>
        <Text style={styles.tapHint}>TAP TO BEGIN</Text>
        <View style={styles.tapDivider} />
      </Animated.View>

      {/* Bottom instruction */}
      <Text style={styles.bottomInstruction}>TAP LEFT OR RIGHT TO SURVIVE</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 100,
  },
  titleJapanese: {
    fontSize: 64,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 20,
    letterSpacing: 12,
    textShadowColor: '#ff0000',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 25,
  },
  titleDivider: {
    width: 120,
    height: 2,
    backgroundColor: '#ff0000',
    marginBottom: 20,
    shadowColor: '#ff0000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  titleEnglish: {
    fontSize: 14,
    fontWeight: '400',
    color: '#999999',
    letterSpacing: 6,
  },
  tapHintContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  tapHint: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ff0000',
    letterSpacing: 4,
    marginBottom: 10,
  },
  tapDivider: {
    width: 50,
    height: 1,
    backgroundColor: '#ff0000',
  },
  bottomInstruction: {
    position: 'absolute',
    bottom: 80,
    fontSize: 9,
    fontWeight: '500',
    color: '#555555',
    letterSpacing: 2,
  },
});