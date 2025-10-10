import { Stack, useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Modal, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Colors from '../../constants/colors';

import { Team, Fixture, TeamStanding, PlayerStat } from '../../constants/types';
import { useAppStore } from '../../stores/championshipStore';

// O tipo agora representa a tela/conteúdo ativo, não mais uma aba
type ActiveScreen = 'teams' | 'fixtures' | 'standings' | 'player_stats' | 'assist_stats' | 'highlights';

// Mapeia o tipo da tela para um título amigável que será mostrado no topo
const screenTitles: Record<ActiveScreen, string> = {
  teams: 'Times Inscritos',
  fixtures: 'Partidas',
  standings: 'Tabela de Classificação',
  player_stats: 'Artilharia',
  assist_stats: 'Líderes de Assistência',
  highlights: 'Destaques da Rodada',
};

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

  // Renomeado para refletir que é o modal de adicionar time
  const [teamModalVisible, setTeamModalVisible] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  // Renomeado de activeTab para activeScreen para maior clareza
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('teams');
  const [currentRound, setCurrentRound] = useState(1);
  // Novo estado para controlar a visibilidade do menu hambúrguer
  const [menuVisible, setMenuVisible] = useState(false);

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
    if (activeScreen === 'highlights' && championshipId && championshipId !== "undefined") {
      fetchRoundHighlights(championshipId, currentRound);
    }
  }, [currentRound, activeScreen]);

  // Função para mudar de tela e fechar o menu
  const handleSelectScreen = (screen: ActiveScreen) => {
    setActiveScreen(screen);
    setMenuVisible(false);
  };

  const handleCreateTeam = async () => {
    if (newTeamName.trim().length === 0) return;
    try {
      await createTeam(championshipId, newTeamName);
      setTeamModalVisible(false);
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
            handleSelectScreen('fixtures'); // Muda para a tela de partidas
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

  // Array de opções para o menu hambúrguer
  const menuOptions: { key: ActiveScreen, title: string, icon: keyof typeof Feather.glyphMap }[] = [
      { key: 'teams', title: 'Times', icon: 'users' },
      { key: 'fixtures', title: 'Partidas', icon: 'list' },
      { key: 'standings', title: 'Classificação', icon: 'bar-chart-2' },
      { key: 'player_stats', title: 'Artilharia', icon: 'award' },
      { key: 'assist_stats', title: 'Assistências', icon: 'send' },
      { key: 'highlights', title: 'Destaques', icon: 'trending-up' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen 
        options={{ 
          title: selectedChampionship.name,
          // Adiciona o ícone de menu no cabeçalho
          headerRight: () => (
            <TouchableOpacity onPress={() => setMenuVisible(true)} style={{ marginRight: 15 }}>
              <Feather name="menu" size={24} color="#007AFF" />
            </TouchableOpacity>
          ),
        }} 
      />
      <ScrollView style={styles.container}>
        
        {/* O menu de abas foi removido daqui */}
        
        {activeScreen === 'teams' && (
          <View style={styles.contentView}>
            <Text style={styles.sectionTitle}>Times Inscritos ({teams.length})</Text>
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

        {activeScreen === 'fixtures' && (
          <View style={styles.contentView}>
            <TouchableOpacity style={styles.primaryButton} onPress={handleGenerateFixtures}>
              <Feather name="shuffle" size={20} color="white" />
              <Text style={styles.primaryButtonText}>Gerar Tabela de Jogos</Text>
            </TouchableOpacity>
            <Text style={styles.sectionTitle}>Partidas</Text>
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

        {activeScreen === 'standings' && (
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

        {activeScreen === 'player_stats' && (
          <View style={styles.contentView}>
            <Text style={styles.sectionTitle}>Artilharia</Text>
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

        {activeScreen === 'assist_stats' && (
          <View style={styles.contentView}>
            <Text style={styles.sectionTitle}>Líderes de Assistência</Text>
            {assistStats.length > 0 ? assistStats.map((player: PlayerStat) => (
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

        {activeScreen === 'highlights' && (
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
                {roundHighlights?.bolaMurcha && roundHighlights.bolaCheia.playerId !== roundHighlights.bolaMurcha.playerId && (
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

      {activeScreen === 'teams' && (
        <TouchableOpacity style={styles.fab} onPress={() => setTeamModalVisible(true)}>
          <Feather name="plus" size={24} color="white" />
        </TouchableOpacity>
      )}
      
      <Modal visible={teamModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>Adicionar Novo Time</Text>
            <TextInput placeholder="Nome do Time" style={styles.input} value={newTeamName} onChangeText={setNewTeamName} />
            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setTeamModalVisible(false)}>
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.createButton]} onPress={handleCreateTeam}>
                <Text style={[styles.modalButtonText, {color: '#FFF'}]}>Adicionar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* NOVO MODAL PARA O MENU HAMBÚRGUER */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity style={styles.menuBackdrop} activeOpacity={1} onPress={() => setMenuVisible(false)}>
            <View style={styles.menuContainer}>
                <Text style={styles.menuTitle}>Menu do Campeonato</Text>
                {menuOptions.map(option => (
                    <TouchableOpacity key={option.key} style={styles.menuItem} onPress={() => handleSelectScreen(option.key)}>
                        <Feather name={option.icon} size={22} color={activeScreen === option.key ? '#007AFF' : '#4A5568'} />
                        <Text style={[styles.menuItemText, activeScreen === option.key && styles.menuItemTextActive]}>{option.title}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// ESTILOS ATUALIZADOS
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { paddingHorizontal: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  contentView: { marginVertical: 10 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', color: Colors.text, marginBottom: 12 },
  card: { backgroundColor: Colors.surface, padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2, shadowColor: Colors.text, shadowOpacity: 0.05, shadowRadius: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardContent: { flex: 1 },
  deleteButton: { padding: 8, marginLeft: 12 },
  cardText: { fontSize: 16, fontWeight: '500', color: Colors.text },
  cardSubText: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  fixtureRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  teamName: { fontSize: 16, fontWeight: '500', flex: 1, textAlign: 'center'},
  vsText: { color: Colors.textSecondary, marginHorizontal: 10, fontSize: 12 },
  roundText: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center', marginTop: 8 },
  emptyText: { textAlign: 'center', color: Colors.textSecondary, padding: 16, fontSize: 14 },
  primaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary, paddingVertical: 12, borderRadius: 10, marginBottom: 16 },
  primaryButtonText: { color: Colors.white, fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  fab: { position: 'absolute', bottom: 30, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalView: { backgroundColor: Colors.surface, borderRadius: 10, padding: 20, width: '90%', alignItems: 'center' },
  modalText: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: Colors.text },
  input: { height: 45, borderColor: '#DDD', borderWidth: 1, borderRadius: 8, width: '100%', marginBottom: 20, paddingHorizontal: 10 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  modalButton: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, flex: 0.48, alignItems: 'center' },
  cancelButton: { backgroundColor: '#E9EEF6' },
  createButton: { backgroundColor: Colors.primary },
  modalButtonText: { fontWeight: 'bold', color: Colors.text },
  tableHeader: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 8, borderBottomWidth: 2, borderBottomColor: '#E9EEF6' },
  tableHeaderText: { flex: 1, fontWeight: 'bold', color: Colors.textSecondary, textAlign: 'center', fontSize: 12 },
  tableRow: { flexDirection: 'row', backgroundColor: Colors.surface, paddingHorizontal: 10, paddingVertical: 12, borderRadius: 8, marginBottom: 8, alignItems: 'center', elevation: 1 },
  tableCell: { flex: 1, color: Colors.textSecondary, textAlign: 'center' },
  teamNameCell: { fontWeight: '600', color: Colors.text },
  rankText: { fontSize: 18, fontWeight: 'bold', color: Colors.textSecondary, marginRight: 16, width: 25 },
  goalsText: { fontSize: 16, fontWeight: 'bold', color: Colors.primary },
  roundSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surface, padding: 12, borderRadius: 12, marginBottom: 20 },
  roundSelectorText: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
  highlightCard: { padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 2 },
  bolaCheiaCard: { backgroundColor: '#F0FDF4', borderColor: Colors.primary },
  bolaMurchaCard: { backgroundColor: '#FEF2F2', borderColor: Colors.danger },
  highlightHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  highlightTitle: { fontSize: 14, fontWeight: 'bold', marginLeft: 8, letterSpacing: 1 },
  highlightPlayerName: { fontSize: 22, fontWeight: 'bold', color: Colors.text },
  highlightTeamName: { fontSize: 14, color: Colors.textSecondary },
  highlightPoints: { fontSize: 16, fontWeight: '600', color: Colors.text, marginTop: 10 },
  menuBackdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)'},
  menuContainer: { position: 'absolute', top: 0, right: 0, width: '75%', maxWidth: 300, height: '100%', backgroundColor: Colors.background, paddingTop: 60, paddingHorizontal: 0, borderLeftWidth: 1, borderLeftColor: '#E2E8F0', shadowColor: Colors.black, shadowOffset: { width: -2, height: 0 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 10 },
  menuTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, paddingHorizontal: 20, marginBottom: 10 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 20 },
  menuItemText: { fontSize: 18, marginLeft: 15, color: Colors.text, fontWeight: '500' },
  menuItemTextActive: { color: Colors.primary, fontWeight: 'bold' },
});