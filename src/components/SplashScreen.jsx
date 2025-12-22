import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import FreddieMacLogo from '../../media/FreddieMacLogo.svg';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 2400, // Increased from 800ms
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 2000, // Increased from 600ms
          useNativeDriver: true,
        }).start(() => {
          onFinish();
        });
      }, 6000); // Increased from 1500ms
    });
  }, [fadeAnim, onFinish]);

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: fadeAnim,
        }
      ]}
    >
      <View style={styles.logoContainer}>
        <FreddieMacLogo
          width={Math.min(width, height) * 0.6}
          height={Math.min(width, height) * 0.3}
          color="white"
          fill="white"
        />
      </View>
    </Animated.View>
  );
};


const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#032e6d',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999999,
    elevation: 999999,
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SplashScreen;

