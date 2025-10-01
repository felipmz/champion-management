// app/(tabs)/index.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

// 1. IMPORTANDO NOSSOS TIPOS (como antes)
import { Championship } from '../../constants/types';

// 2. IMPORTANDO AS FUNÇÕES DO NOSSO BANCO DE DADOS FALSO CENTRALIZADO
import { getChampionships_MOCK, createChampionship_MOCK } from '../../services/mockDatabase';

export default function HomeScreen() {
  const router = useRouter();

  const [championships, setChampionships] = useState<Championship[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  
  const [newChampionshipName, setNewChampionshipName] = useState('');
  const [playersPerTeam, setPlayersPerTeam] = useState(7);

  const fetchChampionships = async () => {
    setLoading(true);
    // Usando a função importada
    // TODO: Quando o Dev 2 terminar, trocar por: import { getChampionships } from '../../services/database';
    const data = await getChampionships_MOCK();
    setChampionships(data);
    setLoading(false);
  };

  useFocusEffect(React.useCallback(() => { fetchChampionships(); }, []));

  const handleOpenModal = () => {
    setNewChampionshipName('');
    setPlayersPerTeam(7);
    setModalVisible(true);
  }

  const handleCreateChampionship = async () => {
    if (newChampionshipName.trim().length === 0) {
      alert('Por favor, insira um nome para o campeonato.');
      return;
    }
    // Usando a função importada
    // TODO: Quando o Dev 2 terminar, trocar por: import { createChampionship } from '../../services/database';
    await createChampionship_MOCK(newChampionshipName, playersPerTeam);
    setModalVisible(false);
    fetchChampionships();
  };

  const handleNavigateToChampionship = (id: number) => {
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
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => handleNavigateToChampionship(item.id)}>
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
            </View>

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

// OS ESTILOS PERMANECEM EXATAMENTE OS MESMOS
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F7FC' },
  container: { flex: 1, paddingHorizontal: 16, },
  header: { paddingTop: 20, paddingBottom: 10 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#1A2B48' },
  card: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#1A2B48',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  cardText: { fontSize: 18, fontWeight: '600', color: '#1A2B48' },
  cardSubText: { fontSize: 14, color: '#A0AEC0', marginTop: 4 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F4F7FC' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyTitle: { fontSize: 22, fontWeight: 'bold', color: '#4A5568', marginTop: 16 },
  emptySubtitle: { fontSize: 16, color: '#A0AEC0', marginTop: 8, textAlign: 'center' },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#007AFF',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  modalBackdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalView: { backgroundColor: 'white', borderRadius: 20, padding: 24, width: '90%', elevation: 10 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#1A2B48', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 16, color: '#4A5568', marginBottom: 8, fontWeight: '500' },
  input: { backgroundColor: '#F4F7FC', height: 50, borderRadius: 10, paddingHorizontal: 15, fontSize: 16, marginBottom: 20 },
  playersSelector: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 30 },
  playerOption: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, backgroundColor: '#E9EEF6' },
  playerOptionSelected: { backgroundColor: '#007AFF' },
  playerOptionText: { color: '#1A2B48', fontWeight: '600' },
  playerOptionTextSelected: { color: '#FFF' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between' },
  modalButton: { paddingVertical: 12, borderRadius: 10, flex: 0.48, alignItems: 'center' },
  cancelButton: { backgroundColor: '#E9EEF6' },
  createButton: { backgroundColor: '#007AFF' },
  modalButtonText: { fontWeight: 'bold', color: '#1A2B48', fontSize: 16 },
});