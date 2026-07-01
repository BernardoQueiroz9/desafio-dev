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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);

  let uri = process.env.MONGO_URI;
  console.log('MONGO_URI definida:', !!uri, uri ? uri.substring(0, 20) + '...' : 'N/A');

  if (uri && !uri.includes('%24')) {
    uri = uri.replace(/:([^@]+)@/, (_, pwd) => ':' + encodeURIComponent(pwd) + '@');
  }

  mongoose.connect(uri || '')
    .then(() => console.log('MongoDB Conectado'))
    .catch(err => console.error('Erro no MongoDB:', err.message));
});