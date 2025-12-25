import React from 'react';
import { Text, View, StyleSheet, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native';
import PropTypes from 'prop-types';

const AppHeader = ({ title = 'Amazon Bedrock Chat App' }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <View style={styles.wrapper}>
        <Text style={styles.appTitle}>{title}</Text>
      </View>
    </SafeAreaView>
  );
};

AppHeader.propTypes = {
  title: PropTypes.string.isRequired,
};

export default AppHeader;

const colors = {
  primary: '#1B3139',
  textWhite: '#FFFFFF',
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.primary,
  },
  wrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  appTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textWhite,
    letterSpacing: 0.5,
  },
});