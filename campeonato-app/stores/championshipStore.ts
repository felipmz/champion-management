// stores/championshipStore.ts
import { create } from 'zustand';
import api from '../services/api';
import { Championship, Team, Fixture, TeamStanding, PlayerStat } from '../constants/types';

interface ChampionshipState {
  championships: Championship[];
  selectedChampionship: Championship | null;
  teams: Team[];
  fixtures: Fixture[];
  standings: TeamStanding[]; // <-- ADICIONADO
  playerStats: PlayerStat[]; // <-- ADICIONADO
  isLoading: boolean;
  fetchChampionships: () => Promise<void>;
  fetchChampionshipDetails: (id: string) => Promise<void>;
  createTeam: (championshipId: string, name: string) => Promise<void>;
  generateFixtures: (championshipId: string) => Promise<void>;
}

export const useChampionshipStore = create<ChampionshipState>((set, get) => ({
  championships: [],
  selectedChampionship: null,
  teams: [],
  fixtures: [],
  standings: [],      // <-- ADICIONADO
  playerStats: [],    // <-- ADICIONADO
  isLoading: false,

  fetchChampionships: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/championships');
      set({ championships: response.data, isLoading: false });
    } catch (error) {
      console.error("Erro na store ao buscar campeonatos:", error);
      set({ isLoading: false });
    }
  },

  // ATUALIZAÇÃO PRINCIPAL AQUI
  fetchChampionshipDetails: async (id: string) => {
    set({ isLoading: true });
    try {
      // Busca todos os dados em paralelo, incluindo os novos
      const [
        champResponse, 
        teamsResponse, 
        fixturesResponse, 
        standingsResponse, 
        playerStatsResponse
      ] = await Promise.all([
        api.get(`/championships/${id}`),
        api.get(`/championships/${id}/teams`),
        api.get(`/championships/${id}/fixtures`),
        api.get(`/championships/${id}/standings`),
        api.get(`/championships/${id}/player-stats`),
      ]);
      set({
        selectedChampionship: champResponse.data,
        teams: teamsResponse.data,
        fixtures: fixturesResponse.data,
        standings: standingsResponse.data,     // <-- ADICIONADO
        playerStats: playerStatsResponse.data, // <-- ADICIONADO
        isLoading: false,
      });
    } catch (error) {
      console.error("Erro na store ao buscar detalhes:", error);
      set({ isLoading: false });
    }
  },
  
  createTeam: async (championshipId: string, name: string) => {
    await api.post(`/championships/${championshipId}/teams`, { name });
    get().fetchChampionshipDetails(championshipId);
  },

  generateFixtures: async (championshipId: string) => {
    const response = await api.post(`/championships/${championshipId}/generate-fixtures`);
    set({ fixtures: response.data });
  },
}));