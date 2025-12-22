import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import Header from './src/components/Header';
import { ChatComponent } from './src/components/Chat';
import SplashScreen from './src/components/SplashScreen';

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  // useEffect(() => {
  //   // Disable developer menu during splash screen
  //   if (__DEV__ && Platform.OS === 'ios') {
  //     try {
  //       const DevMenu = require('react-native/Libraries/Utilities/DevMenu');
  //       DevMenu.setEnabled(false);
        
  //       // Re-enable after splash
  //       setTimeout(() => {
  //         DevMenu.setEnabled(true);
  //       }, 5500); // After splash completes
  //     } catch (error) {
  //       console.log('Could not disable dev menu:', error);
  //     }
  //   }
  // }, []);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <>
      <Header title='FredChat Agent' />
      <ChatComponent />
    </>
  );
};

export default App;