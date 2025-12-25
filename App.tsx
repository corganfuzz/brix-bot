import React, { useState } from 'react';

import Header from './src/components/Header';
import { ChatComponent } from './src/components/Chat';
import SplashScreen from './src/components/SplashScreen';

const App = () => {
  const [showSplash, setShowSplash] = useState(true);


  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <>
      <Header title='Mortgage Xpert' />
      <ChatComponent />
    </>
  );
};

export default App;