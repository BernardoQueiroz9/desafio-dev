const request = require('supertest');
const { connect, clearDb, disconnect, app } = require('./helpers');
const OAuthState = require('../src/models/OAuthState');

let server;
beforeAll(async () => { await connect(); server = app(); });
afterEach(async () => { await clearDb(); });
afterAll(async () => { await disconnect(); });

describe('GET /api/auth/ml/login', () => {
  test('persiste um OAuthState no Mongo e redireciona ao ML', async () => {
    const res = await request(server).get('/api/auth/ml/login');
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('/authorization');
    expect(res.headers.location).toContain('code_challenge');
    const states = await OAuthState.find({});
    expect(states).toHaveLength(1);
    expect(states[0].codeVerifier).toBeTruthy();
  });
});

describe('GET /api/auth/ml/callback', () => {
  test('rejeita state inexistente/invalido com error=invalid_state', async () => {
    const res = await request(server).get('/api/auth/ml/callback?code=abc&state=naoexiste');
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('error=invalid_state');
  });
});
