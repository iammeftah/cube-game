import { StatusBar } from 'expo-status-bar';
import React from 'react';
import Game3D from '../components/Game3D';

export default function GameScreen() {
  return (
    <>
      <StatusBar style="light" hidden />
      <Game3D />
    </>
  );
}