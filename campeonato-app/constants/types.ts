// constants/types.ts
export type Championship = {
  _id: string;
  name: string;
  players_per_team: number;
};

export type Team = {
  _id: string;
  championship_id: string;
  name: string;
};

export type Player = {
  _id: string;
  team_id: string;
  name: string;
};

export interface Fixture {
  _id: string;
  round: number;
  championship_id: string;
  championshipName?: string;
  home_team_id: any;
  away_team_id: any;
  home_team_name: string;
  away_team_name: string;
  home_team_score?: number;
  away_team_score?: number;
  status?: 'pending' | 'live' | 'finished';
}

export type GameEvent = {
  _id: string;
  match_id: string;
  minute: number;
  type: 'goal' | 'yellow_card' | 'red_card';
  player_id: string;
  player_name: string;
  assister_id?: string;
  assister_name?: string;
  team_id: string;
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
  teamName: string;
};

export type PlayerStat = {
  position: number;
  playerName: string;
  teamName: string;
  goals?: number;
  assists?: number;
};

export type RoundHighlights = {
  bolaCheia?: PlayerMatchStat;
  bolaMurcha?: PlayerMatchStat;
};
