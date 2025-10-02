// app/partida/[id].tsx
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { Fixture, GameEvent, Player, PlayerMatchStat } from '../../constants/types';
import {
  getMatchDetails_MOCK,
  getPlayersForMatch_MOCK,
  getEventsForMatch_MOCK,
  addEvent_MOCK,
  calculateMatchStats_MOCK,
} from '../../services/mockDatabase';

// Pequeno componente para o item do evento (sem alterações)
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
      <Feather name={name as any} size={20} color={'white'} style={{backgroundColor: color, padding: 4, borderRadius: 4, overflow: 'hidden'}}/>
      <View style={styles.eventDetails}>
        <Text style={styles.eventPlayer}>{event.player_name}</Text>
        {event.type === 'goal' && event.assister_name && (
          <Text style={styles.eventAssist}>Assistência: {event.assister_name}</Text>
        )}
      </View>
    </View>
  );
};

type ActiveTab = 'events' | 'stats';

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams();
  const matchId = Number(id);

  const [match, setMatch] = useState<Fixture | null>(null);
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [stats, setStats] = useState<PlayerMatchStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('events');
  const [modalInfo, setModalInfo] = useState<{ visible: boolean; type: 'goal' | 'card' | null }>({ visible: false, type: null });
  const [eventMinute, setEventMinute] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedAssister, setSelectedAssister] = useState<Player | null>(null);
  const [selectedCard, setSelectedCard] = useState<'yellow_card' | 'red_card'>('yellow_card');

  const fetchMatchData = async () => {
    setLoading(true);
    // TODO: Quando o Dev 2 terminar, substituir pelas funções reais
    const matchData = await getMatchDetails_MOCK(matchId);
    const eventsData = await getEventsForMatch_MOCK(matchId);
    const playersData = await getPlayersForMatch_MOCK(matchId);
    const statsData = await calculateMatchStats_MOCK(matchId); // Buscando stats
    
    setMatch(matchData || null);
    setEvents(eventsData.sort((a, b) => a.minute - b.minute));
    setPlayers(playersData);
    setStats(statsData);
    setLoading(false);
  };

  useEffect(() => { fetchMatchData(); }, [id]);

  const openModal = (type: 'goal' | 'card') => setModalInfo({ visible: true, type });

  const closeModal = () => {
    setModalInfo({ visible: false, type: null });
    setEventMinute('');
    setSelectedPlayer(null);
    setSelectedAssister(null);
  };

  const handleSaveEvent = async () => {
    if (!eventMinute || !selectedPlayer) {
      alert('Por favor, preencha o minuto e selecione um jogador.');
      return;
    }

    // A lógica para criar o objeto do evento foi movida para dentro dos 'if'
    // para garantir que o 'type' seja sempre correto.
    if (modalInfo.type === 'goal') {
      const eventData: Omit<GameEvent, 'id' | 'player_name' | 'assister_name'> = {
        match_id: matchId,
        minute: parseInt(eventMinute),
        type: 'goal', // Tipo específico
        player_id: selectedPlayer.id,
        assister_id: selectedAssister?.id,
        team_id: selectedPlayer.team_id,
      };
      await addEvent_MOCK(eventData);
    } 
    else if (modalInfo.type === 'card') { // Verificação explícita
      const eventData: Omit<GameEvent, 'id' | 'player_name' | 'assister_name'> = {
        match_id: matchId,
        minute: parseInt(eventMinute),
        type: selectedCard, // Usa o estado 'selectedCard' que é 'yellow_card' ou 'red_card'
        player_id: selectedPlayer.id,
        team_id: selectedPlayer.team_id,
      };
      await addEvent_MOCK(eventData);
    }

    closeModal();
    fetchMatchData(); // Recarrega tudo para atualizar placar, eventos e estatísticas
  };
  
  if (loading) return <ActivityIndicator size="large" style={styles.centered} />;
  if (!match) return <Text style={styles.centered}>Partida não encontrada.</Text>;
  
  const homeTeamPlayers = players.filter(p => p.team_id === match.home_team_id);
  const awayTeamPlayers = players.filter(p => p.team_id === match.away_team_id);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: `Rodada ${match.round}` }} />
        <View style={styles.scoreboard}>
            <Text style={styles.teamName}>{match.home_team_name}</Text>
            <Text style={styles.score}>{match.home_team_score} - {match.away_team_score}</Text>
            <Text style={styles.teamName}>{match.away_team_name}</Text>
        </View>
        
        <View style={styles.tabContainer}>
            <TouchableOpacity style={[styles.tab, activeTab === 'events' && styles.activeTab]} onPress={() => setActiveTab('events')}>
                <Feather name="clock" size={16} color={activeTab === 'events' ? '#FFF' : '#007AFF'} />
                <Text style={[styles.tabText, activeTab === 'events' && styles.activeTabText]}>Eventos</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, activeTab === 'stats' && styles.activeTab]} onPress={() => setActiveTab('stats')}>
                <Feather name="star" size={16} color={activeTab === 'stats' ? '#FFF' : '#007AFF'} />
                <Text style={[styles.tabText, activeTab === 'stats' && styles.activeTabText]}>Estatísticas</Text>
            </TouchableOpacity>
        </View>

      <ScrollView>
        {activeTab === 'events' && (
            <>
            <View style={styles.actionsContainer}>
                <TouchableOpacity style={styles.actionButton} onPress={() => openModal('goal')}>
                    <Feather name="award" size={24} color="#FFF" />
                    <Text style={styles.actionButtonText}>Adicionar Gol</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={() => openModal('card')}>
                    <Feather name="square" size={24} color="#FFF" />
                    <Text style={styles.actionButtonText}>Adicionar Cartão</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.timelineContainer}>
                <Text style={styles.sectionTitle}>Linha do Tempo</Text>
                {events.length > 0 ? (
                    events.map(event => <EventItem key={event.id} event={event} />)
                ) : (
                    <Text style={styles.emptyText}>Nenhum evento registrado.</Text>
                )}
            </View>
            </>
        )}

        {activeTab === 'stats' && (
            <View style={styles.statsContainer}>
                <Text style={styles.sectionTitle}>Desempenho dos Jogadores</Text>
                {stats.map((playerStat, index) => (
                    <View key={playerStat.playerId} style={[styles.card, index === 0 && playerStat.points > 0 && styles.motmCard]}>
                        <View style={styles.playerInfo}>
                            <Text style={styles.rankText}>{index + 1}</Text>
                            <Text style={styles.cardText}>{playerStat.playerName}</Text>
                            {index === 0 && playerStat.points > 0 && <Feather name="star" size={16} color="#FFC107" style={{marginLeft: 8}} />}
                        </View>
                        <View style={styles.playerStats}>
                            <Text style={styles.pointsText}>{playerStat.points} pts</Text>
                            <Text style={styles.statDetail}>G: {playerStat.goals} | A: {playerStat.assists}</Text>
                        </View>
                    </View>
                ))}
            </View>
        )}
      </ScrollView>

      {/* MODAL AVANÇADO */}
      <Modal visible={modalInfo.visible} transparent={true} animationType="fade" onRequestClose={closeModal}>
        {/* ... (código do modal sem alterações) ... */}
      </Modal>
    </SafeAreaView>
  );
}

