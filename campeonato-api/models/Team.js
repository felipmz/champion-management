const mongoose = require('mongoose');
const teamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  championship_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Championship', required: true },
}, { timestamps: true });
module.exports = mongoose.model('Team', teamSchema);