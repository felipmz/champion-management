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

export interface Fixture {
  id: number;
  round: number;
  home_team_name: string;
  away_team_name: string;
  home_team_score?: number; // Placar é opcional no início
  away_team_score?: number;
  status?: 'pending' | 'live' | 'finished';
}

export type Player = {
  id: number;
  team_id: number;
  name: string;
};

export type GameEvent = {
  id: number;
  match_id: number;
  minute: number;
  type: 'goal' | 'yellow_card' | 'red_card';
  player_name: string;
  assister_name?: string; // Assistência é opcional
};
