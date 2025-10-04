const mongoose = require('mongoose');
const championshipSchema = new mongoose.Schema({
  name: { type: String, required: true },
  players_per_team: { type: Number, required: true },
}, { timestamps: true });
// models/Championship.js
// ... (acima da linha module.exports)

// Middleware que executa ANTES de um campeonato ser removido
// Middleware que executa ANTES de um campeonato ser removido
championshipSchema.pre('findOneAndDelete', async function (next) {
  const champId = this.getQuery()['_id'];
  console.log(`Iniciando exclusão em cascata para o campeonato ${champId}`);

  // Importa os modelos necessários dentro da função
  const Team = require('./Team');
  const Player = require('./Player');
  const Fixture = require('./Fixture');
  const Event = require('./Event');

  // 1. PRIMEIRO, encontramos todos os times e partidas relacionados
  const teams = await Team.find({ championship_id: champId });
  const fixtures = await Fixture.find({ championship_id: champId });
  
  const teamIds = teams.map(t => t._id);
  const fixtureIds = fixtures.map(f => f._id);

  // 2. AGORA, deletamos os "netos" (Eventos e Jogadores) usando os IDs que coletamos
  if (fixtureIds.length > 0) {
    console.log(`Deletando ${fixtureIds.length} eventos...`);
    await Event.deleteMany({ match_id: { $in: fixtureIds } });
  }

  if (teamIds.length > 0) {
    console.log(`Deletando jogadores de ${teamIds.length} times...`);
    await Player.deleteMany({ team_id: { $in: teamIds } });
  }

  // 3. FINALMENTE, deletamos os "filhos" (Partidas e Times)
  console.log(`Deletando ${fixtures.length} partidas e ${teams.length} times...`);
  await Fixture.deleteMany({ championship_id: champId });
  await Team.deleteMany({ championship_id: champId });

  next();
});

// Garanta que há apenas UMA linha de exportação no final
module.exports = mongoose.model('Championship', championshipSchema);