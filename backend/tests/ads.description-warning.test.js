jest.mock('../src/services/mercadolibre', () => ({
  getAvailableListingTypes: jest.fn(async () => [{ id: 'gold_special' }]),
  checkAvailableListingType: jest.fn(async () => ({ id: 'gold_special' })),
  uploadPicture: jest.fn(async () => ({ source: 'http://img/1.jpg' })),
  getCategoryRequiredAttributes: jest.fn(async () => []),
  getCategorySaleTerms: jest.fn(async () => []),
  validateItem: jest.fn(async () => null),
  createItem: jest.fn(async () => ({ id: 'MLB-NOVO' })),
  setDescription: jest.fn(async () => { throw new Error('descricao rejeitada'); }),
  getCategory: jest.fn(async () => ({ name: 'Categoria X' })),
  refreshAccessToken: jest.fn(),
  getUser: jest.fn(),
  mapMlError: jest.fn(() => 'erro'),
}));

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

describe('POST /api/ads — FR-006 aviso de descricao', () => {
  test('item criado + setDescription falhando -> 201 com description_warning', async () => {
    const res = await request(server)
      .post('/api/ads')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Produto', price: 100, available_quantity: 5,
        category_id: 'MLB1', images: ['data:image/jpg;base64,x'],
        description: 'Uma descricao', attributes: [{ id: 'BRAND', value_name: 'Generica' }],
      });

    expect(res.status).toBe(201);
    expect(res.body.ml_id).toBe('MLB-NOVO');
    expect(res.body.description_warning).toMatch(/descrição não pôde ser salva/i);
  });
});
