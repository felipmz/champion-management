const mongoose = require('mongoose');
const playerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  team_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
}, { timestamps: true });
module.exports = mongoose.model('Player', playerSchema);