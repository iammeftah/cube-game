import React from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { CubeDefinition } from '../utils/cubeDefinition';
import { CubeButton } from './CubeButton';
import { MenuButton } from './MenuButton';

interface LandingOverlayProps {
  tapHintOpacity: Animated.Value;
  selectedCube: CubeDefinition;
  onOpenCubeSelector: () => void;
  onOpenMenu: () => void;
}

export const LandingOverlay: React.FC<LandingOverlayProps> = ({ 
  tapHintOpacity, 
  selectedCube,
  onOpenCubeSelector,
  onOpenMenu
}) => {
  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Top left buttons - AUTO allows both container and children to capture touches */}
      <View style={styles.topLeftButtons} pointerEvents="auto">
        <CubeButton 
          selectedCube={selectedCube}
          onPress={onOpenCubeSelector}
        />
        <MenuButton onPress={onOpenMenu} />
      </View>

      {/* Title - PASS THROUGH TOUCHES */}
      <View style={styles.titleContainer} pointerEvents="none">
        <Text style={styles.titleJapanese}>影の道</Text>
        <View style={styles.titleDivider} />
        <Text style={styles.titleEnglish}>SHADOW PATH</Text>
      </View>

      {/* Tap hint - PASS THROUGH TOUCHES */}
      <Animated.View style={[styles.tapHintContainer, { opacity: tapHintOpacity }]} pointerEvents="none">
        <Text style={styles.tapHint}>TAP TO BEGIN</Text>
        <View style={styles.tapDivider} />
      </Animated.View>

      {/* Bottom instruction - PASS THROUGH TOUCHES */}
      <Text style={styles.bottomInstruction} pointerEvents="none">
        CLICK LEFT/RIGHT TO MOVE • DOUBLE-CLICK TO JUMP
      </Text>
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
  topLeftButtons: {
    position: 'absolute',
    top: 60,
    left: 20,
    flexDirection: 'row',
    gap: 8,
    zIndex: 10000, // Even higher z-index to ensure it's on top
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 100,
  },
  titleJapanese: {
    fontSize: 56,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 20,
    letterSpacing: 12,
  },
  titleDivider: {
    width: 100,
    height: 1,
    backgroundColor: '#666666',
    marginBottom: 20,
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
    color: '#888888',
    letterSpacing: 4,
    marginBottom: 10,
  },
  tapDivider: {
    width: 50,
    height: 1,
    backgroundColor: '#666666',
  },
  bottomInstruction: {
    position: 'absolute',
    bottom: 80,
    fontSize: 9,
    fontWeight: '500',
    color: '#555555',
    letterSpacing: 2,
    textAlign: 'center',
  },
});