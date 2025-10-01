// app/partida/[id].tsx
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { Fixture, GameEvent, Player } from '../../constants/types';

// =================================================================================
// DADOS MOCADOS (MOCK DATA)
// =================================================================================
const MOCK_MATCH: Fixture = {
  id: 1,
  round: 1,
  home_team_name: 'Guerreiros FC',
  away_team_name: 'Unidos da Vila',
  home_team_score: 0,
  away_team_score: 0,
  status: 'live',
};
const MOCK_PLAYERS: Player[] = [
  { id: 1, team_id: 101, name: 'João Silva' },
  { id: 2, team_id: 101, name: 'Carlos Pereira' },
  { id: 3, team_id: 102, name: 'Marcos Andrade' },
  { id: 4, team_id: 102, name: 'Pedro Souza' },
];
const MOCK_EVENTS: GameEvent[] = [];

const getMatchDetails_MOCK = (id: number): Promise<Fixture | undefined> => new Promise(resolve => resolve(MOCK_MATCH));
const getPlayersForMatch_MOCK = (id: number): Promise<Player[]> => new Promise(resolve => resolve(MOCK_PLAYERS));
const getEventsForMatch_MOCK = (id: number): Promise<GameEvent[]> => new Promise(resolve => resolve(MOCK_EVENTS));
const addEvent_MOCK = (event: Omit<GameEvent, 'id'>): Promise<GameEvent> => new Promise(resolve => {
  const newEvent = { ...event, id: Math.random() };
  MOCK_EVENTS.push(newEvent);
  if (event.type === 'goal') {
      // Lógica simples para atualizar o placar (precisa melhorar para saber o time)
      MOCK_MATCH.home_team_score! += 1;
  }
  resolve(newEvent);
});
// =================================================================================

// Pequeno componente para o item do evento
const EventItem = ({ event }: { event: GameEvent }) => {
  const iconMap = {
    goal: { name: 'award', color: '#28A745' },
    yellow_card: { name: 'square', color: '#FFC107' },
    red_card: { name: 'square', color: '#DC3545' },
  };
  const { name, color } = iconMap[event.type];

  return (
    <View style={styles.eventCard}>
      <View style={styles.eventMinuteContainer}>
        <Text style={styles.eventMinute}>{event.minute}'</Text>
      </View>
      <Feather name={name as any} size={20} color={color} style={{backgroundColor: color, color: 'white', padding: 4, borderRadius: 4, overflow: 'hidden'}}/>
      <View style={styles.eventDetails}>
        <Text style={styles.eventPlayer}>{event.player_name}</Text>
        {event.type === 'goal' && event.assister_name && (
          <Text style={styles.eventAssist}>Assistência: {event.assister_name}</Text>
        )}
      </View>
    </View>
  );
};


export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams();
  const matchId = Number(id);

  const [match, setMatch] = useState<Fixture | null>(null);
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatchData = async () => {
      setLoading(true);
      // QUANDO O DEV 2 TERMINAR, SUBSTITUA PELAS FUNÇÕES REAIS
      const matchData = await getMatchDetails_MOCK(matchId);
      const eventsData = await getEventsForMatch_MOCK(matchId);
      setMatch(matchData || null);
      setEvents(eventsData.sort((a,b) => a.minute - b.minute));
      setLoading(false);
    };
    fetchMatchData();
  }, [id]);

  const handleAddEvent = async (type: 'goal' | 'yellow_card' | 'red_card') => {
    // Em um app real, aqui abriria um Modal para selecionar jogador, minuto, etc.
    // Para simplificar, vamos adicionar um evento mocado.
    const mockPlayer = MOCK_PLAYERS[Math.floor(Math.random() * MOCK_PLAYERS.length)];
    const mockAssister = MOCK_PLAYERS[Math.floor(Math.random() * MOCK_PLAYERS.length)];
    const newEventData: Omit<GameEvent, 'id'> = {
        match_id: matchId,
        minute: Math.floor(Math.random() * 90),
        type,
        player_name: mockPlayer.name,
        assister_name: type === 'goal' ? mockAssister.name : undefined
    };
    // QUANDO O DEV 2 TERMINAR, SUBSTITUA PELA FUNÇÃO REAL
    await addEvent_MOCK(newEventData);
    
    // Recarrega os dados para atualizar a tela
    const updatedEvents = await getEventsForMatch_MOCK(matchId);
    const updatedMatch = await getMatchDetails_MOCK(matchId);
    setEvents(updatedEvents.sort((a,b) => a.minute - b.minute));
    setMatch(updatedMatch || null);
  };
  

  if (loading) return <ActivityIndicator size="large" style={styles.centered} />;
  if (!match) return <Text style={styles.centered}>Partida não encontrada.</Text>;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: `Rodada ${match.round}` }} />
      <ScrollView>
        {/* Placar */}
        <View style={styles.scoreboard}>
          <Text style={styles.teamName}>{match.home_team_name}</Text>
          <Text style={styles.score}>{match.home_team_score} - {match.away_team_score}</Text>
          <Text style={styles.teamName}>{match.away_team_name}</Text>
        </View>

        {/* Botões de Ação Rápida */}
        <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={() => handleAddEvent('goal')}>
                <Feather name="award" size={24} color="#FFF" />
                <Text style={styles.actionButtonText}>Gol</Text>
            </TouchableOpacity>
             <TouchableOpacity style={styles.actionButton} onPress={() => handleAddEvent('yellow_card')}>
                <Feather name="square" size={24} color="#FFF" />
                <Text style={styles.actionButtonText}>Cartão</Text>
            </TouchableOpacity>
        </View>

        {/* Linha do Tempo de Eventos */}
        <View style={styles.timelineContainer}>
          <Text style={styles.sectionTitle}>Eventos da Partida</Text>
          {events.length > 0 ? (
            events.map(event => <EventItem key={event.id} event={event} />)
          ) : (
            <Text style={styles.emptyText}>Nenhum evento registrado.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F4F7FC' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scoreboard: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: '#1A2B48', paddingVertical: 20, margin: 16, borderRadius: 16 },
    teamName: { color: 'white', fontSize: 18, fontWeight: 'bold', flex: 1, textAlign: 'center' },
    score: { color: 'white', fontSize: 40, fontWeight: 'bold' },
    actionsContainer: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 16, marginBottom: 24 },
    actionButton: { backgroundColor: '#007AFF', flex: 1, marginHorizontal: 8, paddingVertical: 15, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
    actionButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
    timelineContainer: { paddingHorizontal: 16 },
    sectionTitle: { fontSize: 22, fontWeight: 'bold', color: '#1A2B48', marginBottom: 12 },
    emptyText: { textAlign: 'center', color: 'gray', padding: 16, fontSize: 14 },
    eventCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 12, borderRadius: 8, marginBottom: 8 },
    eventMinuteContainer: { backgroundColor: '#E9EEF6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginRight: 12 },
    eventMinute: { fontWeight: 'bold', color: '#1A2B48' },
    eventDetails: { marginLeft: 12 },
    eventPlayer: { fontSize: 16, fontWeight: '500' },
    eventAssist: { fontSize: 12, color: 'gray' },
});