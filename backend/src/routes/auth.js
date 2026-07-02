const express = require('express');
const User = require('../models/User');
const { sendLoginNotification } = require('../services/email');
const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' });
    }

    if (name.length < 3) {
      return res.status(400).json({ error: 'Nome deve ter no mínimo 3 caracteres' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(409).json({ error: 'Email já cadastrado' });
    }

    const user = await User.create({ name, email, password });

    res.status(201).json({ userId: user._id, name: user.name });
  } catch (error) {
    console.error('Erro no register:', error.message);
    res.status(500).json({ error: 'Erro ao cadastrar: ' + error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    sendLoginNotification(user.email, user.name).catch(err => {
      console.error('Erro ao enviar email:', err.message);
    });

    res.json({ userId: user._id, name: user.name });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

router.get('/check-email', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Email é obrigatório' });

    const user = await User.findOne({ email: email.toLowerCase() });
    res.json({ exists: !!user });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao verificar email' });
  }
});

module.exports = router;
