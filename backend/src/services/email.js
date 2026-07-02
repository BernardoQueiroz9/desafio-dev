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

const fromName = () =>
  process.env.SMTP_USER
    ? `"Desafio ML" <${process.env.SMTP_USER}>`
    : '"Desafio ML" <noreply@desafioml.local>';

function wrapHtml(body) {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background:#FFE600;font-family:Arial,Helvetica,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFE600;">
        <tr>
          <td align="center" style="padding:32px 16px;">
            <table width="520" cellpadding="0" cellspacing="0" style="background:#FFF;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
              <tr>
                <td style="padding:32px 32px 16px;text-align:center;">
                  <span style="font-size:24px;font-weight:700;color:#333;letter-spacing:-0.5px;">
                    Desafio<span style="color:#3483FA;">ML</span>
                  </span>
                </td>
              </tr>
              ${body}
              <tr>
                <td style="padding:16px 32px 32px;text-align:center;border-top:1px solid #E0E0E0;">
                  <p style="margin:0;font-size:12px;color:#999;">
                    Desafio ML — Projeto de gerenciamento de anúncios<br>
                    Este email foi enviado automaticamente.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

function formatPrice(num) {
  return Number(num).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

async function sendWelcomeEmail(email, name) {
  try {
    const t = await getTransport();
    const now = new Date().toLocaleString('pt-BR');

    const info = await t.sendMail({
      from: fromName(),
      to: email,
      subject: 'Cadastro realizado com sucesso!',
      html: wrapHtml(`
        <tr>
          <td style="padding:8px 32px 24px;text-align:center;">
            <div style="width:56px;height:56px;border-radius:50%;background:#E7F0FF;display:flex;align-items:center;justify-content:center;margin:0 auto;">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3483FA" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <h1 style="font-size:22px;font-weight:700;color:#333;margin:16px 0 4px;">Bem-vindo ao Desafio ML!</h1>
            <p style="font-size:14px;color:#666;margin:0;">Olá <strong>${name}</strong>, seu cadastro foi realizado com sucesso.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F5;border-radius:6px;">
              <tr>
                <td style="padding:16px 20px;">
                  <p style="margin:0;font-size:13px;color:#666;">
                    <strong style="color:#333;">Data do cadastro:</strong><br>
                    ${now}
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 32px;text-align:center;">
            <a href="https://desafio-dev-two.vercel.app/dashboard"
               style="display:inline-block;padding:12px 32px;background:#3483FA;color:#FFF;text-decoration:none;border-radius:6px;font-size:14px;font-weight:700;">
              Acessar o sistema
            </a>
          </td>
        </tr>
      `),
    });

    console.log('✉️ Email de cadastro enviado para', email);
    if (!process.env.SMTP_HOST) {
      console.log('🔗 Visualizar em:', nodemailer.getTestMessageUrl(info));
    }
  } catch (err) {
    console.error('Erro ao enviar email de cadastro:', err.message);
  }
}

async function sendNewAdEmail(email, name, ad) {
  try {
    const t = await getTransport();
    const now = new Date().toLocaleString('pt-BR');

    const info = await t.sendMail({
      from: fromName(),
      to: email,
      subject: `Anúncio publicado: ${ad.title}`,
      html: wrapHtml(`
        <tr>
          <td style="padding:8px 32px 24px;text-align:center;">
            <div style="width:56px;height:56px;border-radius:50%;background:#E7F0FF;display:flex;align-items:center;justify-content:center;margin:0 auto;">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3483FA" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="12" y1="8" x2="12" y2="16"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
            </div>
            <h1 style="font-size:22px;font-weight:700;color:#333;margin:16px 0 4px;">Anúncio publicado!</h1>
            <p style="font-size:14px;color:#666;margin:0;">Olá <strong>${name}</strong>, seu anúncio já está no ar.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E0E0E0;border-radius:6px;overflow:hidden;">
              ${ad.image ? `
              <tr>
                <td style="padding:16px;text-align:center;background:#F5F5F5;">
                  <img src="${ad.image}" alt="${ad.title}" style="max-width:200px;max-height:120px;border-radius:4px;">
                </td>
              </tr>` : ''}
              <tr>
                <td style="padding:16px 20px;">
                  <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#333;">${ad.title}</p>
                  <p style="margin:0 0 4px;font-size:20px;font-weight:700;color:#333;">${formatPrice(ad.price)}</p>
                  <p style="margin:0;font-size:13px;color:#666;">Estoque: ${ad.available_quantity} unidade${ad.available_quantity !== 1 ? 's' : ''}</p>
                  <p style="margin:8px 0 0;font-size:12px;color:#999;">ID: ${ad.ml_id} • ${now}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 32px;text-align:center;">
            <a href="https://desafio-dev-two.vercel.app/dashboard"
               style="display:inline-block;padding:12px 32px;background:#3483FA;color:#FFF;text-decoration:none;border-radius:6px;font-size:14px;font-weight:700;">
              Ver na plataforma
            </a>
          </td>
        </tr>
      `),
    });

    console.log('✉️ Email de novo anúncio enviado para', email);
    if (!process.env.SMTP_HOST) {
      console.log('🔗 Visualizar em:', nodemailer.getTestMessageUrl(info));
    }
  } catch (err) {
    console.error('Erro ao enviar email de novo anúncio:', err.message);
  }
}

module.exports = { sendWelcomeEmail, sendNewAdEmail };
