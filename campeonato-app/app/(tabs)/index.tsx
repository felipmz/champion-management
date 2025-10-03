// app/(tabs)/index.tsx
import React, { useState } from 'react';
import {
  View, Text, FlatList, SafeAreaView, StyleSheet, Pressable,
  Modal, TextInput, ActivityIndicator, TouchableOpacity
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Championship } from '../../constants/types';
import api from '../../services/api';

export default function HomeScreen() {
  const router = useRouter();
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  
  // --- MUDANÇA 1: ATUALIZAÇÃO DOS ESTADOS ---
  const [newChampionshipName, setNewChampionshipName] = useState('');
  // 'playersPerTeam' agora pode ser um número ou a string 'custom'
  const [playersPerTeam, setPlayersPerTeam] = useState<number | 'custom'>(7);
  // Novo estado para o valor do input customizado
  const [customPlayers, setCustomPlayers] = useState('');

  const fetchChampionships = async () => {
    setLoading(true);
    const response = await api.get('/championships');
    setChampionships(response.data);
    setLoading(false);
  };

  useFocusEffect(React.useCallback(() => { fetchChampionships(); }, []));

  const handleOpenModal = () => {
    setNewChampionshipName('');
    setPlayersPerTeam(7); // Reseta para o padrão
    setCustomPlayers(''); // Limpa o campo customizado
    setModalVisible(true);
  }

  // --- MUDANÇA 3: ATUALIZAÇÃO DA LÓGICA DE SALVAR ---
  const handleCreateChampionship = async () => {
    if (newChampionshipName.trim().length === 0) {
      alert('Por favor, insira um nome para o campeonato.');
      return;
    }

    let finalPlayersPerTeam: number;

    if (playersPerTeam === 'custom') {
      finalPlayersPerTeam = parseInt(customPlayers, 10);
      if (isNaN(finalPlayersPerTeam) || finalPlayersPerTeam <= 0) {
        alert('Por favor, insira um número válido de jogadores.');
        return;
      }
    } else {
      finalPlayersPerTeam = playersPerTeam;
    }

    // TODO: Substituir pela função real do Dev 2
     try {
        // MUDANÇA 3
        await api.post('/championships', { 
            name: newChampionshipName, 
            players_per_team: finalPlayersPerTeam 
        });
        setModalVisible(false);
        fetchChampionships(); // Recarrega a lista
    } catch (error) {
        console.error("Erro ao criar campeonato:", error);
        alert('Não foi possível criar o campeonato.');
    }
  };

  const handleNavigateToChampionship = (id: string) => {
    router.push(`/campeonato/${id}`);
  };

  const EmptyListComponent = () => (
    <View style={styles.emptyContainer}>
      <Feather name="award" size={60} color="#CBD5E0" />
      <Text style={styles.emptyTitle}>Nenhum Campeonato</Text>
      <Text style={styles.emptySubtitle}>Clique no botão '+' para criar seu primeiro campeonato.</Text>
    </View>
  );

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#007AFF" /></View>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
            <Text style={styles.title}>Meus Campeonatos</Text>
        </View>

        <FlatList
          data={championships}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => handleNavigateToChampionship(item._id)}>
              <View>
                <Text style={styles.cardText}>{item.name}</Text>
                <Text style={styles.cardSubText}>{item.players_per_team} jogadores por time</Text>
              </View>
              <Feather name="chevron-right" size={24} color="#CBD5E0" />
            </Pressable>
          )}
          ListEmptyComponent={EmptyListComponent}
          contentContainerStyle={{ flexGrow: 1 }}
        />
      </View>

      <TouchableOpacity style={styles.fab} onPress={handleOpenModal}>
        <Feather name="plus" size={28} color="white" />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent={true} animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Criar Novo Campeonato</Text>
            
            <Text style={styles.label}>Nome do Campeonato</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Copa de Verão 2025"
              value={newChampionshipName}
              onChangeText={setNewChampionshipName}
            />

            {/* --- MUDANÇA 2: ATUALIZAÇÃO DO JSX DO SELETOR --- */}
            <Text style={styles.label}>Jogadores por Time</Text>
            <View style={styles.playersSelector}>
              {[5, 7, 11].map(num => (
                <TouchableOpacity 
                  key={num} 
                  style={[styles.playerOption, playersPerTeam === num && styles.playerOptionSelected]}
                  onPress={() => setPlayersPerTeam(num)}
                >
                  <Text style={[styles.playerOptionText, playersPerTeam === num && styles.playerOptionTextSelected]}>{num}</Text>
                </TouchableOpacity>
              ))}
              {/* Novo botão "Outro" */}
              <TouchableOpacity 
                style={[styles.playerOption, playersPerTeam === 'custom' && styles.playerOptionSelected]}
                onPress={() => setPlayersPerTeam('custom')}
              >
                <Text style={[styles.playerOptionText, playersPerTeam === 'custom' && styles.playerOptionTextSelected]}>Outro</Text>
              </TouchableOpacity>
            </View>

            {/* Campo de texto que aparece condicionalmente */}
            {playersPerTeam === 'custom' && (
              <TextInput
                style={styles.input}
                placeholder="Digite a quantidade"
                keyboardType="number-pad"
                value={customPlayers}
                onChangeText={setCustomPlayers}
              />
            )}

            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.createButton]} onPress={handleCreateChampionship}>
                 <Text style={[styles.modalButtonText, {color: '#FFF'}]}>Criar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ... (os estilos permanecem os mesmos, com uma pequena adição)
  safeArea: { flex: 1, backgroundColor: '#F4F7FC' },
  container: { flex: 1, paddingHorizontal: 16, },
  header: { paddingTop: 20, paddingBottom: 10 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#1A2B48' },
  card: { backgroundColor: 'white', padding: 20, borderRadius: 12, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2, shadowColor: '#1A2B48', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }},
  cardText: { fontSize: 18, fontWeight: '600', color: '#1A2B48' },
  cardSubText: { fontSize: 14, color: '#A0AEC0', marginTop: 4 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F4F7FC' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyTitle: { fontSize: 22, fontWeight: 'bold', color: '#4A5568', marginTop: 16 },
  emptySubtitle: { fontSize: 16, color: '#A0AEC0', marginTop: 8, textAlign: 'center' },
  fab: { position: 'absolute', bottom: 30, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#007AFF', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }},
  modalBackdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalView: { backgroundColor: 'white', borderRadius: 20, padding: 24, width: '90%', elevation: 10 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#1A2B48', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 16, color: '#4A5568', marginBottom: 8, fontWeight: '500' },
  input: { backgroundColor: '#F4F7FC', height: 50, borderRadius: 10, paddingHorizontal: 15, fontSize: 16, marginBottom: 20 },
  playersSelector: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }, // Margin bottom ajustada
  playerOption: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 20, backgroundColor: '#E9EEF6' }, // Padding ajustado
  playerOptionSelected: { backgroundColor: '#007AFF' },
  playerOptionText: { color: '#1A2B48', fontWeight: '600' },
  playerOptionTextSelected: { color: '#FFF' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between' },
  modalButton: { paddingVertical: 12, borderRadius: 10, flex: 0.48, alignItems: 'center' },
  cancelButton: { backgroundColor: '#E9EEF6' },
  createButton: { backgroundColor: '#007AFF' },
  modalButtonText: { fontWeight: 'bold', color: '#1A2B48', fontSize: 16 },
});


