// _layout.tsx
import React from 'react';
import { View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler'; // keep root view for consistency

import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';

// Screens
import MainScreen from './index';
import SecondScreen from './SecondScreen';
import PaathList from './PaathList';
import PaathDetail from './PaathDetail';

// ✅ Types for navigation (unchanged)
export type RootStackParamList = {
  Tabs: undefined;
  MainScreen: undefined;
  SecondScreen: undefined;
  PaathScreen: undefined;
  PaathDetail: { paathName: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// Keep splash until fonts are ready
SplashScreen.preventAutoHideAsync().catch(() => { /* already hidden is fine */ });

function Tabs() {
  const ORANGE = '#E27528';
  const GREEN  = '#B4BE76';
  const PURPLE = '#8076BE';
  const INACTIVE = '#999';

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarInactiveTintColor: INACTIVE,
        tabBarLabelStyle: { fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="MainScreen"
        component={MainScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarActiveTintColor: ORANGE,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="SecondScreen"
        component={SecondScreen}
        options={{
          tabBarLabel: 'Learn',
          tabBarActiveTintColor: GREEN,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="PaathScreen"
        component={PaathList}
        options={{
          tabBarLabel: 'Paath',
          tabBarActiveTintColor: PURPLE,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="reader-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function Layout() {
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        if (Platform.OS === 'android') {
          await Font.loadAsync({
            'NotoSansGurmukhi-Regular': require('../assets/fonts/NotoSansGurmukhi-Regular.ttf'),
            'NotoSansDevanagari-Regular': require('../assets/fonts/NotoSansDevanagari-Regular.ttf'),
          });
        }
      } catch (e) {
        console.warn('Font load error:', e);
      } finally {
        setReady(true);
        await SplashScreen.hideAsync().catch(() => {});
      }
    })();
  }, []);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <Stack.Navigator>
          {/* Tabs are the main entry */}
          <Stack.Screen
            name="Tabs"
            component={Tabs}
            options={{ headerShown: false }}
          />

          {/* ✅ PaathDetail registered */}
          <Stack.Screen
            name="PaathDetail"
            component={PaathDetail}
            options={({ route }) => ({
              title: route.params.paathName,
            })}
          />
        </Stack.Navigator>
      </View>
    </GestureHandlerRootView>
  );
}
