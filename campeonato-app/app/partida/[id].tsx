// app/partida/[id].tsx
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { Fixture, GameEvent, Player, PlayerMatchStat } from '../../constants/types';
import api from '../../services/api';

// Componente EventItem corrigido
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
          {/* CORREÇÃO AQUI */}
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
  const router = useRouter();
  const matchId = String(id);

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
    try {
      setLoading(true);
      const [matchResponse, eventsResponse, playersResponse, statsResponse] = await Promise.all([
        api.get(`/matches/${matchId}`),
        api.get(`/matches/${matchId}/events`),
        api.get(`/matches/${matchId}/players`),
        api.get(`/matches/${matchId}/stats`),
      ]);
      
      setMatch(matchResponse.data || null);
      setEvents(eventsResponse.data.sort((a: GameEvent, b: GameEvent) => a.minute - b.minute));
      setPlayers(playersResponse.data);
      setStats(statsResponse.data);
    } catch (error) {
      console.error("Erro ao buscar dados da partida:", error);
      Alert.alert("Erro", "Não foi possível carregar os dados da partida.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (matchId) fetchMatchData(); }, [id]);

  const handleSaveEvent = async () => {
    if (!eventMinute || !selectedPlayer) { alert('Preencha o minuto e o jogador.'); return; }

    let eventPayload: any;
    if (modalInfo.type === 'goal') {
        eventPayload = { type: 'goal', player_id: selectedPlayer._id, assister_id: selectedAssister?._id, team_id: selectedPlayer.team_id, minute: parseInt(eventMinute) };
    } else {
        eventPayload = { type: selectedCard, player_id: selectedPlayer._id, team_id: selectedPlayer.team_id, minute: parseInt(eventMinute) };
    }
    
    try {
        await api.post(`/matches/${matchId}/events`, eventPayload);
        closeModal();
        fetchMatchData();
    } catch (error) {
        console.error("Erro ao salvar evento:", error);
        Alert.alert("Erro", "Não foi possível salvar o evento.");
    }
  };

  const handleFinishMatch = () => {
    Alert.alert("Finalizar Partida", "Deseja marcar esta partida como finalizada?", [ { text: "Cancelar" }, { text: "Finalizar", style: "destructive", onPress: async () => {
        try {
            await api.patch(`/matches/${matchId}/status`, { status: 'finished' });
            Alert.alert("Sucesso", "Partida finalizada!", [{ text: "OK", onPress: () => router.back() }]);
        } catch (error) {
            Alert.alert("Erro", "Não foi possível finalizar a partida.");
        }
    }}]);
  };
  
  const openModal = (type: 'goal' | 'card') => setModalInfo({ visible: true, type });
  const closeModal = () => { setModalInfo({ visible: false, type: null }); setEventMinute(''); setSelectedPlayer(null); setSelectedAssister(null); };
  
  if (loading) return <ActivityIndicator size="large" style={styles.centered} />;
  if (!match) return <Text style={styles.centered}>Partida não encontrada.</Text>;
  
  const homeTeamPlayers = players.filter(p => String(p.team_id) === String(match.home_team_id._id));
  const awayTeamPlayers = players.filter(p => String(p.team_id) === String(match.away_team_id._id));

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen 
        options={{ 
          title: `Rodada ${match.round}`,
          headerRight: () => (
            match.status !== 'finished' && (
              <TouchableOpacity onPress={handleFinishMatch} style={{ marginRight: 10 }}>
                <Feather name="check-circle" size={24} color="#28A745" />
              </TouchableOpacity>
            )
          ),
        }} 
      />
      <View style={styles.scoreboard}>
        <Text style={styles.teamName}>{match.home_team_name}</Text>
        <Text style={styles.score}>{match.home_team_score} - {match.away_team_score}</Text>
        <Text style={styles.teamName}>{match.away_team_name}</Text>
        {match.status === 'finished' && <View style={styles.finishedOverlay}><Text style={styles.finishedText}>FINALIZADA</Text></View>}
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
              <TouchableOpacity style={[styles.actionButton, match.status === 'finished' && styles.disabledButton]} onPress={() => openModal('goal')} disabled={match.status === 'finished'}>
                <Feather name="award" size={24} color="#FFF" />
                <Text style={styles.actionButtonText}>Adicionar Gol</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, match.status === 'finished' && styles.disabledButton]} onPress={() => openModal('card')} disabled={match.status === 'finished'}>
                <Feather name="square" size={24} color="#FFF" />
                <Text style={styles.actionButtonText}>Adicionar Cartão</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.timelineContainer}>
              <Text style={styles.sectionTitle}>Linha do Tempo</Text>
              {events.length > 0 ? (
                events.map(event => <EventItem key={event._id} event={event} />)
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

      <Modal visible={modalInfo.visible} transparent={true} animationType="fade" onRequestClose={closeModal}>
        <View style={styles.modalBackdrop}>
            <View style={styles.modalView}>
                <Text style={styles.modalTitle}>Registrar {modalInfo.type === 'goal' ? 'Gol' : 'Cartão'}</Text>
                <TextInput placeholder="Minuto do Jogo (ex: 42)" style={styles.input} keyboardType="number-pad" value={eventMinute} onChangeText={setEventMinute} />
                {modalInfo.type === 'card' && ( <View style={styles.cardSelector}><TouchableOpacity onPress={() => setSelectedCard('yellow_card')} style={[styles.cardOption, selectedCard === 'yellow_card' && styles.yellowSelected]}><View style={styles.yellowCard}></View><Text>Amarelo</Text></TouchableOpacity><TouchableOpacity onPress={() => setSelectedCard('red_card')} style={[styles.cardOption, selectedCard === 'red_card' && styles.redSelected]}><View style={styles.redCard}></View><Text>Vermelho</Text></TouchableOpacity></View> )}
                <Text style={styles.label}>Jogador Principal</Text>
                <ScrollView style={styles.playerList}>
                    <Text style={styles.playerListHeader}>{match.home_team_name}</Text>
                    {homeTeamPlayers.map(p => <TouchableOpacity key={p._id} onPress={() => setSelectedPlayer(p)} style={[styles.playerItem, selectedPlayer?._id === p._id && styles.playerSelected]}><Text>{p.name}</Text></TouchableOpacity>)}
                    <Text style={styles.playerListHeader}>{match.away_team_name}</Text>
                    {awayTeamPlayers.map(p => <TouchableOpacity key={p._id} onPress={() => setSelectedPlayer(p)} style={[styles.playerItem, selectedPlayer?._id === p._id && styles.playerSelected]}><Text>{p.name}</Text></TouchableOpacity>)}
                </ScrollView>
                {modalInfo.type === 'goal' && ( <>
                <Text style={styles.label}>Assistência (Opcional)</Text>
                <ScrollView style={styles.playerList}>
                  {players.filter(p => p._id !== selectedPlayer?._id).map(p => 
                    <TouchableOpacity key={p._id} onPress={() => setSelectedAssister(p)} style={[styles.playerItem, selectedAssister?._id === p._id && styles.playerSelected]}>
                      <Text>{p.name}</Text>
                    </TouchableOpacity>
                  )}
                </ScrollView>
                </>)}
                <View style={styles.buttonRow}>
                    <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={closeModal}><Text style={styles.modalButtonText}>Cancelar</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.modalButton, styles.createButton]} onPress={handleSaveEvent}><Text style={[styles.modalButtonText, {color: '#FFF'}]}>Salvar Evento</Text></TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Estilos
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F4F7FC' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scoreboard: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: '#1A2B48', paddingVertical: 20, marginHorizontal: 16, marginTop: 16, borderRadius: 16 },
    teamName: { color: 'white', fontSize: 18, fontWeight: 'bold', flex: 1, textAlign: 'center' },
    score: { color: 'white', fontSize: 40, fontWeight: 'bold' },
    tabContainer: { flexDirection: 'row', backgroundColor: '#E9EEF6', borderRadius: 25, padding: 4, marginVertical: 16, marginHorizontal: 16 },
    tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 20 },
    activeTab: { backgroundColor: '#007AFF' },
    tabText: { color: '#007AFF', fontWeight: '600', marginLeft: 8, fontSize: 14 },
    activeTabText: { color: '#FFF' },
    actionsContainer: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 16, marginBottom: 24 },
    actionButton: { backgroundColor: '#007AFF', flex: 1, marginHorizontal: 8, paddingVertical: 15, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
    disabledButton: { backgroundColor: '#A0AEC0' },
    actionButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
    timelineContainer: { paddingHorizontal: 16 },
    statsContainer: { paddingHorizontal: 16 },
    sectionTitle: { fontSize: 22, fontWeight: 'bold', color: '#1A2B48', marginBottom: 12 },
    emptyText: { textAlign: 'center', color: 'gray', padding: 16, fontSize: 14 },
    eventCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 12, borderRadius: 8, marginBottom: 8 },
    eventMinuteContainer: { backgroundColor: '#E9EEF6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginRight: 12 },
    eventMinute: { fontWeight: 'bold', color: '#1A2B48' },
    eventDetails: { marginLeft: 12, flex: 1 },
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
    finishedOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(40, 167, 69, 0.8)', justifyContent: 'center', alignItems: 'center', borderRadius: 16, },
    finishedText: { color: 'white', fontSize: 16, fontWeight: 'bold', transform: [{ rotate: '-10deg' }], },
});