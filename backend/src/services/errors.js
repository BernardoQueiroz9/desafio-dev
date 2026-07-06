class MlReauthRequired extends Error {
  constructor(message = 'Sua sessao com o Mercado Livre expirou. Entre novamente.') {
    super(message);
    this.name = 'MlReauthRequired';
    this.code = 'ML_REAUTH_REQUIRED';
  }
}

function handleReauth(res, err) {
  if (err instanceof MlReauthRequired) {
    res.status(401).json({ error: err.message, code: err.code });
    return true;
  }
  return false;
}

module.exports = { MlReauthRequired, handleReauth };
