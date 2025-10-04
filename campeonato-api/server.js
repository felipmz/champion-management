// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Conexão com o MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB conectado com sucesso.'))
  .catch(err => console.error('Erro ao conectar ao MongoDB:', err));

// Rotas da API
app.use('/api', apiRoutes);

/*
app.listen(PORT, () => {
  console.log(`API rodando na porta ${PORT}`);
});
*/

module.exports = app;