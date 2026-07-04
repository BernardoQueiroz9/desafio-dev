const request = require('supertest');
const { connect, clearDb, disconnect, app, tokenFor } = require('./helpers');
const User = require('../src/models/User');

let server, user, token;
beforeAll(async () => { await connect(); server = app(); });
beforeEach(async () => {
  user = await User.create({
    name: 'Vendedor', ml_user_id: '1', ml_access_token: 't',
    ml_token_expires_at: new Date(Date.now() + 3600 * 1000),
  });
  token = tokenFor(user);
});
afterEach(async () => { await clearDb(); });
afterAll(async () => { await disconnect(); });

const post = (body) => request(server).post('/api/ads').set('Authorization', `Bearer ${token}`).send(body);

describe('POST /api/ads — validacao de entrada', () => {
  test('estoque < 1 -> 400', async () => {
    const res = await post({ available_quantity: 0, category_id: 'MLB1', images: ['x'], title: 'ok' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/estoque/i);
  });

  test('categoria ausente -> 400', async () => {
    const res = await post({ available_quantity: 1, images: ['x'], title: 'ok' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/categoria/i);
  });

  test('sem imagens -> 400', async () => {
    const res = await post({ available_quantity: 1, category_id: 'MLB1', images: [], title: 'ok' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/imagem/i);
  });

  test('mais de 5 imagens -> 400', async () => {
    const res = await post({ available_quantity: 1, category_id: 'MLB1', images: ['a','b','c','d','e','f'], title: 'ok' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/5 imagens/i);
  });

  test('titulo com mais de 60 caracteres -> 400', async () => {
    const res = await post({ available_quantity: 1, category_id: 'MLB1', images: ['x'], title: 'a'.repeat(61) });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/60 caracteres/i);
  });
});
