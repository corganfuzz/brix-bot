import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, StyleSheet, Text } from 'react-native';
import { ChatBotAvatar } from './Avatar';

const LOADING_MESSAGES = [
  'Thinking...',
  'Querying Databricks...',
  'Analyzing data points...',
  'Synthesizing insights...',
  'Finalizing response...',
];

const TypingIndicator = () => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulseAnim]);

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(fadeAnim, {
        toValue: 0.3,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setMessageIndex((prevIndex) => (prevIndex + 1) % LOADING_MESSAGES.length);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [fadeAnim]);

  return (
    <View
      style={[
        styles.bubbleContainer,
        {
          flexDirection: 'row',
          alignItems: 'flex-end',
          marginBottom: 20,
        },
      ]}>
      <ChatBotAvatar />
      <View style={styles.typingContainer}>
        <Animated.View
          style={[
            styles.pulsingDot,
            {
              transform: [{ scale: pulseAnim }]
            }
          ]}
        />
        <Animated.Text
          style={[
            styles.loadingText,
            {
              opacity: fadeAnim
            }
          ]}
        >
          {LOADING_MESSAGES[messageIndex]}
        </Animated.Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bubbleContainer: {},
  typingContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderBottomLeftRadius: 0,
    padding: 16,
    paddingHorizontal: 20,
    marginRight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    minHeight: 46,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  pulsingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF3621',
    marginRight: 10,
  },
  loadingText: {
    color: '#1B3139',
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
});

export default TypingIndicator;

