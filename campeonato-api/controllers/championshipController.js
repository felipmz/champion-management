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
// controllers/championshipController.js

// ... (outras funções antes desta) ...

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

                if (home._id && away._id) {
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
        
        // 👇 CORREÇÃO APLICADA AQUI 👇
        // Trocamos 'FixtureModel' por 'Fixture'
        const createdFixtures = await Fixture.find({ championship_id: championshipId })
            .populate('home_team_id', 'name')
            .populate('away_team_id', 'name');

        // Adicionamos a formatação que o frontend espera
        const formattedFixtures = createdFixtures.map(f => ({
            ...f.toObject(),
            home_team_name: f.home_team_id.name,
            away_team_name: f.away_team_id.name,
        }));
        
        res.status(201).json(formattedFixtures);

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

exports.deleteChampionship = async (req, res) => {
    try {
        const champ = await Championship.findOneAndDelete({ _id: req.params.id });
        if (!champ) {
            return res.status(404).json({ message: "Campeonato não encontrado" });
        }
        res.status(200).json({ message: "Campeonato e todos os dados associados foram excluídos." });
    } catch (error) {
        console.error('ERRO AO DELETAR CAMPEONATO:', error);
        res.status(500).json({ error: error.message });
    }
};


// DELETAR um time 
exports.deleteTeam = async (req, res) => {
    // Inicia uma sessão para a transação
    const session = await mongoose.startSession();
    // Inicia a transação
    session.startTransaction();
    try {
        const { id } = req.params; // Pega o ID do time a ser deletado

        // 1. Validação: Verifica se o time realmente existe
        const team = await Team.findById(id).session(session);
        if (!team) {
            await session.abortTransaction(); // Cancela a transação
            session.endSession();
            return res.status(404).json({ message: 'Time não encontrado.' });
        }

        // 2. Encontrar Partidas: Acha todas as partidas em que o time participou (em casa ou fora)
        const fixtures = await Fixture.find({ 
            $or: [{ home_team_id: id }, { away_team_id: id }] 
        }).session(session);
        

        // --- VERIFICAÇÃO ADICIONADA ---
        // 2.1. Verifica se alguma das partidas encontradas está com o status 'live'
        const hasLiveFixture = fixtures.some(fixture => fixture.status === 'live');
        if (hasLiveFixture) {
            // Se houver uma partida ao vivo, aborta a transação e informa o usuário
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'Não é possível deletar um time que tem uma partida em andamento.' });
        }
        // --- FIM DA VERIFICAÇÃO ---


        const fixtureIds = fixtures.map(f => f._id);

        // 3. Deletar Eventos: Se houver partidas, deleta todos os eventos (gols, cartões) associados a elas
        if (fixtureIds.length > 0) {
            await Event.deleteMany({ match_id: { $in: fixtureIds } }).session(session);
        }

        // 4. Deletar Partidas: Deleta as partidas encontradas
        if (fixtureIds.length > 0) {
            await Fixture.deleteMany({ _id: { $in: fixtureIds } }).session(session);
        }
        
        // 5. Deletar Jogadores: Deleta todos os jogadores que pertencem ao time
        await Player.deleteMany({ team_id: id }).session(session);

        // 6. Deletar o Time: Finalmente, deleta o próprio time
        await Team.findByIdAndDelete(id).session(session);

        // Se todos os passos acima ocorreram sem erro, confirma a transação
        await session.commitTransaction();
        res.status(200).json({ message: 'Time e todos os dados associados foram deletados com sucesso.' });

    } catch (error) {
        // Se qualquer passo falhar, a transação inteira é revertida
        await session.abortTransaction();
        console.error('ERRO AO DELETAR TIME:', error);
        res.status(500).json({ error: error.message });
    } finally {
        // Encerra a sessão, independentemente do resultado
        session.endSession();
    }
};

// controllers/championshipController.js
// ... (outras funções)

// 👇 ADICIONE ESTA NOVA FUNÇÃO
exports.deletePlayer = async (req, res) => {
    try {
        const { id } = req.params;
        const player = await Player.findByIdAndDelete(id);

        if (!player) {
            return res.status(404).json({ message: "Jogador não encontrado." });
        }

        // Opcional: Remover eventos associados a este jogador
        await Event.deleteMany({ $or: [{ player_id: id }, { assister_id: id }] });

        res.status(200).json({ message: "Jogador excluído com sucesso." });
    } catch (error) {
        console.error('ERRO AO DELETAR JOGADOR:', error);
        res.status(500).json({ error: error.message });
    }
};