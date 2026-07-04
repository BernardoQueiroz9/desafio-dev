const ml = require('../src/services/mercadolibre');

// Testa o mapeamento de erros do ML para mensagens acionaveis pt-BR (V11).
describe('mapMlError', () => {
  test('cadastro de vendedor incompleto (address_pending)', () => {
    const msg = ml.mapMlError({ error: 'seller.unable_to_list', cause: [{ code: 'address_pending' }] });
    expect(msg).toMatch(/endereço|cadastro/i);
  });

  test('listing type incompativel', () => {
    const msg = ml.mapMlError({ message: 'listing_type not allowed for category', cause: [] });
    expect(msg).toMatch(/categoria/i);
  });

  test('imagem rejeitada', () => {
    const msg = ml.mapMlError({ message: 'invalid pictures', cause: ['item.pictures.error'] });
    expect(msg).toMatch(/imagem/i);
  });

  test('atributo obrigatorio', () => {
    const msg = ml.mapMlError({ cause: ['item.attributes.required'] });
    expect(msg).toMatch(/atributo/i);
  });

  test('erro vazio -> mensagem de conexao amigavel', () => {
    const msg = ml.mapMlError({});
    expect(msg).toMatch(/conexão|mercado livre/i);
  });

  test('nunca retorna JSON tecnico bruto', () => {
    const msg = ml.mapMlError({ error: 'x', message: 'y', cause: [{ code: 'z' }] });
    expect(typeof msg).toBe('string');
    expect(msg).not.toMatch(/[{}]/);
  });
});
