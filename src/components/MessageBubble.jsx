import React, {useEffect, useRef, useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Alert, Animated} from 'react-native';
import PropTypes from 'prop-types';
import {UserAvatar, ChatBotAvatar} from './Avatar';
import {TypeAnimation} from 'react-native-type-animation';

const MessageBubble = ({item, isNew = false, onTypingUpdate, onTypingComplete}) => {
  const isUser = item.sender === 'user';
  const [typingComplete, setTypingComplete] = useState(!isNew || isUser);
  
  const avatarComponent = isUser ? <UserAvatar /> : <ChatBotAvatar />;
  const messageContainerStyle = isUser
    ? styles.userMessageContainer
    : styles.receiverMessageContainer;
  const messageTextStyle = isUser
    ? styles.userMessageText
    : styles.receiverMessageText;

  if (item.hasRealTimeData && !isUser) {
    console.log('🔴 MessageBubble: LIVE DATA badge should show!', {
      hasRealTimeData: item.hasRealTimeData,
      isUser: isUser,
      message: item.message?.substring(0, 50)
    });
  }

  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    if (item.hasRealTimeData && !isUser) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [item.hasRealTimeData, isUser, pulseAnim]);

  const handleCitationPress = (citationNum) => {
    const citations = item.citations || {};
    const citation = citations[citationNum];
    
    if (citation) {
      const source = citation.source || 'Unknown';
      const uri = citation.uri || '';
      
      Alert.alert(
        `Citation [${citationNum}]`,
        `Source: ${source}\n\nFull path:\n${uri}`,
        [{text: 'OK', style: 'default'}]
      );
    } else {
      Alert.alert('Citation', `Citation [${citationNum}] source not available`);
    }
  };

  const handleLiveDataPress = () => {
    Alert.alert(
      'Real-Time Data Source',
      'Federal Reserve Economic Data (FRED)\n\n' +
      'This response includes live economic data from the Federal Reserve Bank of St. Louis.\n\n' +
      'Source: FRED API\n' +
      'Website: fred.stlouisfed.org',
      [{text: 'OK', style: 'default'}]
    );
  };

  const renderMessageContent = () => {
    const message = item.message || '';
    
    const citationRegex = /\[(\d+)\]/g;
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
    
    const hasCitations = citationRegex.test(message);
    const hasEmails = emailRegex.test(message);
    
    const renderRichContent = (currentText) => {
      const combinedRegex = /(\[\d+\]|[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g;
      const parts = currentText.split(combinedRegex);
      
      return (
        <Text style={messageTextStyle}>
          {parts.map((part, index) => {
            const citationMatch = part.match(/\[(\d+)\]/);
            if (citationMatch && !isUser) {
              const citationNum = citationMatch[1];
              return (
                <TouchableOpacity 
                  key={index} 
                  onPress={() => handleCitationPress(citationNum)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.citation}>{part}</Text>
                </TouchableOpacity>
              );
            }
            
            const emailMatch = part.match(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+$/);
            if (emailMatch) {
              return (
                <Text key={index} style={styles.email}>{part}</Text>
              );
            }
            
            return <Text key={index}>{part}</Text>;
          })}
        </Text>
      );
    };
    
    if (!isUser && isNew) {
      return (
        <TypeAnimation
          sequence={[{text: message}]}
          typeSpeed={1} // Fast typing: 15ms per character = 66 chars/sec (ChatGPT-like)
          cursor={true} // Show blinking cursor
          blinkSpeed={300} // Fast cursor blink (300ms)
          cursorStyle={{
            color: 'rgba(37,73,192, 0.7)', // Match bot message color
            fontWeight: '400',
          }}
          style={messageTextStyle}
          onCharTyped={({currentText}) => {
            if (onTypingUpdate) {
              onTypingUpdate();
            }
            
            if (currentText.length === message.length) {
              setTimeout(() => {
                setTypingComplete(true);
                if (onTypingComplete) {
                  onTypingComplete();
                }
              }, 0);
            }
          }}
        />
      );
    }
    
    if ((hasCitations && !isUser) || hasEmails) {
      return renderRichContent(message);
    }
    
    return <Text style={messageTextStyle}>{message}</Text>;
  };

  return (
    <View
      style={[
        styles.bubbleContainer,
        // eslint-disable-next-line react-native/no-inline-styles
        {
          flexDirection: isUser ? 'row-reverse' : 'row',
          alignItems: 'flex-end',
          marginBottom: 12,
        },
      ]}>
      {item.sender === 'bot' && avatarComponent}
      {item.sender === 'user' && avatarComponent}
      <View style={messageContainerStyle}>
        {renderMessageContent()}
        
        {!isUser && item.hasRealTimeData && typingComplete && (
          <TouchableOpacity 
            style={styles.liveDataBadgeContainer}
            onPress={handleLiveDataPress}
            activeOpacity={0.7}
          >
            <Animated.View 
              style={[
                styles.liveDot,
                {
                  transform: [{ scale: pulseAnim }]
                }
              ]}
            />
            <Text style={styles.liveDataText}>LIVE DATA</Text>
            <Text style={styles.liveDataSource}>Federal Reserve FRED</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

MessageBubble.propTypes = {
  item: PropTypes.shape({
    sender: PropTypes.oneOf(['user', 'bot']).isRequired,
    message: PropTypes.string.isRequired,
    citations: PropTypes.object,
    hasRealTimeData: PropTypes.bool,
  }).isRequired,
  isNew: PropTypes.bool,
  onTypingUpdate: PropTypes.func,
  onTypingComplete: PropTypes.func,
};

const styles = StyleSheet.create({
  bubbleContainer: {},
  userMessageContainer: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(188,73,129, 0.1)',
    borderRadius: 12,
    marginRight: 0,
    borderBottomRightRadius: 0,
    padding: 14,
    maxWidth: '75%',
    // Add subtle shadow for depth
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  receiverMessageContainer: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(37,73,192, 0.08)',
    borderRadius: 12,
    borderBottomLeftRadius: 0,
    padding: 14,
    marginRight: 60,
    maxWidth: '75%',
    // Add subtle shadow for depth
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userMessageText: {
    color: '#1a1a1a',
    fontSize: 15,
    lineHeight: 22,
  },
  receiverMessageText: {
    color: '#1a1a1a',
    fontSize: 15,
    lineHeight: 22,
  },
  citation: {
    color: 'rgba(37,73,192, 1)',
    fontWeight: '600',
    fontSize: 13,
    backgroundColor: 'rgba(37,73,192, 0.15)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
    marginHorizontal: 2,
  },
  email: {
    color: '#0066cc',
    fontWeight: '500',
    fontSize: 15,
    fontFamily: 'Courier',
    textDecorationLine: 'none',
    backgroundColor: 'rgba(0, 102, 204, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveDataBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    marginRight: 6,
  },
  liveDataText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF3B30',
    letterSpacing: 0.5,
    marginRight: 6,
  },
  liveDataSource: {
    color: 'rgba(37,73,192, 1)',
    fontWeight: '600',
    fontSize: 13,
    textDecorationLine: 'underline',
    marginHorizontal: 2,
  },
});

export default React.memo(MessageBubble);
