// services/database.ts
import * as SQLite from 'expo-sqlite';
import { Championship } from '../constants/types';

// 1. Abertura do banco de dados com o método síncrono
const db = SQLite.openDatabaseSync('campeonatos.db');

// 2. Usando async/await para inicializar o banco
export const initDatabase = async (): Promise<void> => {
  // O execAsync é ótimo para rodar múltiplos comandos de setup
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS championships (
      id INTEGER PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      players_per_team INTEGER NOT NULL DEFAULT 11
    );
    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY NOT NULL,
      championship_id INTEGER,
      name TEXT NOT NULL,
      FOREIGN KEY (championship_id) REFERENCES championships (id)
    );
  `);
};

// 3. Usando async/await e generics para buscar dados com tipagem automática
export const getChampionships = async (): Promise<Championship[]> => {
  // O getAllAsync já retorna os resultados em um array, e podemos passar o tipo!
  const allRows = await db.getAllAsync<Championship>('SELECT * FROM championships;');
  return allRows;
};

// Exemplo de como criar um novo campeonato (INSERT)
export const createChampionship = async (name: string, playersPerTeam: number): Promise<void> => {
  // O runAsync é usado para INSERT, UPDATE, DELETE
  await db.runAsync(
    'INSERT INTO championships (name, players_per_team) VALUES (?, ?);',
    [name, playersPerTeam] // Parâmetros são passados em um array
  );
};