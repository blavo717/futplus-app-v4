import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import DashboardStack from './stacks/DashboardStack';
import { EntrenamientoStack } from './stacks/EntrenamientoStack';
import { NutricionStack } from './stacks/NutricionStack';
import AsistenciaStack from './stacks/AsistenciaStack';
import PerfilStack from './stacks/PerfilStack';
import { Colors } from '../constants/colors';

export type TabParamList = {
  Dashboard: undefined;
  Entrenamiento: undefined;
  Nutricion: undefined;
  Asistencia: undefined;
  Perfil: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.text.secondary,
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopColor: Colors.border,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardStack}
        options={{
          tabBarLabel: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Entrenamiento"
        component={EntrenamientoStack}
        options={{
          tabBarLabel: 'Entrenamiento',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="football" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Nutricion"
        component={NutricionStack}
        options={{
          tabBarLabel: 'Nutrición',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="nutrition" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Asistencia"
        component={AsistenciaStack}
        options={{
          tabBarLabel: 'Asistencia',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Perfil"
        component={PerfilStack}
        options={{
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};