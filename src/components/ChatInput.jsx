import React from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import PropTypes from 'prop-types';

const ChatInput = ({ value, onChangeText, onSend }) => {
  const handleSend = () => {
    if (value.trim()) {
      onSend();
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Ask about Mortgages, Refinancing..."
        placeholderTextColor="#999"
        value={value}
        onChangeText={onChangeText}
        multiline={true}
        maxLength={500}
        returnKeyType="send"
        onSubmitEditing={handleSend}
        blurOnSubmit={false}
      />
      <TouchableOpacity
        style={[
          styles.sendButton,
          !value.trim() && styles.sendButtonDisabled
        ]}
        onPress={handleSend}
        disabled={!value.trim()}
      >
        <Text style={styles.sendButtonText}>Send</Text>
      </TouchableOpacity>
    </View>
  );
};

ChatInput.propTypes = {
  value: PropTypes.string.isRequired,
  onChangeText: PropTypes.func.isRequired,
  onSend: PropTypes.func.isRequired,
};

const colors = {
  primary: '#FF3621',
  primaryLight: 'rgba(255, 54, 33, 0.7)',
  disabled: '#ccc',
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEEDE9',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 5,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 100,
    backgroundColor: '#EEEDE9',
    borderRadius: 21,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingTop: 10,
    fontSize: 15,
    marginRight: 8,
    color: '#1B3139',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: 21,
    paddingHorizontal: 20,
    paddingVertical: 11,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 70,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  sendButtonDisabled: {
    backgroundColor: colors.disabled,
    shadowOpacity: 0,
    elevation: 0,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default ChatInput;
