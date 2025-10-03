// routes/api.js
const express = require('express');
const router = express.Router();
const champController = require('../controllers/championshipController');
const matchController = require('../controllers/matchController');

// --- Rotas de Campeonato ---
router.post('/championships', champController.createChampionship);
router.get('/championships', champController.getAllChampionships);
router.get('/championships/:id', champController.getChampionshipById);

// --- Rotas de Time (aninhadas em campeonato) ---
router.post('/championships/:id/teams', champController.createTeam);
router.get('/championships/:id/teams', champController.getTeamsByChampionship);

// --- Rotas de Jogador (aninhadas em time) ---
router.post('/teams/:id/players', champController.createPlayer);
router.get('/teams/:id/players', champController.getPlayersByTeam);
router.get('/teams/:id', champController.getTeamById);

// --- Rotas de Partida (Fixture) e Eventos ---
router.post('/championships/:id/generate-fixtures', champController.generateFixtures);
router.get('/championships/:id/fixtures', matchController.getFixturesByChampionship);
router.get('/matches/:id', matchController.getMatchDetails);
router.post('/matches/:id/events', matchController.addEvent);
router.get('/matches/:id/events', matchController.getEventsForMatch);
router.get('/matches/:id/players', matchController.getPlayersForMatch);
router.patch('/matches/:id/status', matchController.updateMatchStatus);

// --- Rotas de Estatísticas ---
router.get('/championships/:id/standings', champController.getStandings);
router.get('/championships/:id/player-stats', champController.getPlayerStats);
router.get('/matches/:id/stats', matchController.calculateMatchStats);
router.get('/fixtures', matchController.getAllFixtures);

module.exports = router;