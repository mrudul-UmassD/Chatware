import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/contexts/AuthContext';
import { ChatProvider } from './src/contexts/ChatContext';
import { SocketProvider } from './src/contexts/SocketContext';
import MainNavigator from './src/navigation/MainNavigator';

export default function App() {
  return (
    <NavigationContainer>
      <AuthProvider>
        <SocketProvider>
          <ChatProvider>
            <StatusBar style="auto" />
            <MainNavigator />
          </ChatProvider>
        </SocketProvider>
      </AuthProvider>
    </NavigationContainer>
  );
} 