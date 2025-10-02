// app/campeonato/[id].tsx
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Modal, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { Championship, Team, Fixture, TeamStanding, PlayerStat } from '../../constants/types';
import {
  getChampionshipById_MOCK, getTeamsByChampionshipId_MOCK, createTeam_MOCK, generateFixtures_MOCK,
  getStandings_MOCK, getPlayerStats_MOCK
} from '../../services/mockDatabase';


type ActiveTab = 'teams' | 'fixtures' | 'standings' | 'player_stats';

export default function ChampionshipDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const championshipId = Number(id);

  const [championship, setChampionship] = useState<Championship | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [standings, setStandings] = useState<TeamStanding[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('teams');

  useEffect(() => {
    const fetchDetails = async () => {
      if (!championshipId) return;
      setLoading(true);
      const champData = await getChampionshipById_MOCK(championshipId);
      const teamsData = await getTeamsByChampionshipId_MOCK(championshipId);
      const standingsData = await getStandings_MOCK(championshipId);
      const playerStatsData = await getPlayerStats_MOCK(championshipId);

      setChampionship(champData || null);
      setTeams(teamsData);
      setStandings(standingsData);
      setPlayerStats(playerStatsData);
      setLoading(false);
    };
    fetchDetails();
  }, [id]);

  // 👇👇 FUNÇÃO QUE ESTAVA FALTANDO 👇👇
  const handleCreateTeam = async () => {
    if (newTeamName.trim().length === 0) return;
    
    // TODO: Substituir pela função real do Dev 2
    await createTeam_MOCK(championshipId, newTeamName);
    
    setModalVisible(false);
    setNewTeamName('');
    
    // Re-busca os times para atualizar a lista na tela
    const teamsData = await getTeamsByChampionshipId_MOCK(championshipId);
    setTeams(teamsData);
  };
  
  const handleGenerateFixtures = async () => {
     Alert.alert("Gerar Tabela", "Deseja gerar a tabela de jogos?", [{ text: "Cancelar" }, { text: "Gerar", onPress: async () => {
        const newFixtures = await generateFixtures_MOCK(championshipId);
        setFixtures(newFixtures);
        setActiveTab('fixtures');
     }}]);
  };

  const navigateToMatch = (fixtureId: number) => {
    router.push(`/partida/${fixtureId}`);
  };

  const navigateToTeam = (teamId: number) => {
    router.push(`/time/${teamId}`);
  };

  if (loading) return <ActivityIndicator size="large" style={styles.centered} />;
  if (!championship) return <Text style={styles.centered}>Campeonato não encontrado.</Text>;

  // O JSX do return permanece o mesmo, pois ele já chamava a função 'handleCreateTeam'
  return (
    <SafeAreaView style={styles.safeArea}>
        {/* ... todo o seu código JSX a partir daqui ... */}
        {/* Ele não precisa ser alterado, apenas a função acima precisava ser adicionada. */}
        <Stack.Screen options={{ title: championship.name }} />
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
            </View>
            {activeTab === 'teams' && (
            <View style={styles.contentView}>
                <Text style={styles.sectionTitle}>Times Inscritos ({teams.length})</Text>
                {teams.map(team => (
                <TouchableOpacity key={team.id} style={styles.card} onPress={() => navigateToTeam(team.id)}>
                    <Text style={styles.cardText}>{team.name}</Text>
                    <Feather name="chevron-right" size={20} color="#CBD5E0" />
                </TouchableOpacity>
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
                {fixtures.map(fixture => (
                <TouchableOpacity key={fixture.id} style={styles.card} onPress={() => navigateToMatch(fixture.id)}>
                    <View style={styles.fixtureRow}>
                    <Text style={styles.teamName}>{fixture.home_team_name}</Text>
                    <Text style={styles.vsText}>vs</Text>
                    <Text style={styles.teamName}>{fixture.away_team_name}</Text>
                    </View>
                    <Text style={styles.roundText}>Rodada {fixture.round}</Text>
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
                {standings.map((team) => (
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
                {playerStats.map((player) => (
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


// Os estilos permanecem os mesmos
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F7FC' },
  container: { paddingHorizontal: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#E9EEF6', borderRadius: 25, padding: 4, marginVertical: 16, justifyContent: 'space-around' },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 20 },
  activeTab: { backgroundColor: '#007AFF' },
  tabText: { color: '#007AFF', fontWeight: '600', marginLeft: 6, fontSize: 12 },
  activeTabText: { color: '#FFF' },
  contentView: { marginVertical: 10 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', color: '#1A2B48', marginBottom: 12 },
  card: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2, shadowColor: '#1A2B48', shadowOpacity: 0.05, shadowRadius: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
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
  // Tabela de Classificação
  tableHeader: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 8, borderBottomWidth: 2, borderBottomColor: '#E9EEF6' },
  tableHeaderText: { flex: 1, fontWeight: 'bold', color: '#A0AEC0', textAlign: 'center', fontSize: 12 },
  tableRow: { flexDirection: 'row', backgroundColor: '#FFF', paddingHorizontal: 10, paddingVertical: 12, borderRadius: 8, marginBottom: 8, alignItems: 'center', elevation: 1 },
  tableCell: { flex: 1, color: '#4A5568', textAlign: 'center' },
  teamNameCell: { fontWeight: '600', color: '#1A2B48' },
  // Artilharia
  rankText: { fontSize: 18, fontWeight: 'bold', color: '#A0AEC0', marginRight: 16, width: 25 },
  goalsText: { fontSize: 16, fontWeight: 'bold', color: '#007AFF' },
});