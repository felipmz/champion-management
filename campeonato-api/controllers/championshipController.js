const mongoose = require('mongoose');
const Championship = require('../models/Championship');
const Team = require('../models/Team');
const Player = require('../models/Player');
const Fixture = require('../models/Fixture');
const Event = require('../models/Event'); // <-- LINHA QUE FALTAVA

// Cria um campeonato
exports.createChampionship = async (req, res) => {
    try {
        const { name, players_per_team } = req.body;
        const champ = new Championship({ name, players_per_team });
        await champ.save();
        res.status(201).json(champ);
    } catch (error) {
        console.error('ERRO NO CONTROLLER:', error);
        res.status(500).json({ error: error.message });
    }
};

// Pega todos os campeonatos
exports.getAllChampionships = async (req, res) => {
    try {
        const champs = await Championship.find().sort({ createdAt: -1 });
        res.status(200).json(champs);
    } catch (error) {
        console.error('ERRO NO CONTROLLER:', error);
        res.status(500).json({ error: error.message });
    }
};

// Pega um campeonato por ID
exports.getChampionshipById = async (req, res) => {
    try {
        const champ = await Championship.findById(req.params.id);
        if (!champ) return res.status(404).json({ message: "Campeonato não encontrado" });
        res.status(200).json(champ);
    } catch (error) {
        console.error('ERRO NO CONTROLLER:', error);
        res.status(500).json({ error: error.message });
    }
};

// Cria um time para um campeonato
exports.createTeam = async (req, res) => {
    try {
        const { name } = req.body;
        const team = new Team({ name, championship_id: req.params.id });
        await team.save();
        res.status(201).json(team);
    } catch (error) {
        console.error('ERRO NO CONTROLLER:', error);
        res.status(500).json({ error: error.message });
    }
};

// Pega os times de um campeonato
exports.getTeamsByChampionship = async (req, res) => {
    try {
        const teams = await Team.find({ championship_id: req.params.id });
        res.status(200).json(teams);
    } catch (error) {
        console.error('ERRO NO CONTROLLER:', error);
        res.status(500).json({ error: error.message });
    }
};

// Cria um jogador para um time
exports.createPlayer = async (req, res) => {
    try {
        const { name } = req.body;
        const player = new Player({ name, team_id: req.params.id });
        await player.save();
        res.status(201).json(player);
    } catch (error) {
        console.error('ERRO NO CONTROLLER:', error);
        res.status(500).json({ error: error.message });
    }
};

// Pega os jogadores de um time
exports.getPlayersByTeam = async (req, res) => {
    try {
        const players = await Player.find({ team_id: req.params.id });
        res.status(200).json(players);
    } catch (error) {
        console.error('ERRO NO CONTROLLER:', error);
        res.status(500).json({ error: error.message });
    }
};

// Gera a tabela de jogos (lógica complexa)
exports.generateFixtures = async (req, res) => {
    try {
        const championshipId = req.params.id;
        await Fixture.deleteMany({ championship_id: championshipId });
        const teams = await Team.find({ championship_id: championshipId });

        if (teams.length < 2) {
            return res.status(400).json({ message: 'São necessários pelo menos 2 times para gerar uma tabela.' });
        }

        const teamList = [...teams];
        if (teamList.length % 2 !== 0) {
            teamList.push({ _id: null, name: 'BYE' }); // Time "Folga"
        }

        const numRounds = teamList.length - 1;
        const halfSize = teamList.length / 2;
        const fixtures = [];

        for (let round = 0; round < numRounds; round++) {
            for (let i = 0; i < halfSize; i++) {
                const home = teamList[i];
                const away = teamList[teamList.length - 1 - i];

                if (home._id && away._id) { // Não cria jogo com o time BYE
                    fixtures.push({
                        championship_id: championshipId,
                        round: round + 1,
                        home_team_id: home._id,
                        away_team_id: away._id,
                    });
                }
            }
            // Rotaciona a lista
            teamList.splice(1, 0, teamList.pop());
        }

        await Fixture.insertMany(fixtures);
        const createdFixtures = await Fixture.find({ championship_id: championshipId })
            .populate('home_team_id', 'name')
            .populate('away_team_id', 'name');

        res.status(201).json(createdFixtures);
    } catch (error) {
        console.error('ERRO NO CONTROLLER:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getPlayerStats = async (req, res) => {
    try {
        const championshipId = req.params.id;

        const stats = await Event.aggregate([
            // 1. Filtra apenas os eventos de gol
            { $match: { type: 'goal' } },
            // 2. Faz o "JOIN" com a coleção de jogadores
            {
                $lookup: {
                    from: Player.collection.name,
                    localField: 'player_id',
                    foreignField: '_id',
                    as: 'playerInfo'
                }
            },
            { $unwind: '$playerInfo' },
            // 4. Faz o "JOIN" com a coleção de times
            {
                $lookup: {
                    from: Team.collection.name,
                    localField: 'playerInfo.team_id',
                    foreignField: '_id',
                    as: 'teamInfo'
                }
            },
            { $unwind: '$teamInfo' },
            // 5. Filtra para pegar apenas os times do campeonato correto
            { $match: { 'teamInfo.championship_id': new mongoose.Types.ObjectId(championshipId) } },
            // 6. Agrupa por jogador e conta os gols
            {
                $group: {
                    _id: '$playerInfo._id',
                    playerName: { $first: '$playerInfo.name' },
                    teamName: { $first: '$teamInfo.name' },
                    goals: { $sum: 1 }
                }
            },
            // 7. Ordena por mais gols
            { $sort: { goals: -1 } }
        ]);

        const rankedStats = stats.map((stat, index) => ({
            ...stat,
            position: index + 1
        }));

        res.status(200).json(rankedStats);
    } catch (error) {
        console.error('ERRO NO CONTROLLER:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getStandings = async (req, res) => {
    try {
        const championshipId = req.params.id;
        const teams = await Team.find({ championship_id: championshipId });
        const finishedFixtures = await Fixture.find({ championship_id: championshipId, status: 'finished' });

        const standingsMap = {};

        teams.forEach(team => {
            standingsMap[team._id] = {
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

        const finalStandings = standingsArray.map((team, index) => ({ ...team, position: index + 1 }));

        res.status(200).json(finalStandings);
    } catch (error) {
        console.error('ERRO NO CONTROLLER:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getTeamById = async (req, res) => {
    try {
        const team = await Team.findById(req.params.id);
        if (!team) {
            return res.status(404).json({ message: "Time não encontrado" });
        }
        res.status(200).json(team);
    } catch (error) {
        console.error('ERRO NO CONTROLLER:', error);
        res.status(500).json({ error: error.message });
    }
};