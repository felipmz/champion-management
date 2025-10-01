// services/mockDatabase.ts
import { Championship, Team, Fixture, GameEvent, Player } from '../constants/types';

// =================================================================================
// NOSSO "BANCO DE DADOS" CENTRALIZADO EM MEMÓRIA
// =================================================================================
let MOCK_CHAMPIONSHIPS: Championship[] = [
    { id: 1, name: 'Copa da Amizade 2025', players_per_team: 11 },
    { id: 2, name: 'Torneio de Verão', players_per_team: 7 },
];
let MOCK_TEAMS: Team[] = [
    { id: 101, championship_id: 1, name: 'Guerreiros FC' },
    { id: 102, championship_id: 1, name: 'Unidos da Vila' },
];
let MOCK_FIXTURES: Fixture[] = [];
// ... adicione MOCK_PLAYERS, MOCK_EVENTS, etc. aqui quando precisar deles.

// =================================================================================
// FUNÇÕES QUE OPERAM NO BANCO DE DADOS FALSO
// =================================================================================

// Funções de Campeonato
export const getChampionships_MOCK = (): Promise<Championship[]> => new Promise(resolve => resolve(MOCK_CHAMPIONSHIPS));
export const createChampionship_MOCK = (name: string, players_per_team: number): Promise<void> => new Promise(resolve => {
  const newChampionship: Championship = { id: Math.random(), name, players_per_team };
  MOCK_CHAMPIONSHIPS.push(newChampionship);
  resolve();
});
export const getChampionshipById_MOCK = (id: number): Promise<Championship | undefined> => new Promise(resolve => resolve(MOCK_CHAMPIONSHIPS.find(c => c.id === id)));

// Funções de Time
export const getTeamsByChampionshipId_MOCK = (id: number): Promise<Team[]> => new Promise(resolve => resolve(MOCK_TEAMS.filter(t => t.championship_id === id)));
export const createTeam_MOCK = (championshipId: number, name: string): Promise<void> => new Promise(resolve => {
  const newTeam: Team = { id: Math.random(), championship_id: championshipId, name };
  MOCK_TEAMS.push(newTeam);
  resolve();
});

// Funções de Partidas (Fixtures)
export const generateFixtures_MOCK = (championshipId: number): Promise<Fixture[]> => new Promise(resolve => {
    MOCK_FIXTURES.length = 0; // Limpa a tabela antiga
    // ... sua lógica de geração aqui ...
    MOCK_FIXTURES.push({id: 1, round: 1, home_team_name: MOCK_TEAMS[0].name, away_team_name: MOCK_TEAMS[1].name});
    resolve(MOCK_FIXTURES);
});