// app/time/[id].tsx
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Modal, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { Player, Team } from '../../constants/types';
import api from '../../services/api';
import { useAppStore } from '../../stores/championshipStore';

export default function TeamDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const teamId = String(id);

  // Usa a função da store para atualizar os dados do campeonato quando um time for deletado
  const fetchChampionshipDetails = useAppStore(state => state.fetchChampionshipDetails);

  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');

  const fetchTeamDetails = async () => {
    if (!teamId || teamId === "undefined") return;
    try {
        setLoading(true);
        const [teamResponse, playersResponse] = await Promise.all([
            api.get(`/teams/${teamId}`),
            api.get(`/teams/${teamId}/players`),
        ]);
        setTeam(teamResponse.data);
        setPlayers(playersResponse.data);
    } catch (error) {
        console.error("Erro ao buscar detalhes do time:", error);
        Alert.alert("Erro", "Não foi possível carregar os detalhes do time.");
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamDetails();
  }, [id]);

  const handleCreatePlayer = async () => {
    if (newPlayerName.trim().length === 0) return;
    try {
        await api.post(`/teams/${teamId}/players`, { name: newPlayerName });
        setModalVisible(false);
        setNewPlayerName('');
        fetchTeamDetails();
    } catch (error) {
        console.error("Erro ao criar jogador:", error);
        Alert.alert("Erro", "Não foi possível adicionar o jogador.");
    }
  };
  
  // NOVA FUNÇÃO PARA DELETAR O TIME INTEIRO
  const handleDeleteTeam = () => {
    if (!team) return;
    Alert.alert(
        "Excluir Time",
        `Tem certeza que deseja excluir o time "${team.name}"? Todos os seus jogadores e partidas serão perdidos.`,
        [
            { text: "Cancelar", style: "cancel" },
            {
                text: "Excluir",
                style: "destructive",
                onPress: async () => {
                    try {
                        await api.delete(`/teams/${team._id}`);
                        // Atualiza a store do campeonato pai para refletir a exclusão
                        if (team.championship_id) {
                            fetchChampionshipDetails(String(team.championship_id));
                        }
                        router.back(); // Volta para a tela do campeonato
                    } catch (error: any) {
                        const message = error.response?.data?.message || "Não foi possível excluir o time.";
                        Alert.alert("Erro", message);
                    }
                },
            },
        ]
    );
  };

  // NOVA FUNÇÃO PARA DELETAR UM JOGADOR
  const handleDeletePlayer = (playerId: string, playerName: string) => {
    Alert.alert(
        "Excluir Jogador",
        `Tem certeza que deseja excluir "${playerName}"?`,
        [
            { text: "Cancelar", style: "cancel" },
            {
                text: "Excluir",
                style: "destructive",
                onPress: async () => {
                    try {
                        await api.delete(`/players/${playerId}`);
                        setPlayers(prevPlayers => prevPlayers.filter(p => p._id !== playerId));
                    } catch (error) {
                        console.error("Erro ao excluir jogador:", error);
                        Alert.alert("Erro", "Não foi possível excluir o jogador.");
                    }
                },
            },
        ]
    );
  };


  if (loading) {
    return <ActivityIndicator size="large" style={styles.centered} />;
  }

  if (!team) {
    return <Text style={styles.centered}>Time não encontrado.</Text>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen 
        options={{ 
          title: team.name,
          // BOTÃO DE EXCLUIR TIME NO CABEÇALHO
          headerRight: () => (
            <TouchableOpacity onPress={handleDeleteTeam} style={{ marginRight: 10 }}>
              <Feather name="trash-2" size={24} color="#EF4444" />
            </TouchableOpacity>
          ),
        }} 
      />
      <View style={styles.container}>
        <FlatList
          data={players}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Feather name="user" size={24} color="#4A5568" />
              <Text style={styles.cardText}>{item.name}</Text>
              <TouchableOpacity onPress={() => handleDeletePlayer(item._id, item.name)} style={styles.deleteButton}>
                <Feather name="trash-2" size={20} color="#A0AEC0" />
              </TouchableOpacity>
            </View>
          )}
          ListHeaderComponent={<Text style={styles.sectionTitle}>Jogadores ({players.length})</Text>}
          ListEmptyComponent={<Text style={styles.emptyText}>Nenhum jogador cadastrado.</Text>}
        />
      </View>

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Feather name="user-plus" size={24} color="white" />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Adicionar Jogador</Text>
            <TextInput
              placeholder="Nome do Jogador"
              style={styles.input}
              value={newPlayerName}
              onChangeText={setNewPlayerName}
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.createButton]} onPress={handleCreatePlayer}>
                <Text style={[styles.modalButtonText, { color: '#FFF' }]}>Adicionar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ESTILOS ATUALIZADOS
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F7FC' },
  container: { flex: 1, paddingHorizontal: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', color: '#1A2B48', marginBottom: 16, marginTop: 16 },
  card: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#1A2B48',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  cardText: { flex: 1, fontSize: 16, fontWeight: '500', color: '#1A2B48', marginLeft: 16 },
  deleteButton: { padding: 8 },
  emptyText: { textAlign: 'center', color: 'gray', padding: 16, fontSize: 14 },
  fab: { position: 'absolute', bottom: 30, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center', elevation: 8 },
  modalBackdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalView: { backgroundColor: 'white', borderRadius: 20, padding: 24, width: '90%', elevation: 10 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#1A2B48', marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: '#F4F7FC', height: 50, borderRadius: 10, paddingHorizontal: 15, fontSize: 16, marginBottom: 20, width: '100%' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  modalButton: { paddingVertical: 12, borderRadius: 10, flex: 0.48, alignItems: 'center' },
  cancelButton: { backgroundColor: '#E9EEF6' },
  createButton: { backgroundColor: '#007AFF' },
  modalButtonText: { fontWeight: 'bold', color: '#1A2B48', fontSize: 16 },
});