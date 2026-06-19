import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { theme } from '../constants/theme';

import { SessionsScreen } from '../screens/SessionsScreen';
import { CreateSessionScreen } from '../screens/CreateSessionScreen';
import { SessionDetailScreen } from '../screens/SessionDetailScreen';
import { SupportScreen } from '../screens/SupportScreen';
import { WebViewScreen } from '../screens/WebViewScreen';

const Stack = createNativeStackNavigator();

const NavigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: theme.colors.background,
    card: theme.colors.surface,
    text: theme.colors.textPrimary,
    border: theme.colors.border,
    primary: theme.colors.accent,
  },
};

export const RootNavigator = () => {
  return (
    <NavigationContainer theme={NavigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.surface,
          },
          headerTintColor: theme.colors.textPrimary,
          headerTitleStyle: {
            ...theme.typography.sectionHeader,
          },
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen 
          name="Sessions" 
          component={SessionsScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="SessionDetail" 
          component={SessionDetailScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Group screenOptions={{ presentation: 'modal' }}>
          <Stack.Screen 
            name="CreateSession" 
            component={CreateSessionScreen} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="Support" 
            component={SupportScreen} 
            options={{
              headerShown: true,
              title: 'Support',
              headerStyle: { backgroundColor: theme.colors.surface },
              headerTintColor: theme.colors.textPrimary,
            }} 
          />
        </Stack.Group>
        <Stack.Screen 
          name="WebView" 
          component={WebViewScreen} 
          options={({ route }: any) => ({
            headerShown: true,
            title: route.params?.title || 'Page',
            headerStyle: { backgroundColor: theme.colors.surface },
            headerTintColor: theme.colors.textPrimary,
          })} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
