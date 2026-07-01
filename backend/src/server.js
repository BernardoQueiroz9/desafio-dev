require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const mockRoutes = require('./routes/mockMl');
const authRoutes = require('./routes/auth');
const adsRoutes = require('./routes/ads');

const app = express();

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173'
};
app.use(cors(corsOptions));
app.use(express.json());


app.use('/mock', mockRoutes); 
app.use('/api/auth', authRoutes);
app.use('/api/ads', adsRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB Conectado');
    app.listen(process.env.PORT, () => console.log(`🚀 Servidor rodando na porta ${process.env.PORT}`));
  })
  .catch(err => console.error('Erro no MongoDB:', err));