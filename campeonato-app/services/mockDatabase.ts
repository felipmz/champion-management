// services/mockDatabase.ts
import { Championship, Team, Fixture, GameEvent, Player, TeamStanding, PlayerStat, PlayerMatchStat } from '../constants/types';

// =================================================================================
// NOSSO "BANCO DE DADOS" CENTRALIZADO EM MEMÓRIA
// =================================================================================
let MOCK_CHAMPIONSHIPS: Championship[] = [
    { id: 1, name: 'Copa da Amizade 2025', players_per_team: 11 },
    { id: 2, name: 'Torneio de Verão', players_per_team: 7 },
];

let MOCK_STANDINGS: TeamStanding[] = [
  { position: 1, teamName: 'Guerreiros FC', played: 1, wins: 1, draws: 0, losses: 0, goalsFor: 3, goalsAgainst: 1, goalDifference: 2, points: 3 },
  { position: 2, teamName: 'Dragões da Colina', played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 },
  { position: 3, teamName: 'Tubarões da Costa', played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 },
  { position: 4, teamName: 'Unidos da Vila', played: 1, wins: 0, draws: 0, losses: 1, goalsFor: 1, goalsAgainst: 3, goalDifference: -2, points: 0 },
];

let MOCK_PLAYER_STATS: PlayerStat[] = [
  { position: 1, playerName: 'João Silva (GOL)', teamName: 'Guerreiros FC', goals: 2 },
  { position: 2, playerName: 'Marcos Andrade (ATA)', teamName: 'Unidos da Vila', goals: 1 },
  { position: 3, playerName: 'Carlos Pereira (ZAG)', teamName: 'Guerreiros FC', goals: 1 },
];


let MOCK_TEAMS: Team[] = [
    { id: 101, championship_id: 1, name: 'Guerreiros FC' },
    { id: 102, championship_id: 1, name: 'Unidos da Vila' },
    { id: 103, championship_id: 1, name: 'Dragões da Colina' },
    { id: 104, championship_id: 1, name: 'Tubarões da Costa' },
];

let MOCK_PLAYERS: Player[] = [
    { id: 1, team_id: 101, name: 'João Silva (GOL)' },
    { id: 2, team_id: 101, name: 'Carlos Pereira (ZAG)' },
    { id: 3, team_id: 102, name: 'Marcos Andrade (ATA)' },
    { id: 4, team_id: 102, name: 'Pedro Souza (MEI)' },
];

let MOCK_FIXTURES: Fixture[] = [];

let MOCK_EVENTS: GameEvent[] = [];

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
export const getTeamById_MOCK = (id: number): Promise<Team | undefined> => new Promise(resolve => resolve(MOCK_TEAMS.find(t => t.id === id)));
export const getTeamsByChampionshipId_MOCK = (id: number): Promise<Team[]> => new Promise(resolve => resolve(MOCK_TEAMS.filter(t => t.championship_id === id)));
export const createTeam_MOCK = (championshipId: number, name: string): Promise<void> => new Promise(resolve => {
  const newTeam: Team = { id: Math.random(), championship_id: championshipId, name };
  MOCK_TEAMS.push(newTeam);
  resolve();
});

// Funções de Jogadores
export const getPlayersByTeamId_MOCK = (teamId: number): Promise<Player[]> => new Promise(resolve => resolve(MOCK_PLAYERS.filter(p => p.team_id === teamId)));
export const createPlayer_MOCK = (teamId: number, name: string): Promise<void> => new Promise(resolve => {
  const newPlayer: Player = { id: Math.random(), team_id: teamId, name };
  MOCK_PLAYERS.push(newPlayer);
  resolve();
});
export const getPlayersForMatch_MOCK = (matchId: number): Promise<Player[]> => new Promise(resolve => {
    const match = MOCK_FIXTURES.find(f => f.id === matchId);
    if (!match) return resolve([]);
    const players = MOCK_PLAYERS.filter(p => p.team_id === match.home_team_id || p.team_id === match.away_team_id);
    resolve(players);
});


