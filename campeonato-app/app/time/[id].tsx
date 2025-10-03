// app/time/[id].tsx
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Modal, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { Player, Team } from '../../constants/types';
import { getTeamById, getPlayersByTeamId, createPlayer } from '../../services/database';

export default function TeamDetailScreen() {
  const { id } = useLocalSearchParams();
  const teamId = Number(id);

  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');

  const fetchTeamDetails = async () => {
    if (!teamId) return;
    setLoading(true);
    // TODO: Substituir pelas funções reais do Dev 2
    const teamData = await getTeamById(teamId);
    const playersData = await getPlayersByTeamId(teamId);
    setTeam(teamData || null);
    setPlayers(playersData);
    setLoading(false);
  };

  useEffect(() => {
    fetchTeamDetails();
  }, [id]);

  const handleCreatePlayer = async () => {
    if (newPlayerName.trim().length === 0) return;
    // TODO: Substituir pela função real do Dev 2
    await createPlayer(teamId, newPlayerName);
    setModalVisible(false);
    setNewPlayerName('');
    fetchTeamDetails(); // Recarrega os dados para mostrar o novo jogador
  };

  if (loading) {
    return <ActivityIndicator size="large" style={styles.centered} />;
  }

  if (!team) {
    return <Text style={styles.centered}>Time não encontrado.</Text>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: team.name }} />
      <View style={styles.container}>
        <FlatList
          data={players}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Feather name="user" size={24} color="#4A5568" />
              <Text style={styles.cardText}>{item.name}</Text>
            </View>
          )}
          ListHeaderComponent={<Text style={styles.sectionTitle}>Jogadores</Text>}
          ListEmptyComponent={<Text style={styles.emptyText}>Nenhum jogador cadastrado.</Text>}
        />
      </View>

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Feather name="user-plus" size={24} color="white" />
      </TouchableOpacity>

      {/* Modal para adicionar jogador */}
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

// Reutilizando muitos estilos das outras telas
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
  cardText: { fontSize: 16, fontWeight: '500', color: '#1A2B48', marginLeft: 16 },
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