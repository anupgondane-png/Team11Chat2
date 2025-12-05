import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import ChatScreen from '../screens/ChatScreen';
import type {RootStackParamList} from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: {backgroundColor: '#0D1B2A'},
        }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen
          name="Chat"
          component={ChatScreen}
          options={{
            headerShown: true,
            headerTitle: '❤️ HridAI Consultation',
            headerStyle: {
              backgroundColor: '#0D1B2A',
            },
            headerTintColor: '#DC3545',
            headerTitleStyle: {
              fontWeight: '700',
              fontSize: 17,
            },
            headerBackTitle: 'Back',
            headerShadowVisible: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
