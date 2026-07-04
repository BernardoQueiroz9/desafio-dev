const request = require('supertest');
const { connect, clearDb, disconnect, app, tokenFor } = require('./helpers');
const User = require('../src/models/User');
const Ad = require('../src/models/Ad');

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

describe('POST /api/ads — idempotencia', () => {
  test('mesma idempotency_key retorna o anuncio existente sem criar outro', async () => {
    await Ad.create({
      ml_id: 'MLB-EXISTENTE', title: 'Anuncio', price: 10, available_quantity: 1,
      idempotency_key: 'dup-1', user: user._id,
    });

    const res = await request(server)
      .post('/api/ads')
      .set('Authorization', `Bearer ${token}`)
      .send({ idempotency_key: 'dup-1', title: 'Anuncio', price: 10, available_quantity: 1, category_id: 'MLB1', images: ['x'] });

    expect(res.status).toBe(200);
    expect(res.body.ml_id).toBe('MLB-EXISTENTE');

    const count = await Ad.countDocuments({ user: user._id });
    expect(count).toBe(1);
  });
});
