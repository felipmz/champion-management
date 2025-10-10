// stores/championshipStore.ts
import { create } from 'zustand';
import api from '../services/api';
import { Championship, Team, Fixture, Player, GameEvent, TeamStanding, PlayerStat, PlayerMatchStat, RoundHighlights } from '../constants/types';

// Define a interface completa do nosso estado global
interface AppState {
  isLoading: boolean;
  championships: Championship[];
  selectedChampionship: Championship | null;
  teams: Team[];
  fixtures: Fixture[];
  standings: TeamStanding[];
  playerStats: PlayerStat[];
  assistStats: PlayerStat[];
  roundHighlights: RoundHighlights | null;
  selectedTeam: Team | null;
  players: Player[];
  selectedMatch: Fixture | null;
  matchEvents: GameEvent[];
  matchPlayers: Player[];
  matchStats: PlayerMatchStat[];

  fetchChampionships: () => Promise<void>;
  createChampionship: (name: string, playersPerTeam: number) => Promise<void>;
  deleteChampionship: (id: string) => Promise<void>;
  fetchChampionshipDetails: (id: string) => Promise<void>;
  generateFixtures: (championshipId: string) => Promise<void>;
  fetchTeamDetails: (id: string) => Promise<void>;
  createTeam: (championshipId: string, name: string) => Promise<void>;
  deleteTeam: (teamId: string, championshipId: string) => Promise<void>;
  createPlayer: (teamId: string, name: string) => Promise<void>;
  deletePlayer: (playerId: string, teamId: string) => Promise<void>;
  fetchMatchDetails: (id: string) => Promise<void>;
  fetchRoundHighlights: (championshipId: string, round: number) => Promise<void>; // <-- VÍRGULA FALTANDO AQUI
  addEvent: (matchId: string, eventData: any) => Promise<void>;
  finishMatch: (matchId: string, championshipId: string) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  // --- ESTADOS INICIAIS ---
  isLoading: false,
  championships: [],
  selectedChampionship: null,
  teams: [],
  fixtures: [],
  standings: [],
  playerStats: [],
  selectedTeam: null,
  players: [],
  assistStats: [],
  roundHighlights: null,
  selectedMatch: null,
  matchEvents: [],
  matchPlayers: [],
  matchStats: [],

  // --- AÇÕES ---
  fetchChampionships: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/championships');
      set({ championships: response.data, isLoading: false });
    } catch (error) {
      console.error("Store Error - fetchChampionships:", error);
      set({ isLoading: false });
    }
  },
  
  createChampionship: async (name, playersPerTeam) => {
    await api.post('/championships', { name, players_per_team: playersPerTeam });
    get().fetchChampionships();
  },

  deleteChampionship: async (id) => {
    await api.delete(`/championships/${id}`);
    get().fetchChampionships();
  },

  fetchChampionshipDetails: async (id) => {
    set({ isLoading: true });
    try {
      const [champ, teams, fixtures, standings, playerStats, assistStats] = await Promise.all([
        api.get(`/championships/${id}`),
        api.get(`/championships/${id}/teams`),
        api.get(`/championships/${id}/fixtures`),
        api.get(`/championships/${id}/standings`),
        api.get(`/championships/${id}/player-stats`),
        api.get(`/championships/${id}/assist-stats`),
      ]);
      set({
        selectedChampionship: champ.data,
        teams: teams.data,
        fixtures: fixtures.data,
        standings: standings.data,
        playerStats: playerStats.data,
        assistStats: assistStats.data,
        isLoading: false,
      });
    } catch (error) {
      console.error("Store Error - fetchChampionshipDetails:", error);
      set({ isLoading: false });
    }
  },
  
  createTeam: async (championshipId, name) => {
    await api.post(`/championships/${championshipId}/teams`, { name });
    get().fetchChampionshipDetails(championshipId);
  },

  deleteTeam: async (teamId, championshipId) => {
    await api.delete(`/teams/${teamId}`);
    get().fetchChampionshipDetails(championshipId);
  },

  generateFixtures: async (championshipId) => {
    const response = await api.post(`/championships/${championshipId}/generate-fixtures`);
    set({ fixtures: response.data });
  },

  fetchTeamDetails: async (id) => {
    set({ isLoading: true });
    try {
      const [team, players] = await Promise.all([
        api.get(`/teams/${id}`),
        api.get(`/teams/${id}/players`),
      ]);
      set({ selectedTeam: team.data, players: players.data, isLoading: false });
    } catch (error) {
      console.error("Store Error - fetchTeamDetails:", error);
      set({ isLoading: false });
    }
  },

  createPlayer: async (teamId, name) => {
    await api.post(`/teams/${teamId}/players`, { name });
    get().fetchTeamDetails(teamId);
  },

  deletePlayer: async (playerId, teamId) => {
    await api.delete(`/players/${playerId}`);
    get().fetchTeamDetails(teamId);
  },
  
  fetchMatchDetails: async (matchId) => {
    set({ isLoading: true });
    try {
      const [match, events, players, stats] = await Promise.all([
        api.get(`/matches/${matchId}`),
        api.get(`/matches/${matchId}/events`),
        api.get(`/matches/${matchId}/players`),
        api.get(`/matches/${matchId}/stats`),
      ]);
      set({
        selectedMatch: match.data,
        matchEvents: events.data,
        matchPlayers: players.data,
        matchStats: stats.data,
        isLoading: false,
      });
    } catch (error) {
      console.error("Store Error - fetchMatchDetails:", error);
      set({ isLoading: false });
    }
  },

  addEvent: async (matchId, eventData) => {
    await api.post(`/matches/${matchId}/events`, eventData);
    get().fetchMatchDetails(matchId);
  },

  finishMatch: async (matchId, championshipId) => {
    await api.patch(`/matches/${matchId}/status`, { status: 'finished' });
    // Após finalizar, busca os dados do CAMPEONATO PAI para atualizar a classificação
    get().fetchChampionshipDetails(championshipId);
  },

  fetchRoundHighlights: async (championshipId, round) => {
    // Limpa os destaques antigos antes de buscar novos
    set({ roundHighlights: null });
    try {
      const response = await api.get(`/championships/${championshipId}/highlights/${round}`);
      set({ roundHighlights: response.data });
    } catch (error) {
      console.error(`Store Error - fetchRoundHighlights (round ${round}):`, error);
      // Não define como erro, apenas deixa nulo para a UI mostrar "sem dados"
    }
  },
}));