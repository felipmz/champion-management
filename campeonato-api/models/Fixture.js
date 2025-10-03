const mongoose = require('mongoose');
const fixtureSchema = new mongoose.Schema({
  round: { type: Number, required: true },
  championship_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Championship', required: true },
  home_team_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  away_team_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  home_team_score: { type: Number, default: 0 },
  away_team_score: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'live', 'finished'], default: 'pending' },
}, { timestamps: true });
module.exports = mongoose.model('Fixture', fixtureSchema);