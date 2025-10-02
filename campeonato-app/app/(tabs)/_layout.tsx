// app/(tabs)/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';

// Você pode apagar o componente <TabBarIcon> se ele estiver aqui
// e usar o ícone diretamente como mostrado abaixo.

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF', // Cor do ícone e texto ativos
        headerShown: false, // Vamos deixar cada tela controlar seu próprio cabeçalho
      }}>
      <Tabs.Screen
        // 1. A primeira aba continua sendo a de campeonatos
        name="index"
        options={{
          title: 'Campeonatos',
          tabBarIcon: ({ color }) => <Feather size={28} name="award" color={color} />,
        }}
      />
      <Tabs.Screen
        // 2. A segunda aba agora aponta para o nosso novo arquivo 'jogos.tsx'
        name="jogos" // O nome do arquivo que criamos!
        options={{
          title: 'Jogos',
          tabBarIcon: ({ color }) => <Feather size={28} name="calendar" color={color} />,
        }}
      />
    </Tabs>
  );
}