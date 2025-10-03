const mongoose = require('mongoose');
const championshipSchema = new mongoose.Schema({
  name: { type: String, required: true },
  players_per_team: { type: Number, required: true },
}, { timestamps: true });
module.exports = mongoose.model('Championship', championshipSchema);