// ESTILOS ATUALIZADOS
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F4F7FC' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scoreboard: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: '#1A2B48', paddingVertical: 20, marginHorizontal: 16, marginTop: 16, borderRadius: 16 },
    teamName: { color: 'white', fontSize: 18, fontWeight: 'bold', flex: 1, textAlign: 'center' },
    score: { color: 'white', fontSize: 40, fontWeight: 'bold' },
    tabContainer: { flexDirection: 'row', backgroundColor: '#E9EEF6', borderRadius: 25, padding: 4, marginVertical: 16, marginHorizontal: 16 },
    tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 20 },
    activeTab: { backgroundColor: '#007AFF' },
    tabText: { color: '#007AFF', fontWeight: '600', marginLeft: 8 },
    activeTabText: { color: '#FFF' },
    actionsContainer: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 16, marginBottom: 24 },
    actionButton: { backgroundColor: '#007AFF', flex: 1, marginHorizontal: 8, paddingVertical: 15, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
    actionButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
    timelineContainer: { paddingHorizontal: 16 },
    statsContainer: { paddingHorizontal: 16 },
    sectionTitle: { fontSize: 22, fontWeight: 'bold', color: '#1A2B48', marginBottom: 12 },
    emptyText: { textAlign: 'center', color: 'gray', padding: 16, fontSize: 14 },
    eventCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 12, borderRadius: 8, marginBottom: 8 },
    eventMinuteContainer: { backgroundColor: '#E9EEF6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginRight: 12 },
    eventMinute: { fontWeight: 'bold', color: '#1A2B48' },
    eventDetails: { marginLeft: 12 },
    eventPlayer: { fontSize: 16, fontWeight: '500' },
    eventAssist: { fontSize: 12, color: 'gray' },
    card: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2, shadowColor: '#1A2B48', shadowOpacity: 0.05, shadowRadius: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    cardText: { fontSize: 16, fontWeight: '500', color: '#1A2B48' },
    motmCard: { backgroundColor: '#FFFBEB', borderColor: '#FFC107', borderWidth: 1 },
    playerInfo: { flexDirection: 'row', alignItems: 'center' },
    playerStats: { alignItems: 'flex-end' },
    rankText: { fontSize: 18, fontWeight: 'bold', color: '#A0AEC0', marginRight: 16, width: 25 },
    pointsText: { fontSize: 16, fontWeight: 'bold', color: '#007AFF' },
    statDetail: { fontSize: 12, color: 'gray' },
    // Estilos do Modal
    modalBackdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
    modalView: { backgroundColor: 'white', borderRadius: 20, padding: 24, width: '90%', maxHeight: '80%', elevation: 10 },
    modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#1A2B48', marginBottom: 20, textAlign: 'center' },
    input: { backgroundColor: '#F4F7FC', height: 50, borderRadius: 10, paddingHorizontal: 15, fontSize: 16, marginBottom: 15 },
    label: { fontSize: 16, color: '#4A5568', marginBottom: 8, fontWeight: '500' },
    playerList: { maxHeight: 150, width: '100%', borderWidth: 1, borderColor: '#E9EEF6', borderRadius: 10, marginBottom: 15 },
    playerListHeader: { padding: 8, backgroundColor: '#F4F7FC', fontWeight: 'bold' },
    playerItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#E9EEF6' },
    playerSelected: { backgroundColor: '#D6EAF8' },
    cardSelector: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 15, width: '100%' },
    cardOption: { flexDirection: 'row', alignItems: 'center', padding: 10, borderWidth: 1, borderColor: '#DDD', borderRadius: 8, flex: 0.48, justifyContent: 'center' },
    yellowCard: { width: 15, height: 20, backgroundColor: '#FFC107', marginRight: 8 },
    redCard: { width: 15, height: 20, backgroundColor: '#DC3545', marginRight: 8 },
    yellowSelected: { borderColor: '#FFC107', backgroundColor: '#FFF9E6' },
    redSelected: { borderColor: '#DC3545', backgroundColor: '#FADBD8' },
    buttonRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 10 },
    modalButton: { paddingVertical: 12, borderRadius: 10, flex: 0.48, alignItems: 'center' },
    cancelButton: { backgroundColor: '#E9EEF6' },
    createButton: { backgroundColor: '#007AFF' },
    modalButtonText: { fontWeight: 'bold', color: '#1A2B48', fontSize: 16 },
});