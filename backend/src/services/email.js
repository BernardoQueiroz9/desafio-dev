const nodemailer = require('nodemailer');

let transport = null;

async function getTransport() {
  if (transport) return transport;

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    return transport;
  }

  const testAccount = await nodemailer.createTestAccount();
  transport = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
  console.log('📧 Ethereal SMTP:', testAccount.user);
  return transport;
}

async function sendLoginNotification(email, name) {
  try {
    const t = await getTransport();
    const now = new Date().toLocaleString('pt-BR');

    const info = await t.sendMail({
      from: process.env.SMTP_USER
        ? `"Desafio ML" <${process.env.SMTP_USER}>`
        : '"Desafio ML" <noreply@desafioml.local>',
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
    if (!process.env.SMTP_HOST) {
      console.log('🔗 Visualizar em:', nodemailer.getTestMessageUrl(info));
    }
  } catch (err) {
    console.error('Erro ao enviar email:', err.message);
  }
}

module.exports = { sendLoginNotification };
