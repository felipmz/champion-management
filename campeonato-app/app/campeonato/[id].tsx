// app/campeonato/[id].tsx
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons'; // Importando ícones

import { Championship, Team, Fixture } from '../../constants/types';

// =================================================================================
// DADOS MOCADOS (MOCK DATA) - AINDA NECESSÁRIOS PARA O DEV 1
// =================================================================================
const MOCK_CHAMPIONSHIPS: Championship[] = [
  { id: 1, name: 'Copa da Amizade 2025', players_per_team: 11 },
  { id: 2, name: 'Torneio de Verão', players_per_team: 7 },
];
const MOCK_TEAMS: Team[] = [
  { id: 101, championship_id: 1, name: 'Guerreiros FC' },
  { id: 102, championship_id: 1, name: 'Unidos da Vila' },
  { id: 103, championship_id: 1, name: 'Dragões da Colina' },
  { id: 104, championship_id: 1, name: 'Tubarões da Costa' },
];
const MOCK_FIXTURES: Fixture[] = [];

// ... Funções MOCK (iguais às da resposta anterior)
const getChampionshipById_MOCK = (id: number): Promise<Championship | undefined> => new Promise(resolve => resolve(MOCK_CHAMPIONSHIPS.find(c => c.id === id)));
const getTeamsByChampionshipId_MOCK = (id: number): Promise<Team[]> => new Promise(resolve => resolve(MOCK_TEAMS.filter(t => t.championship_id === id)));
const createTeam_MOCK = (championshipId: number, name: string): Promise<void> => new Promise(resolve => { MOCK_TEAMS.push({ id: Math.random(), championship_id: championshipId, name }); resolve(); });
const generateFixtures_MOCK = (championshipId: number): Promise<Fixture[]> => new Promise(resolve => { MOCK_FIXTURES.length = 0; MOCK_FIXTURES.push({id: 1, round: 1, home_team_name: 'Guerreiros FC', away_team_name: 'Unidos da Vila'}); MOCK_FIXTURES.push({id: 2, round: 1, home_team_name: 'Dragões da Colina', away_team_name: 'Tubarões da Costa'}); MOCK_FIXTURES.push({id: 3, round: 2, home_team_name: 'Tubarões da Costa', away_team_name: 'Guerreiros FC'}); resolve(MOCK_FIXTURES); });
// =================================================================================

type ActiveTab = 'teams' | 'fixtures';

export default function ChampionshipDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const championshipId = Number(id);

  const [championship, setChampionship] = useState<Championship | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
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
      setChampionship(champData || null);
      setTeams(teamsData);
      setLoading(false);
    };
    fetchDetails();
  }, [id]);

  const handleCreateTeam = async () => {
    if (newTeamName.trim().length === 0) return;
    await createTeam_MOCK(championshipId, newTeamName);
    setModalVisible(false);
    setNewTeamName('');
    const teamsData = await getTeamsByChampionshipId_MOCK(championshipId);
    setTeams(teamsData);
  };
  
  const handleGenerateFixtures = async () => {
     Alert.alert("Gerar Tabela", "Deseja gerar a tabela de jogos?", [{ text: "Cancelar" }, { text: "Gerar", onPress: async () => {
        const newFixtures = await generateFixtures_MOCK(championshipId);
        setFixtures(newFixtures);
        setActiveTab('fixtures'); // Muda para a aba de partidas
     }}]);
  };

  const navigateToMatch = (fixtureId: number) => {
    // A próxima tela que o Dev 1 irá criar!
    router.push(`./partida/${fixtureId}`);
  };

  if (loading) return <ActivityIndicator size="large" style={styles.centered} />;
  if (!championship) return <Text style={styles.centered}>Campeonato não encontrado.</Text>;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: championship.name }} />
      <ScrollView style={styles.container}>
        {/* Abas de Navegação */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'teams' && styles.activeTab]}
            onPress={() => setActiveTab('teams')}
          >
            <Feather name="users" size={20} color={activeTab === 'teams' ? '#FFF' : '#007AFF'} />
            <Text style={[styles.tabText, activeTab === 'teams' && styles.activeTabText]}>Times</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'fixtures' && styles.activeTab]}
            onPress={() => setActiveTab('fixtures')}
          >
            <Feather name="list" size={20} color={activeTab === 'fixtures' ? '#FFF' : '#007AFF'} />
            <Text style={[styles.tabText, activeTab === 'fixtures' && styles.activeTabText]}>Partidas</Text>
          </TouchableOpacity>
        </View>

        {/* Conteúdo Condicional */}
        {activeTab === 'teams' && (
          <View style={styles.contentView}>
            <Text style={styles.sectionTitle}>Times Inscritos ({teams.length})</Text>
            {teams.map(team => (
              <View key={team.id} style={styles.card}>
                <Text style={styles.cardText}>{team.name}</Text>
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

      </ScrollView>

      {/* Botão Flutuante para Adicionar Time */}
      {activeTab === 'teams' && (
        <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
          <Feather name="plus" size={24} color="white" />
        </TouchableOpacity>
      )}

      {/* Modal para adicionar time */}
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

// Estilos com um design mais moderno
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F7FC' },
  container: { paddingHorizontal: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#E9EEF6', borderRadius: 25, padding: 4, marginVertical: 16 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 20 },
  activeTab: { backgroundColor: '#007AFF' },
  tabText: { color: '#007AFF', fontWeight: '600', marginLeft: 8 },
  activeTabText: { color: '#FFF' },
  contentView: { marginVertical: 10 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', color: '#1A2B48', marginBottom: 12 },
  card: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2, shadowColor: '#1A2B48', shadowOpacity: 0.05, shadowRadius: 5 },
  cardText: { fontSize: 16, fontWeight: '500', color: '#1A2B48' },
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
});