// app/(tabs)/jogos.tsx
import React, { useState } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { Fixture } from '../../constants/types';
import { getAllFixtures_MOCK } from '../../services/mockDatabase';

export default function TabJogosScreen() {
  const router = useRouter();
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllFixtures = async () => {
    setLoading(true);
    // TODO: Quando o Dev 2 terminar, substituir pela função real
    const data = await getAllFixtures_MOCK();
    // Ordena por rodada para uma melhor visualização
    setFixtures(data.sort((a, b) => a.round - b.round));
    setLoading(false);
  };

  // useFocusEffect garante que a lista seja atualizada sempre que o usuário voltar para esta aba
  useFocusEffect(
    React.useCallback(() => {
      fetchAllFixtures();
    }, [])
  );

  const navigateToMatch = (fixtureId: number) => {
    router.push(`/partida/${fixtureId}`);
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#007AFF" /></View>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Próximas Partidas</Text>

        <FlatList
          data={fixtures}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => navigateToMatch(item.id)}>
              <View style={styles.cardHeader}>
                <Text style={styles.championshipName}>{item.championshipName}</Text>
                <Text style={styles.roundText}>Rodada {item.round}</Text>
              </View>
              <View style={styles.fixtureRow}>
                <Text style={styles.teamName}>{item.home_team_name}</Text>
                <Text style={styles.vsText}>vs</Text>
                <Text style={styles.teamName}>{item.away_team_name}</Text>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="calendar" size={60} color="#CBD5E0" />
              <Text style={styles.emptyTitle}>Nenhuma Partida Agendada</Text>
              <Text style={styles.emptySubtitle}>Vá para um campeonato e gere a tabela de jogos.</Text>
            </View>
          }
          contentContainerStyle={{ flexGrow: 1 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F7FC' },
  container: { flex: 1, paddingHorizontal: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F4F7FC' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#1A2B48', paddingTop: 20, paddingBottom: 10 },
  card: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#1A2B48',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E9EEF6',
    paddingBottom: 8,
    marginBottom: 12,
  },
  championshipName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  roundText: {
    fontSize: 12,
    color: '#A0AEC0',
  },
  fixtureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    textAlign: 'center',
    color: '#1A2B48',
  },
  vsText: {
    color: '#A0AEC0',
    marginHorizontal: 10,
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4A5568',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#A0AEC0',
    marginTop: 8,
    textAlign: 'center',
  },
});
