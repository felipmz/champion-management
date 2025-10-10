// app/campeonato/[id].tsx
import { Stack, useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Modal, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { Team, Fixture, TeamStanding, PlayerStat } from '../../constants/types';
import { useAppStore } from '../../stores/championshipStore';

type ActiveTab = 'teams' | 'fixtures' | 'standings' | 'player_stats' | 'assist_stats' | 'highlights';

export default function ChampionshipDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const championshipId = String(id);

  const {
    selectedChampionship,
    teams,
    fixtures,
    standings,
    playerStats,
    assistStats,
    roundHighlights,
    isLoading,
    fetchChampionshipDetails,
    fetchRoundHighlights,
    createTeam,
    deleteTeam,
    generateFixtures,
  } = useAppStore(); 

  const [modalVisible, setModalVisible] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('teams');
  const [currentRound, setCurrentRound] = useState(1);

  useFocusEffect(
    useCallback(() => {
      if (championshipId && championshipId !== "undefined") {
        fetchChampionshipDetails(championshipId);
        fetchRoundHighlights(championshipId, 1);
        setCurrentRound(1);
      }
    }, [championshipId])
  );

  useEffect(() => {
    if (activeTab === 'highlights') {
      fetchRoundHighlights(championshipId, currentRound);
    }
  }, [currentRound, activeTab]);

  const handleCreateTeam = async () => {
    if (newTeamName.trim().length === 0) return;
    try {
      await createTeam(championshipId, newTeamName);
      setModalVisible(false);
      setNewTeamName('');
    } catch (error) { 
      Alert.alert("Erro", "Não foi possível criar o time.");
      console.error(error);
    }
  };
  
  const handleGenerateFixtures = () => {
     Alert.alert("Gerar Tabela", "Deseja gerar a tabela de jogos?", [{ text: "Cancelar" }, { text: "Gerar", onPress: async () => {
        try {
            await generateFixtures(championshipId);
            setActiveTab('fixtures');
        } catch (error) {
            Alert.alert("Erro", "Não foi possível gerar a tabela.");
            console.error(error);
        }
     }}]);
  };

  const handleDeleteTeam = (teamId: string, teamName: string) => {
    Alert.alert( "Excluir Time", `Tem certeza que deseja excluir o time "${teamName}"?`, [
        { text: "Cancelar" },
        { text: "Excluir", style: "destructive", onPress: async () => {
            try {
                await deleteTeam(teamId, championshipId);
                Alert.alert("Sucesso", `Time "${teamName}" foi excluído.`);
            } catch (error: any) {
                const message = error.response?.data?.message || "Não foi possível excluir o time.";
                Alert.alert("Erro", message);
            }
        }}
    ]);
  };

  const navigateToMatch = (fixtureId: string) => router.push(`/partida/${fixtureId}`);
  const navigateToTeam = (teamId: string) => router.push(`/time/${teamId}`);

  if (isLoading || !selectedChampionship) {
    return <ActivityIndicator size="large" style={styles.centered} />;
  }

  const maxRounds = fixtures.length > 0 ? Math.max(...fixtures.map(f => f.round)) : 1;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: selectedChampionship.name }} />
      <ScrollView style={styles.container}>
        <View style={styles.tabContainer}>
            <TouchableOpacity style={[styles.tab, activeTab === 'teams' && styles.activeTab]} onPress={() => setActiveTab('teams')}>
                <Feather name="users" size={18} color={activeTab === 'teams' ? '#FFF' : '#007AFF'} />
                <Text style={[styles.tabText, activeTab === 'teams' && styles.activeTabText]}>Times</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, activeTab === 'fixtures' && styles.activeTab]} onPress={() => setActiveTab('fixtures')}>
                <Feather name="list" size={18} color={activeTab === 'fixtures' ? '#FFF' : '#007AFF'} />
                <Text style={[styles.tabText, activeTab === 'fixtures' && styles.activeTabText]}>Partidas</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, activeTab === 'standings' && styles.activeTab]} onPress={() => setActiveTab('standings')}>
                <Feather name="bar-chart-2" size={18} color={activeTab === 'standings' ? '#FFF' : '#007AFF'} />
                <Text style={[styles.tabText, activeTab === 'standings' && styles.activeTabText]}>Classificação</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, activeTab === 'player_stats' && styles.activeTab]} onPress={() => setActiveTab('player_stats')}>
                <Feather name="award" size={18} color={activeTab === 'player_stats' ? '#FFF' : '#007AFF'} />
                <Text style={[styles.tabText, activeTab === 'player_stats' && styles.activeTabText]}>Artilharia</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, activeTab === 'assist_stats' && styles.activeTab]} onPress={() => setActiveTab('assist_stats')}>
                <Feather name="send" size={18} color={activeTab === 'assist_stats' ? '#FFF' : '#007AFF'} />
                <Text style={[styles.tabText, activeTab === 'assist_stats' && styles.activeTabText]}>Assistências</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, activeTab === 'highlights' && styles.activeTab]} onPress={() => setActiveTab('highlights')}>
                <Feather name="trending-up" size={18} color={activeTab === 'highlights' ? '#FFF' : '#007AFF'} />
                <Text style={[styles.tabText, activeTab === 'highlights' && styles.activeTabText]}>Destaques</Text>
            </TouchableOpacity>
        </View>
        
        {activeTab === 'teams' && (
          <View style={styles.contentView}>
            <Text style={styles.sectionTitle}>Times Inscritos ({teams.length})</Text>
            {/* MUDANÇA 3: Adicionando tipo explícito */}
            {teams.map((team: Team) => (
              <View key={team._id} style={styles.card}>
                <TouchableOpacity style={styles.cardContent} onPress={() => navigateToTeam(team._id)}>
                  <Text style={styles.cardText}>{team.name}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteTeam(team._id, team.name)}>
                  <Feather name="trash-2" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        {activeTab === 'fixtures' && (
          <View style={styles.contentView}>
            <TouchableOpacity style={styles.primaryButton} onPress={handleGenerateFixtures}>
              <Feather name="shuffle" size={20} color="white" />
              <Text style={styles.primaryButtonText}>Gerar Tabela de Jogos</Text>
            </TouchableOpacity>
            <Text style={styles.sectionTitle}>Partidas</Text>
            {/* MUDANÇA 3: Adicionando tipo explícito */}
            {fixtures.map((fixture: Fixture) => (
              <TouchableOpacity key={fixture._id} style={styles.card} onPress={() => navigateToMatch(fixture._id)}>
                <View style={styles.fixtureRow}>
                  <Text style={styles.teamName}>{fixture.home_team_name}</Text>
                  <Text style={styles.vsText}>vs</Text>
                  <Text style={styles.teamName}>{fixture.away_team_name}</Text>
                </View>
              </TouchableOpacity>
            ))}
            {fixtures.length === 0 && <Text style={styles.emptyText}>Tabela ainda não gerada.</Text>}
          </View>
        )}
        {activeTab === 'standings' && (
          <View style={styles.contentView}>
            <Text style={styles.sectionTitle}>Tabela de Classificação</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, {flex: 0.5}]}>#</Text>
              <Text style={[styles.tableHeaderText, {flex: 3, textAlign: 'left'}]}>Time</Text>
              <Text style={styles.tableHeaderText}>P</Text>
              <Text style={styles.tableHeaderText}>J</Text>
              <Text style={styles.tableHeaderText}>V</Text>
              <Text style={styles.tableHeaderText}>SG</Text>
            </View>
            {/* MUDANÇA 3: Adicionando tipo explícito */}
            {standings.map((team: TeamStanding) => (
              <View key={team.position} style={styles.tableRow}>
                <Text style={[styles.tableCell, {flex: 0.5}]}>{team.position}</Text>
                <Text style={[styles.tableCell, styles.teamNameCell, {flex: 3, textAlign: 'left'}]}>{team.teamName}</Text>
                <Text style={[styles.tableCell, {fontWeight: 'bold'}]}>{team.points}</Text>
                <Text style={styles.tableCell}>{team.played}</Text>
                <Text style={styles.tableCell}>{team.wins}</Text>
                <Text style={styles.tableCell}>{team.goalDifference}</Text>
              </View>
            ))}
          </View>
        )}
        {activeTab === 'player_stats' && (
          <View style={styles.contentView}>
            <Text style={styles.sectionTitle}>Artilharia</Text>
            {/* MUDANÇA 3: Adicionando tipo explícito */}
            {playerStats.map((player: PlayerStat) => (
              <View key={player.position} style={styles.card}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Text style={styles.rankText}>{player.position}</Text>
                  <View>
                    <Text style={styles.cardText}>{player.playerName}</Text>
                    <Text style={styles.cardSubText}>{player.teamName}</Text>
                  </View>
                </View>
                <Text style={styles.goalsText}>{player.goals} Gols</Text>
              </View>
            ))}
          </View>
        )}
        {activeTab === 'assist_stats' && (
          <View style={styles.contentView}>
            <Text style={styles.sectionTitle}>Líderes de Assistência</Text>
            {assistStats.length > 0 ? playerStats.map((player: PlayerStat) => (
              <View key={player.position} style={styles.card}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Text style={styles.rankText}>{player.position}</Text>
                  <View>
                    <Text style={styles.cardText}>{player.playerName}</Text>
                    <Text style={styles.cardSubText}>{player.teamName}</Text>
                  </View>
                </View>
                <Text style={styles.goalsText}>{player.assists} Assist.</Text>
              </View>
            )) : <Text style={styles.emptyText}>Nenhuma assistência registrada.</Text>}
          </View>
        )}
        {activeTab === 'highlights' && (
          <View style={styles.contentView}>
            <Text style={styles.sectionTitle}>Destaques da Rodada</Text>
            
            <View style={styles.roundSelector}>
              <TouchableOpacity onPress={() => setCurrentRound(r => Math.max(1, r - 1))} disabled={currentRound === 1}>
                <Feather name="chevron-left" size={24} color={currentRound === 1 ? '#CCC' : '#007AFF'} />
              </TouchableOpacity>
              <Text style={styles.roundSelectorText}>Rodada {currentRound}</Text>
              <TouchableOpacity onPress={() => setCurrentRound(r => Math.min(maxRounds, r + 1))} disabled={currentRound === maxRounds}>
                <Feather name="chevron-right" size={24} color={currentRound === maxRounds ? '#CCC' : '#007AFF'} />
              </TouchableOpacity>
            </View>

            {roundHighlights?.bolaCheia ? (
              <>
                <View style={[styles.highlightCard, styles.bolaCheiaCard]}>
                    <View style={styles.highlightHeader}>
                        <Feather name="arrow-up-circle" size={24} color="#15803D" />
                        <Text style={[styles.highlightTitle, {color: '#15803D'}]}>BOLA CHEIA</Text>
                    </View>
                    <Text style={styles.highlightPlayerName}>{roundHighlights.bolaCheia.playerName}</Text>
                    <Text style={styles.highlightTeamName}>{roundHighlights.bolaCheia.teamName}</Text>
                    <Text style={styles.highlightPoints}>{roundHighlights.bolaCheia.points} pts na rodada</Text>
                </View>

                {roundHighlights?.bolaMurcha && (
                    <View style={[styles.highlightCard, styles.bolaMurchaCard]}>
                         <View style={styles.highlightHeader}>
                            <Feather name="arrow-down-circle" size={24} color="#DC2626" />
                            <Text style={[styles.highlightTitle, {color: '#DC2626'}]}>BOLA MURCHA</Text>
                        </View>
                        <Text style={styles.highlightPlayerName}>{roundHighlights.bolaMurcha.playerName}</Text>
                        <Text style={styles.highlightTeamName}>{roundHighlights.bolaMurcha.teamName}</Text>
                        <Text style={styles.highlightPoints}>{roundHighlights.bolaMurcha.points} pts na rodada</Text>
                    </View>
                )}
              </>
            ) : (
              <Text style={styles.emptyText}>Sem dados de destaques para esta rodada.</Text>
            )}
          </View>
        )}
      </ScrollView>

      {activeTab === 'teams' && (
        <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
          <Feather name="plus" size={24} color="white" />
        </TouchableOpacity>
      )}
      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>Adicionar Novo Time</Text>
            <TextInput placeholder="Nome do Time" style={styles.input} value={newTeamName} onChangeText={setNewTeamName} />
            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.createButton]} onPress={handleCreateTeam}>
                <Text style={[styles.modalButtonText, {color: '#FFF'}]}>Adicionar</Text>
              </TouchableOpacity>
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
  container: { paddingHorizontal: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#E9EEF6', borderRadius: 25, padding: 4, marginVertical: 16, justifyContent: 'space-around' },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 20 },
  activeTab: { backgroundColor: '#007AFF' },
  tabText: { color: '#007AFF', fontWeight: '600', marginLeft: 4, fontSize: 10 },
  activeTabText: { color: '#FFF' },
  contentView: { marginVertical: 10 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', color: '#1A2B48', marginBottom: 12 },
  card: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2, shadowColor: '#1A2B48', shadowOpacity: 0.05, shadowRadius: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardContent: { flex: 1 },
  deleteButton: { padding: 8, marginLeft: 12 },
  cardText: { fontSize: 16, fontWeight: '500', color: '#1A2B48' },
  cardSubText: { fontSize: 14, color: '#A0AEC0', marginTop: 4 },
  fixtureRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  teamName: { fontSize: 16, fontWeight: '500', flex: 1, textAlign: 'center'},
  vsText: { color: '#888', marginHorizontal: 10, fontSize: 12 },
  roundText: { fontSize: 12, color: '#888', textAlign: 'center', marginTop: 8 },
  emptyText: { textAlign: 'center', color: 'gray', padding: 16, fontSize: 14 },
  primaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#28A745', paddingVertical: 12, borderRadius: 10, marginBottom: 16 },
  primaryButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  fab: { position: 'absolute', bottom: 30, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center', elevation: 5 },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalView: { backgroundColor: 'white', borderRadius: 10, padding: 20, width: '90%', alignItems: 'center' },
  modalText: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  input: { height: 45, borderColor: '#DDD', borderWidth: 1, borderRadius: 8, width: '100%', marginBottom: 20, paddingHorizontal: 10 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  modalButton: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, flex: 0.48, alignItems: 'center' },
  cancelButton: { backgroundColor: '#E9EEF6' },
  createButton: { backgroundColor: '#007AFF' },
  modalButtonText: { fontWeight: 'bold', color: '#1A2B48' },
  tableHeader: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 8, borderBottomWidth: 2, borderBottomColor: '#E9EEF6' },
  tableHeaderText: { flex: 1, fontWeight: 'bold', color: '#A0AEC0', textAlign: 'center', fontSize: 12 },
  tableRow: { flexDirection: 'row', backgroundColor: '#FFF', paddingHorizontal: 10, paddingVertical: 12, borderRadius: 8, marginBottom: 8, alignItems: 'center', elevation: 1 },
  tableCell: { flex: 1, color: '#4A5568', textAlign: 'center' },
  teamNameCell: { fontWeight: '600', color: '#1A2B48' },
  rankText: { fontSize: 18, fontWeight: 'bold', color: '#A0AEC0', marginRight: 16, width: 25 },
  goalsText: { fontSize: 16, fontWeight: 'bold', color: '#007AFF' },
  roundSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: 12, borderRadius: 12, marginBottom: 20 },
  roundSelectorText: { fontSize: 18, fontWeight: 'bold', color: '#1A2B48' },
  highlightCard: { padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 2 },
  bolaCheiaCard: { backgroundColor: '#F0FDF4', borderColor: '#4ADE80' },
  bolaMurchaCard: { backgroundColor: '#FEF2F2', borderColor: '#F87171' },
  highlightHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  highlightTitle: { fontSize: 14, fontWeight: 'bold', marginLeft: 8, letterSpacing: 1 },
  highlightPlayerName: { fontSize: 22, fontWeight: 'bold', color: '#1A2B48' },
  highlightTeamName: { fontSize: 14, color: '#A0AEC0' },
  highlightPoints: { fontSize: 16, fontWeight: '600', color: '#1A2B48', marginTop: 10 },

});