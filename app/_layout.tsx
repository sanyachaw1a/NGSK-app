import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  createBottomTabNavigator
} from '@react-navigation/bottom-tabs';
import {
  createNativeStackNavigator
} from '@react-navigation/native-stack';
import {
  GestureHandlerRootView,
  PanGestureHandler,
  State
} from 'react-native-gesture-handler';
import {
  useNavigation,
  useRoute,
  RouteProp
} from '@react-navigation/native';

import MainScreen from './index';
import SecondScreen from './SecondScreen';
import PaathList from './PaathList';
import PaathDetail from './PaathDetail';

// ✅ Types for navigation
export type RootStackParamList = {
  Tabs: undefined;
  MainScreen: undefined;
  SecondScreen: undefined;
  PaathScreen: undefined;
  PaathDetail: { paathName: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();
const SWIPE_THRESHOLD = 50;

interface GestureWrapperProps {
  children: React.ReactNode;
}

function SwipeGestureWrapper({ children }: GestureWrapperProps) {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<any>>();

  let isSwiping = false;

  const onGestureEvent = (event: any) => {
    const { translationX } = event.nativeEvent;
    if (!isSwiping && Math.abs(translationX) > SWIPE_THRESHOLD) {
      isSwiping = true;
      if (translationX > 0) {
        // swipe right
        if (route.name === 'SecondScreen') {
          navigation.navigate('MainScreen');
        } else if (route.name === 'PaathScreen') {
          navigation.navigate('SecondScreen');
        }
      } else {
        // swipe left
        if (route.name === 'MainScreen') {
          navigation.navigate('SecondScreen');
        } else if (route.name === 'SecondScreen') {
          navigation.navigate('PaathScreen');
        }
      }
    }
  };

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      isSwiping = false;
    }
  };

  return (
    <PanGestureHandler
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onHandlerStateChange}
    >
      <View style={{ flex: 1 }}>{children}</View>
    </PanGestureHandler>
  );
}

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
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack.Navigator>
        {/* Tabs are the main entry */}
        <Stack.Screen
          name="Tabs"
          component={Tabs}
          options={{ headerShown: false }}
        />

        {/* ✅ Now PaathDetail is a registered screen */}
        <Stack.Screen
          name="PaathDetail"
          component={PaathDetail}
          options={({ route }) => ({
            title: route.params.paathName,
          })}
        />
      </Stack.Navigator>
    </GestureHandlerRootView>
  );
}
