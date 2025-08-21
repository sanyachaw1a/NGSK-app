// DotIndicator.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';

interface DotIndicatorProps {
  currentIndex: number; // 0 for MainScreen, 1 for SecondScreen
}

export const DotIndicator = ({ currentIndex }: DotIndicatorProps) => (
  <View style={styles.dotContainer}>
    {[0, 1, 2].map(i => (
      <View key={i} style={[styles.dot, currentIndex === i && styles.activeDot]} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  dotContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ccc',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#333',
  },
});
