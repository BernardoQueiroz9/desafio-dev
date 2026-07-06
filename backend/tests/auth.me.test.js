const request = require('supertest');
const { connect, clearDb, disconnect, app, tokenFor } = require('./helpers');
const User = require('../src/models/User');

let server;
beforeAll(async () => { await connect(); server = app(); });
afterEach(async () => { await clearDb(); });
afterAll(async () => { await disconnect(); });

describe('GET /api/auth/me', () => {
  test('retorna allowlist enxuta e NAO expoe _dump nem tokens', async () => {
    const user = await User.create({
      name: 'Fulano',
      email: 'fulano@example.com',
      ml_user_id: '999',
      ml_access_token: 'token-secreto',
      ml_refresh_token: 'refresh-secreto',
      ml_token_expires_at: new Date(Date.now() + 3600 * 1000),
    });

    const res = await request(server)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${tokenFor(user)}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('name', 'Fulano');
    expect(res.body).toHaveProperty('ml_user_id', '999');
    expect(res.body._dump).toBeUndefined();
    expect(res.body.ml_access_token).toBeUndefined();
    expect(res.body.ml_refresh_token).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain('token-secreto');
  });

  test('sem token retorna 401', async () => {
    const res = await request(server).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
