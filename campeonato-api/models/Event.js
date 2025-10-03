const mongoose = require('mongoose');
const eventSchema = new mongoose.Schema({
  match_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Fixture', required: true },
  minute: { type: Number, required: true },
  type: { type: String, enum: ['goal', 'yellow_card', 'red_card'], required: true },
  player_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
  assister_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
  team_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
}, { timestamps: true });
module.exports = mongoose.model('Event', eventSchema);