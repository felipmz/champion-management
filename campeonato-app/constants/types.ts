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
// constants/types.ts

// ... outros tipos aqui ...

export interface Fixture {
  id: number;
  championship_id: number;
  round: number;
  home_team_id: number;
  away_team_id: number;
  home_team_score: number | null;
  away_team_score: number | null;
  status: 'pending' | 'live' | 'finished';
  // Campos que vêm do JOIN (são opcionais pois nem sempre buscamos)
  home_team_name?: string;
  away_team_name?: string;
}

export interface GameEvent {
  id: number;
  match_id: number;
  minute: number;
  type: 'goal' | 'yellow_card' | 'red_card';
  player_id: number;
  assister_id: number | null;
  team_id: number;
  player_name?: string;
  assister_name?: string;
}
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
