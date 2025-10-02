// constants/types.ts

export type Championship = {
  id: number;
  name: string;
  players_per_team: number;
};

export type Team = {
  id: number;
  championship_id: number;
  name: string;
};

export type Player = {
  id: number;
  team_id: number;
  name: string;
};

export type PlayerStat = {
  position: number;
  playerName: string;
  teamName: string;
  goals: number;
};

// 👇 CORREÇÃO AQUI: Adicionamos as propriedades que estavam faltando
export interface Fixture {
  id: number;
  round: number;
  championship_id: number;    // Adicionado
  home_team_id: number;       // Adicionado
  away_team_id: number;       // Adicionado
  championshipName?: string;
  home_team_name: string;
  away_team_name: string;
  home_team_score?: number;
  away_team_score?: number;
  status?: 'pending' | 'live' | 'finished';
}

export type GameEvent = {
  id: number;
  match_id: number;
  minute: number;
  type: 'goal' | 'yellow_card' | 'red_card';
  player_id: number;
  player_name: string;
  assister_id?: number;
  assister_name?: string;
  team_id: number;
};

export type TeamStanding = {
  position: number;
  teamName: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

export type PlayerMatchStat = {
  playerId: number;
  playerName: string;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  points: number;
};
