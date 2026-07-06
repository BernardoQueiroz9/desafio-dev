process.env.NODE_ENV = process.env.NODE_ENV || 'test';

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');
const config = require('../src/config/env');
const { createApp } = require('../src/app');

let mongoServer;

async function connect() {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
}

async function clearDb() {
  const { collections } = mongoose.connection;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
}

async function disconnect() {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
}

function app() {
  return createApp();
}

function tokenFor(user) {
  return jwt.sign(
    { userId: user._id.toString(), mlUserId: String(user.ml_user_id) },
    config.jwtSecret,
    { expiresIn: '7d' }
  );
}

module.exports = { connect, clearDb, disconnect, app, tokenFor };