// Funções de Partidas (Fixtures) e Eventos
export const generateFixtures_MOCK = (championshipId: number): Promise<Fixture[]> => new Promise(resolve => {
    MOCK_FIXTURES = MOCK_FIXTURES.filter(f => f.championship_id !== championshipId); // Limpa fixtures antigos do campeonato
    
    const teamsInChamp = MOCK_TEAMS.filter(t => t.championship_id === championshipId);
    const championship = MOCK_CHAMPIONSHIPS.find(c => c.id === championshipId) || { id: championshipId, name: 'Campeonato Desconhecido', players_per_team: 11 };
    if (teamsInChamp.length < 2) return resolve([]);

    // Lógica de sorteio simples para o mock
    const newFixture: Fixture = {
        id: Math.random(),
        championship_id: championshipId,
        championshipName: championship.name,
        round: 1,
        home_team_id: teamsInChamp[0].id,
        home_team_name: teamsInChamp[0].name,
        away_team_id: teamsInChamp[1].id,
        away_team_name: teamsInChamp[1].name,
        home_team_score: 0,
        away_team_score: 0,
        status: 'pending'
    };
    MOCK_FIXTURES.push(newFixture);
    resolve(MOCK_FIXTURES.filter(f => f.championship_id === championshipId));
});

export const getMatchDetails_MOCK = (matchId: number): Promise<Fixture | undefined> => new Promise(resolve => resolve(MOCK_FIXTURES.find(f => f.id === matchId)));
export const getEventsForMatch_MOCK = (matchId: number): Promise<GameEvent[]> => new Promise(resolve => resolve(MOCK_EVENTS.filter(e => e.match_id === matchId)));
export const getAllFixtures_MOCK = (): Promise<Fixture[]> => {
    // Simplesmente retorna todas as partidas que temos na memória
    return new Promise(resolve => resolve(MOCK_FIXTURES));
};

// CORREÇÃO: Lógica de adicionar evento foi completamente refeita para ser mais robusta.
export const addEvent_MOCK = (eventData: Omit<GameEvent, 'id' | 'player_name' | 'assister_name'>): Promise<GameEvent> => {
  return new Promise((resolve, reject) => {
    const player = MOCK_PLAYERS.find(p => p.id === eventData.player_id);
    const assister = MOCK_PLAYERS.find(p => p.id === eventData.assister_id);
    
    // 1. Encontra a partida correta no array de fixtures
    const match = MOCK_FIXTURES.find(f => f.id === eventData.match_id);

    if (!player || !match) {
      return reject(new Error("Jogador ou Partida não encontrados!"));
    }

    const newEvent: GameEvent = {
      ...eventData,
      id: Math.random(),
      player_name: player.name,
      assister_name: assister?.name,
    };
    MOCK_EVENTS.push(newEvent);

    // 2. Atualiza o placar da partida correta
    if (eventData.type === 'goal') {
      if (player.team_id === match.home_team_id) {
        match.home_team_score = (match.home_team_score || 0) + 1;
      } else if (player.team_id === match.away_team_id) {
        match.away_team_score = (match.away_team_score || 0) + 1;
      }
    }
    resolve(newEvent);
  });
};

export const getStandings_MOCK = (championshipId: number): Promise<TeamStanding[]> => {
  // Em um app real, isso seria calculado. No mock, apenas retornamos os dados.
  return new Promise(resolve => resolve(MOCK_STANDINGS));
};

export const getPlayerStats_MOCK = (championshipId: number): Promise<PlayerStat[]> => {
  return new Promise(resolve => resolve(MOCK_PLAYER_STATS));
};

export const calculateMatchStats_MOCK = (matchId: number): Promise<PlayerMatchStat[]> => {
  return new Promise(resolve => {
    const eventsInMatch = MOCK_EVENTS.filter(e => e.match_id === matchId);
    const playersInMatch = MOCK_PLAYERS.filter(p => MOCK_TEAMS.some(t => t.id === p.team_id && MOCK_FIXTURES.some(f => f.id === matchId && (f.home_team_id === t.id || f.away_team_id === t.id))));

    const stats: PlayerMatchStat[] = playersInMatch.map(player => {
      const goals = eventsInMatch.filter(e => e.player_id === player.id && e.type === 'goal').length;
      const assists = eventsInMatch.filter(e => e.assister_id === player.id).length;
      const yellowCards = eventsInMatch.filter(e => e.player_id === player.id && e.type === 'yellow_card').length;
      const redCards = eventsInMatch.filter(e => e.player_id === player.id && e.type === 'red_card').length;

      // Usando as regras de pontuação da especificação
      const points = (goals * 6) + (assists * 3) + (yellowCards * -1) + (redCards * -3);

      return { playerId: player.id, playerName: player.name, goals, assists, yellowCards, redCards, points };
    });

    // Ordena por pontos para definir o melhor do jogo
    resolve(stats.sort((a, b) => b.points - a.points));
  });
};
