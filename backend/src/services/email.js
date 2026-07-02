const nodemailer = require('nodemailer');

function createTransport() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return null;
}

async function sendLoginNotification(email, name) {
  const transport = createTransport();
  if (!transport) {
    console.log('ℹ️ SMTP não configurado — email não enviado para', email);
    return;
  }

  const now = new Date().toLocaleString('pt-BR');

  await transport.sendMail({
    from: `"Desafio ML" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Login realizado com sucesso',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
        <h2 style="color:#3483FA;">Login realizado com sucesso</h2>
        <p>Olá <strong>${name}</strong>,</p>
        <p>Seu login no <strong>Desafio ML</strong> foi realizado em <strong>${now}</strong>.</p>
        <hr style="border:none;border-top:1px solid #E0E0E0;">
        <p style="font-size:12px;color:#999;">Este email foi enviado automaticamente.</p>
      </div>
    `,
  });

  console.log('✉️ Email enviado para', email);
}

module.exports = { sendLoginNotification };
