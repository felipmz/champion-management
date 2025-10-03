import * as SQLite from 'expo-sqlite';
import { Championship, Team, Fixture, Player, GameEvent, TeamStanding, PlayerStat, PlayerMatchStat } from '../constants/types';

const db = SQLite.openDatabaseSync('championship.db');

export const initDatabase = async (): Promise<void> => {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS championships (
      id INTEGER PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      players_per_team INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY NOT NULL,
      championship_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      FOREIGN KEY (championship_id) REFERENCES championships (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY NOT NULL,
      team_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS fixtures (
      id INTEGER PRIMARY KEY NOT NULL,
      championship_id INTEGER NOT NULL,
      round INTEGER NOT NULL,
      home_team_id INTEGER NOT NULL,
      away_team_id INTEGER NOT NULL,
      home_team_score INTEGER DEFAULT 0,
      away_team_score INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending', -- 'pending', 'live', 'finished'
      FOREIGN KEY (championship_id) REFERENCES championships (id) ON DELETE CASCADE,
      FOREIGN KEY (home_team_id) REFERENCES teams (id) ON DELETE CASCADE,
      FOREIGN KEY (away_team_id) REFERENCES teams (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY NOT NULL,
      match_id INTEGER NOT NULL,
      minute INTEGER NOT NULL,
      type TEXT NOT NULL, -- 'goal', 'yellow_card', 'red_card'
      player_id INTEGER NOT NULL,
      assister_id INTEGER,
      team_id INTEGER NOT NULL,
      FOREIGN KEY (match_id) REFERENCES fixtures (id) ON DELETE CASCADE,
      FOREIGN KEY (player_id) REFERENCES players (id) ON DELETE CASCADE,
      FOREIGN KEY (assister_id) REFERENCES players (id) ON DELETE CASCADE
    );
  `);
  console.log("Banco de dados SQLite inicializado.");
};

// --- Funções de Campeonato ---
export const getChampionships = async (): Promise<Championship[]> => {
  return await db.getAllAsync<Championship>('SELECT * FROM championships ORDER BY id DESC;');
};
export const getChampionshipById = async (id: number): Promise<Championship | null> => {
  return await db.getFirstAsync<Championship>('SELECT * FROM championships WHERE id = ?;', [id]);
};
export const createChampionship = async (name: string, playersPerTeam: number): Promise<void> => {
  await db.runAsync('INSERT INTO championships (name, players_per_team) VALUES (?, ?);', [name, playersPerTeam]);
};

// --- Funções de Time ---
export const getTeamById = async (id: number): Promise<Team | null> => {
  return await db.getFirstAsync<Team>('SELECT * FROM teams WHERE id = ?;', [id]);
};
export const getTeamsByChampionshipId = async (id: number): Promise<Team[]> => {
  return await db.getAllAsync<Team>('SELECT * FROM teams WHERE championship_id = ?;', [id]);
};
export const createTeam = async (championshipId: number, name: string): Promise<void> => {
  await db.runAsync('INSERT INTO teams (championship_id, name) VALUES (?, ?);', [championshipId, name]);
};

// --- Funções de Jogador ---
export const getPlayersByTeamId = async (teamId: number): Promise<Player[]> => {
  return await db.getAllAsync<Player>('SELECT * FROM players WHERE team_id = ?;', [teamId]);
};
export const createPlayer = async (teamId: number, name: string): Promise<void> => {
  await db.runAsync('INSERT INTO players (team_id, name) VALUES (?, ?);', [teamId, name]);
};

export const getPlayersForMatch = async (matchId: number): Promise<Player[]> => {
  const match = await db.getFirstAsync<Fixture>('SELECT * FROM fixtures WHERE id = ?;', [matchId]);
  if (!match) return [];
  return await db.getAllAsync<Player>('SELECT * FROM players WHERE team_id = ? OR team_id = ?;', [match.home_team_id, match.away_team_id]);
};

export const getMatchDetails = async (matchId: number): Promise<Fixture | null> => {
  const query = `
    SELECT 
      f.*, 
      ht.name as home_team_name, 
      at.name as away_team_name 
    FROM fixtures f 
    JOIN teams ht ON f.home_team_id = ht.id 
    JOIN teams at ON f.away_team_id = at.id 
    WHERE f.id = ?;
  `;
  return await db.getFirstAsync<Fixture>(query, [matchId]);
};

export const getEventsForMatch = async (matchId: number): Promise<GameEvent[]> => {
  const query = `
    SELECT 
      e.*, 
      p.name as player_name, 
      a.name as assister_name 
    FROM events e 
    JOIN players p ON e.player_id = p.id 
    LEFT JOIN players a ON e.assister_id = a.id 
    WHERE e.match_id = ? 
    ORDER BY e.minute ASC;
  `;
  return await db.getAllAsync<GameEvent>(query, [matchId]);
};

export const addEvent = async (eventData: Omit<GameEvent, 'id' | 'player_name' | 'assister_name'>): Promise<void> => {
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'INSERT INTO events (match_id, minute, type, player_id, assister_id, team_id) VALUES (?, ?, ?, ?, ?, ?);',
      [eventData.match_id, eventData.minute, eventData.type, eventData.player_id, eventData.assister_id, eventData.team_id]
    );

    if (eventData.type === 'goal') {
      const match = await getMatchDetails(eventData.match_id);
      if (match) {
        if (eventData.team_id === match.home_team_id) {
          await db.runAsync('UPDATE fixtures SET home_team_score = home_team_score + 1 WHERE id = ?;', [eventData.match_id]);
        } else {
          await db.runAsync('UPDATE fixtures SET away_team_score = away_team_score + 1 WHERE id = ?;', [eventData.match_id]);
        }
      }
    }
  });
};

// --- Geração da Tabela de Jogos ---
export const generateFixtures = async (championshipId: number): Promise<Fixture[]> => {
  await db.runAsync('DELETE FROM fixtures WHERE championship_id = ?;', [championshipId]);
  
  const teams = await getTeamsByChampionshipId(championshipId);
  if (teams.length < 2) return [];

  const teamList = [...teams];
  if (teamList.length % 2 !== 0) {
    teamList.push({ id: -1, name: 'BYE', championship_id: championshipId }); // Time "Folga"
  }
  
  const numRounds = teamList.length - 1;
  const halfSize = teamList.length / 2;
  
  for (let round = 0; round < numRounds; round++) {
    for (let i = 0; i < halfSize; i++) {
      const home = teamList[i];
      const away = teamList[teamList.length - 1 - i];

      if (home.id !== -1 && away.id !== -1) {
        await db.runAsync(
          'INSERT INTO fixtures (championship_id, round, home_team_id, away_team_id, status) VALUES (?, ?, ?, ?, ?);',
          [championshipId, round + 1, home.id, away.id, 'pending']
        );
      }
    }
    const lastTeam = teamList.pop();
    if (lastTeam) teamList.splice(1, 0, lastTeam);
  }
  
  const query = `
    SELECT f.*, ht.name as home_team_name, at.name as away_team_name 
    FROM fixtures f 
    JOIN teams ht ON f.home_team_id = ht.id 
    JOIN teams at ON f.away_team_id = at.id 
    WHERE f.championship_id = ?;
  `;
  return await db.getAllAsync<Fixture>(query, [championshipId]);
};

// --- Cálculos de Estatísticas ---
export const calculateMatchStats = async (matchId: number): Promise<PlayerMatchStat[]> => {
  const players = await getPlayersForMatch(matchId);
  const events = await getEventsForMatch(matchId);

  const stats: PlayerMatchStat[] = players.map(player => {
    const goals = events.filter(e => e.player_id === player.id && e.type === 'goal').length;
    const assists = events.filter(e => e.assister_id === player.id).length;
    const yellowCards = events.filter(e => e.player_id === player.id && e.type === 'yellow_card').length;
    const redCards = events.filter(e => e.player_id === player.id && e.type === 'red_card').length;
    const points = (goals * 6) + (assists * 3) - yellowCards - (redCards * 3);
    
    return { playerId: player.id, playerName: player.name, goals, assists, yellowCards, redCards, points };
  });

  return stats.sort((a, b) => b.points - a.points);
};

export const getPlayerStats = async (championshipId: number): Promise<PlayerStat[]> => {
  const query = `
    SELECT 
      p.id as playerId, 
      p.name as playerName, 
      t.name as teamName, 
      COUNT(CASE WHEN e.type = 'goal' THEN 1 END) as goals,
      COUNT(CASE WHEN e.type = 'yellow_card' THEN 1 END) as yellowCards,
      COUNT(CASE WHEN e.type = 'red_card' THEN 1 END) as redCards
    FROM players p
    JOIN teams t ON p.team_id = t.id
    LEFT JOIN events e ON p.id = e.player_id
    WHERE t.championship_id = ?
    GROUP BY p.id
    ORDER BY goals DESC;
  `;
  const results = await db.getAllAsync<Omit<PlayerStat, 'position'>>(query, [championshipId]);
  
  return results.map((result, index) => ({
    ...result,
    position: index + 1,
  }));
};

export const getStandings = async (championshipId: number): Promise<TeamStanding[]> => {
  const teams = await getTeamsByChampionshipId(championshipId);
  const finishedFixtures = await db.getAllAsync<Fixture>(
    "SELECT * FROM fixtures WHERE championship_id = ? AND status = 'finished';",
    [championshipId]
  );

  const standingsMap: { [key: number]: Omit<TeamStanding, 'position'> } = {};

  teams.forEach(team => {
    standingsMap[team.id] = {
      teamName: team.name, played: 0, wins: 0, draws: 0, losses: 0,
      goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0,
    };
  });

  finishedFixtures.forEach(match => {
    const home = standingsMap[match.home_team_id];
    const away = standingsMap[match.away_team_id];
    const homeScore = match.home_team_score || 0;
    const awayScore = match.away_team_score || 0;

    if (!home || !away) return;

    home.played++; away.played++;
    home.goalsFor += homeScore; away.goalsFor += awayScore;
    home.goalsAgainst += awayScore; away.goalsAgainst += homeScore;

    if (homeScore > awayScore) {
      home.wins++; away.losses++; home.points += 3;
    } else if (awayScore > homeScore) {
      away.wins++; home.losses++; away.points += 3;
    } else {
      home.draws++; away.draws++; home.points += 1; away.points += 1;
    }
  });

  const standingsArray = Object.values(standingsMap).map(team => ({
    ...team,
    goalDifference: team.goalsFor - team.goalsAgainst,
  }));

  standingsArray.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });

  return standingsArray.map((team, index) => ({ ...team, position: index + 1 }));
};

type ManualFixtureData = {
    championship_id: number;
    round: number;
    home_team_id: number;
    away_team_id: number;
}
export const createManualFixture = async (data: ManualFixtureData): Promise<void> => {
  await db.runAsync(
    'INSERT INTO fixtures (championship_id, round, home_team_id, away_team_id, status) VALUES (?, ?, ?, ?, ?);',
    [data.championship_id, data.round, data.home_team_id, data.away_team_id, 'pending']
  );
};