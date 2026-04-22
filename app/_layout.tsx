// _layout.tsx
import React, { useState } from 'react';
import { View, Platform, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeContext } from './ThemeContext';

import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { seedAllPaaths } from '../lib/seedDatabase';

import MainScreen from './index';
import SecondScreen from './SecondScreen';
import PaathList from './PaathList';
import PaathDetail from './PaathDetail';
import BhagatBaniList from './BhagatBaniList';

export type RootStackParamList = {
  Tabs: undefined;
  MainScreen: undefined;
  SecondScreen: undefined;
  PaathScreen: undefined;
  BhagatBaniList: undefined;
  PaathDetail: { paathName: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab   = createBottomTabNavigator();

SplashScreen.preventAutoHideAsync().catch(() => {});

const SAFFRON  = '#E06B1F';
const INACTIVE = '#6B6054';

const LIGHT_BG   = '#F8F1E6';
const DARK_BG    = '#0F1E1B';
const LIGHT_BORDER = '#F0E6D4';
const DARK_BORDER  = '#1E3028';

function TabButton({ children, onPress, accessibilityState, style }: any) {
  const focused = accessibilityState?.selected;
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[style, { alignItems: 'center', justifyContent: 'center' }]}
      activeOpacity={0.8}
    >
      {focused && (
        <View style={{
          width: 24, height: 3, borderRadius: 2,
          backgroundColor: SAFFRON, marginBottom: 4,
        }} />
      )}
      {!focused && <View style={{ height: 7 }} />}
      {children}
    </TouchableOpacity>
  );
}

function Tabs() {
  const { isDark } = React.useContext(ThemeContext);
  const bg     = isDark ? DARK_BG    : LIGHT_BG;
  const border = isDark ? DARK_BORDER : LIGHT_BORDER;
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: SAFFRON,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle: { backgroundColor: bg, borderTopColor: border },
        tabBarLabelStyle: { fontFamily: 'Inter-Medium', fontSize: 10 },
        tabBarButton: (props) => <TabButton {...props} />,
      }}
    >
      <Tab.Screen
        name="MainScreen"
        component={MainScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="SecondScreen"
        component={SecondScreen}
        options={{
          tabBarLabel: 'Learn',
          tabBarIcon: ({ color, size }) => <Ionicons name="book-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="PaathScreen"
        component={PaathList}
        options={{
          tabBarLabel: 'Paath',
          tabBarIcon: ({ color, size }) => <Ionicons name="reader-outline" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function Layout() {
  const [ready, setReady] = React.useState(false);
  const [isDark, setIsDark] = useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const fonts: Record<string, any> = {
          'Fraunces-Light':       require('../assets/fonts/Fraunces,Inter,Noto_Sans_Gurmukhi/Fraunces/static/Fraunces_72pt-Light.ttf'),
          'Fraunces-LightItalic': require('../assets/fonts/Fraunces,Inter,Noto_Sans_Gurmukhi/Fraunces/static/Fraunces_72pt-LightItalic.ttf'),
          'Fraunces-Regular':     require('../assets/fonts/Fraunces,Inter,Noto_Sans_Gurmukhi/Fraunces/static/Fraunces_72pt-Regular.ttf'),
          'Fraunces-Italic':      require('../assets/fonts/Fraunces,Inter,Noto_Sans_Gurmukhi/Fraunces/static/Fraunces_72pt-Italic.ttf'),
          'Fraunces-SemiBold':       require('../assets/fonts/Fraunces,Inter,Noto_Sans_Gurmukhi/Fraunces/static/Fraunces_72pt-SemiBold.ttf'),
          'Fraunces-SemiBoldItalic': require('../assets/fonts/Fraunces,Inter,Noto_Sans_Gurmukhi/Fraunces/static/Fraunces_72pt-SemiBoldItalic.ttf'),
          'Inter-Regular':        require('../assets/fonts/Fraunces,Inter,Noto_Sans_Gurmukhi/Inter/static/Inter_18pt-Regular.ttf'),
          'Inter-Medium':         require('../assets/fonts/Fraunces,Inter,Noto_Sans_Gurmukhi/Inter/static/Inter_18pt-Medium.ttf'),
          'Inter-SemiBold':       require('../assets/fonts/Fraunces,Inter,Noto_Sans_Gurmukhi/Inter/static/Inter_18pt-SemiBold.ttf'),
          'Inter-Bold':           require('../assets/fonts/Fraunces,Inter,Noto_Sans_Gurmukhi/Inter/static/Inter_18pt-Bold.ttf'),
          'NotoSansGurmukhi':     require('../assets/fonts/Fraunces,Inter,Noto_Sans_Gurmukhi/Noto_Sans_Gurmukhi/NotoSansGurmukhi-VariableFont_wdth,wght.ttf'),
        };
        if (Platform.OS === 'android') {
          fonts['NotoSansDevanagari-Regular'] = require('../assets/fonts/NotoSansDevanagari-Regular.ttf');
        }
        await Font.loadAsync(fonts);
      } catch (e) {
        console.warn('Font load error:', e);
      } finally {
        setReady(true);
        await SplashScreen.hideAsync().catch(() => {});
        // Seed paath data into SQLite in the background after the UI is visible
        seedAllPaaths().catch(e => console.warn('[seedAllPaaths]', e));
      }
    })();
  }, []);

  if (!ready) return null;

  return (
    <ThemeContext.Provider value={{ isDark, setIsDark }}>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <Stack.Navigator>
          <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
          <Stack.Screen
            name="BhagatBaniList"
            component={BhagatBaniList}
            options={{ title: 'Bhagat Bani', headerBackTitle: 'Paath' }}
          />
          <Stack.Screen
            name="PaathDetail"
            component={PaathDetail}
            options={({ route }) => ({ title: route.params.paathName })}
          />
        </Stack.Navigator>
      </View>
    </GestureHandlerRootView>
    </ThemeContext.Provider>
  );
}
