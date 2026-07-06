const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config();
const mongoose = require('mongoose');

async function connect() {
  let uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI ausente no .env');
  try {
    const url = new URL(uri);
    if (!uri.includes('%24')) url.password = encodeURIComponent(url.password);
    uri = url.toString();
  } catch {}
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 20000 });
  console.log('Conectado ao MongoDB Atlas');
}

async function main() {
  await connect();
  const User = require('./models/User');
  const Ad = require('./models/Ad');

  const userId = process.argv[2];
  const confirm = process.argv.includes('--confirm');

  if (!userId) {
    const users = await User.find({ name: { $regex: /daniel/i } }).select('name email ml_user_id');
    console.log(`\nUsuarios que casam com /daniel/i: ${users.length}`);
    for (const u of users) {
      const count = await Ad.countDocuments({ user: u._id });
      console.log(`- "${u.name}" | id=${u._id} | ml_user_id=${u.ml_user_id} | anuncios=${count}`);
    }
    console.log('\nPara apagar: node src/remove-daniel-ads.js <userId> --confirm');
    await mongoose.disconnect();
    return;
  }

  const user = await User.findById(userId).select('name');
  if (!user) { console.log('Usuario nao encontrado:', userId); await mongoose.disconnect(); return; }
  const ads = await Ad.find({ user: userId }).select('title ml_id');
  console.log(`\nUsuario: "${user.name}" (${userId})`);
  console.log(`Anuncios que serao apagados: ${ads.length}`);
  ads.forEach(a => console.log(`  * ${a.title} | ml_id=${a.ml_id}`));

  if (!confirm) {
    console.log('\n(dry-run — passe --confirm para apagar de verdade)');
    await mongoose.disconnect();
    return;
  }

  const result = await Ad.deleteMany({ user: userId });
  console.log(`\nApagados: ${result.deletedCount} anuncio(s).`);
  await mongoose.disconnect();
}

main().catch(err => { console.error('Erro:', err.message); process.exit(1); });
