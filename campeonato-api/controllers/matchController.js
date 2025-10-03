// controllers/matchController.js
const mongoose = require('mongoose');
const FixtureModel = require('../models/Fixture');
const EventModel = require('../models/Event');
const PlayerModel = require('../models/Player');
const TeamModel = require('../models/Team');

// Pega as partidas de um campeonato específico
exports.getFixturesByChampionship = async (req, res) => {
    try {
        const fixtures = await FixtureModel.find({ championship_id: req.params.id })
            .populate('home_team_id', 'name')
            .populate('away_team_id', 'name');

        const formattedFixtures = fixtures.map(f => {
            if (!f.home_team_id || !f.away_team_id) return null;
            return {
                ...f.toObject(),
                home_team_name: f.home_team_id.name,
                away_team_name: f.away_team_id.name,
            };
        }).filter(f => f !== null);
        res.status(200).json(formattedFixtures);
    } catch (error) {
        console.error('ERRO NO CONTROLLER:', error);
        res.status(500).json({ error: error.message });
    }
};

// Pega TODAS as partidas de TODOS os campeonatos
exports.getAllFixtures = async (req, res) => {
    try {
        const fixtures = await FixtureModel.find({})
            .sort({ round: 1 })
            .populate('championship_id', 'name')
            .populate('home_team_id', 'name')
            .populate('away_team_id', 'name');

        const formattedFixtures = fixtures.map(f => {
            if (!f.championship_id || !f.home_team_id || !f.away_team_id) return null;
            return {
                ...f.toObject(),
                championshipName: f.championship_id.name,
                home_team_name: f.home_team_id.name,
                away_team_name: f.away_team_id.name,
            };
        }).filter(f => f !== null);

        res.status(200).json(formattedFixtures);
    } catch (error) {
        console.error('ERRO NO CONTROLLER:', error);
        res.status(500).json({ error: error.message });
    }
};

// Pega detalhes de uma partida
exports.getMatchDetails = async (req, res) => {
    try {
        const fixture = await FixtureModel.findById(req.params.id)
            .populate('home_team_id', 'name')
            .populate('away_team_id', 'name');
            
        if (!fixture) return res.status(404).json({ message: "Partida não encontrada" });

        res.status(200).json({
            ...fixture.toObject(),
            home_team_name: fixture.home_team_id.name,
            away_team_name: fixture.away_team_id.name,
        });
    } catch (error) {
        console.error('ERRO NO CONTROLLER:', error);
        res.status(500).json({ error: error.message });
    }
};

// Adiciona um evento a uma partida
exports.addEvent = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const match_id = req.params.id;
        const eventData = req.body;

        const newEvent = new EventModel({ ...eventData, match_id });
        await newEvent.save({ session });
        
        if (eventData.type === 'goal') {
            const match = await FixtureModel.findById(match_id).session(session);
            if(String(eventData.team_id) === String(match.home_team_id)) {
                match.home_team_score += 1;
            } else {
                match.away_team_score += 1;
            }
            await match.save({ session });
        }
        
        await session.commitTransaction();
        res.status(201).json(newEvent);
    } catch (error) {
        await session.abortTransaction();
        console.error('ERRO NO CONTROLLER:', error);
        res.status(500).json({ error: error.message });
    } finally {
        session.endSession();
    }
};

// Pega os eventos de uma partida
exports.getEventsForMatch = async (req, res) => {
    try {
        const events = await EventModel.find({ match_id: req.params.id })
            .populate('player_id', 'name')
            .populate('assister_id', 'name')
            .sort({ minute: 'asc' });
        
        const formattedEvents = events.map(e => ({
            ...e.toObject(),
            player_name: e.player_id.name,
            assister_name: e.assister_id ? e.assister_id.name : undefined,
        }));
        res.status(200).json(formattedEvents);
    } catch (error) {
        console.error('ERRO NO CONTROLLER:', error);
        res.status(500).json({ error: error.message });
    }
};

// Pega os jogadores de uma partida
exports.getPlayersForMatch = async (req, res) => {
    try {
        const match = await FixtureModel.findById(req.params.id);
        if (!match) return res.status(404).json({ message: "Partida não encontrada" });

        const players = await PlayerModel.find({
            'team_id': { $in: [match.home_team_id, match.away_team_id] }
        });

        res.status(200).json(players);
    } catch (error) {
        console.error('ERRO NO CONTROLLER:', error);    
        res.status(500).json({ error: error.message });
    }
};

// Calcula as estatísticas de uma partida ("Melhor do Jogo")
exports.calculateMatchStats = async (req, res) => {
    try {
        const matchId = req.params.id;
        const events = await EventModel.find({ match_id: matchId });
        const match = await FixtureModel.findById(matchId);
        if (!match) return res.status(404).json({ message: "Partida não encontrada" });

        const playersInMatch = await PlayerModel.find({ 
            'team_id': { $in: [match.home_team_id, match.away_team_id] } 
        }).populate('team_id', 'name');
        
        const stats = playersInMatch.map(player => {
            const goals = events.filter(e => String(e.player_id) === String(player._id) && e.type === 'goal').length;
            const assists = events.filter(e => String(e.assister_id) === String(player._id)).length;
            const yellowCards = events.filter(e => String(e.player_id) === String(player._id) && e.type === 'yellow_card').length;
            const redCards = events.filter(e => String(e.player_id) === String(player._id) && e.type === 'red_card').length;
            
            const points = (goals * 6) + (assists * 3) + (yellowCards * -1) + (redCards * -3);

            return { 
                playerId: player._id, 
                playerName: player.name,
                teamName: player.team_id.name,
                goals, assists, yellowCards, redCards, 
                points 
            };
        });

        stats.sort((a, b) => b.points - a.points);
        res.status(200).json(stats);

    } catch (error) {
        console.error('ERRO NO CONTROLLER:', error);
        res.status(500).json({ error: error.message });
    }
};

// Atualiza o status de uma partida (ex: para 'finished')
exports.updateMatchStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['pending', 'live', 'finished'].includes(status)) {
            return res.status(400).json({ message: 'Status inválido.' });
        }

        const match = await FixtureModel.findByIdAndUpdate(
            req.params.id,
            { status: status },
            { new: true }
        );

        if (!match) {
            return res.status(404).json({ message: 'Partida não encontrada.' });
        }
        res.status(200).json(match);
    } catch (error) {
        console.error('ERRO NO CONTROLLER:', error);
        res.status(500).json({ error: error.message });
    }
};