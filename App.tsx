import React from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';

const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#0D1B2A" />
      <AppNavigator />
    </SafeAreaProvider>
  );
};

export default App;
