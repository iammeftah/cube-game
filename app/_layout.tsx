import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    async function prepare() {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        console.warn(e);
      } finally {
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  return (
    <Stack 
      screenOptions={{ 
        headerShown: false,
        animation: 'fade',
        animationDuration: 600,
        contentStyle: { backgroundColor: '#000000' },
        gestureEnabled: false,
      }}
    >
      <Stack.Screen 
        name="index"
        options={{
          animation: 'none',
        }}
      />
      <Stack.Screen 
        name="landing"
        options={{
          animation: 'fade',
          animationDuration: 600,
        }}
      />
      <Stack.Screen 
        name="game"
        options={{
          animation: 'fade',
          animationDuration: 800,
        }}
      />
    </Stack>
  );
}