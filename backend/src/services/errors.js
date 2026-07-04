/**
 * Erro tipado sinalizando que a sessao com o Mercado Livre nao pode ser
 * renovada (sem refresh_token ou refresh recusado). As rotas convertem em
 * 401 { code: 'ML_REAUTH_REQUIRED' } para o frontend forcar novo login.
 */
class MlReauthRequired extends Error {
  constructor(message = 'Sua sessao com o Mercado Livre expirou. Entre novamente.') {
    super(message);
    this.name = 'MlReauthRequired';
    this.code = 'ML_REAUTH_REQUIRED';
  }
}

/**
 * Se o erro for MlReauthRequired, responde 401 com o code padrao e retorna true.
 * Caso contrario, retorna false (o chamador segue com seu tratamento).
 */
function handleReauth(res, err) {
  if (err instanceof MlReauthRequired) {
    res.status(401).json({ error: err.message, code: err.code });
    return true;
  }
  return false;
}

module.exports = { MlReauthRequired, handleReauth };
