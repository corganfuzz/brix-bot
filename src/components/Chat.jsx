import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { fetchChatAPI } from '../services/api';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';

const ChatComponent = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [latestBotMessageId, setLatestBotMessageId] = useState(null);
  const flatListRef = useRef(null);
  const scrollThrottleCounter = useRef(0);

  const generateUniqueId = () => {
    const timestamp = new Date().getTime();
    const randomNum = Math.floor(Math.random() * 1000000);
    return `${timestamp}-${randomNum}`;
  };

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const fetchAPI = async message => {
    try {
      setIsTyping(true);
      const result = await fetchChatAPI(message);

      setIsTyping(false);

      console.log('📥 Received from API:', {
        hasResponse: !!result.response,
        hasCitations: Object.keys(result.citations || {}).length,
        hasRealTimeData: result.hasRealTimeData,
        fullResult: result
      });

      const messageId = generateUniqueId();
      const newMessageObj = {
        id: messageId,
        sender: 'bot',
        message: result.response,
        citations: result.citations || {}, // Include citations
        hasRealTimeData: result.hasRealTimeData || false, // Flag for FRED/real-time data
      };

      console.log('📦 Message object created:', {
        hasRealTimeData: newMessageObj.hasRealTimeData,
        sender: newMessageObj.sender
      });

      // Mark this as the latest bot message (triggers typewriter)
      setLatestBotMessageId(messageId);
      setMessages(prevMessages => [...prevMessages, newMessageObj]);
    } catch (error) {
      setIsTyping(false);
      console.error('❌ Error fetching API:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const handleSend = () => {
    if (newMessage.trim() !== '') {
      const newMessageObj = {
        id: generateUniqueId(),
        sender: 'user',
        message: newMessage,
      };
      setMessages(prevMessages => [...prevMessages, newMessageObj]);
      fetchAPI(newMessage);
      setNewMessage('');
    }
  };

  // Handle auto-scroll during typewriter effect - memoized to prevent restarts
  const handleTypingUpdate = useCallback(() => {
    // Throttle scrolling to every 5th character for performance
    scrollThrottleCounter.current += 1;
    if (scrollThrottleCounter.current % 5 === 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, []);

  // Clear latestBotMessageId when typewriter completes - memoized to prevent restarts
  const handleTypingComplete = useCallback(() => {
    setLatestBotMessageId(null);
  }, []);

  const renderMessage = ({ item }) => {
    const isNew = item.id === latestBotMessageId && item.sender === 'bot';
    return (
      <MessageBubble
        item={item}
        isNew={isNew}
        onTypingUpdate={handleTypingUpdate}
        onTypingComplete={handleTypingComplete}
      />
    );
  };

  return (
    <View style={styles.outerContainer}>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id.toString()}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={true}
        style={styles.flatList}
        ListFooterComponent={
          <>
            {isTyping && <TypingIndicator />}
            <View style={styles.listFooter} />
          </>
        }
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ChatInput
          value={newMessage}
          onChangeText={setNewMessage}
          onSend={handleSend}
        />
      </KeyboardAvoidingView>
    </View>
  );
};

ChatComponent.propTypes = {};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#F9F7F4',
  },
  flatList: {
    flex: 1,
    backgroundColor: '#F9F7F4',
  },
  messageList: {
    padding: 16,
    paddingBottom: 10,
    flexGrow: 1,
  },
  listFooter: {
    height: 10,
  },
});

export { ChatComponent };
