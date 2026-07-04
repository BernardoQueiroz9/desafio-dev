const request = require('supertest');
const mongoose = require('mongoose');
const { connect, clearDb, disconnect, app } = require('./helpers');
const AuthCode = require('../src/models/AuthCode');

let server;
beforeAll(async () => { await connect(); server = app(); });
afterEach(async () => { await clearDb(); });
afterAll(async () => { await disconnect(); });

describe('POST /api/auth/exchange', () => {
  async function seedCode(code) {
    await AuthCode.create({
      _id: code,
      userId: new mongoose.Types.ObjectId(),
      mlUserId: '123456',
      userName: 'Vendedor Teste',
    });
  }

  test('troca um code valido por um JWT (200) e o code vira uso unico', async () => {
    await seedCode('code-abc');

    const first = await request(server).post('/api/auth/exchange').send({ code: 'code-abc' });
    expect(first.status).toBe(200);
    expect(first.body.token).toBeTruthy();
    expect(first.body.userName).toBe('Vendedor Teste');

    const second = await request(server).post('/api/auth/exchange').send({ code: 'code-abc' });
    expect(second.status).toBe(410);
  });

  test('code ausente retorna 400', async () => {
    const res = await request(server).post('/api/auth/exchange').send({});
    expect(res.status).toBe(400);
  });
});
