require('dotenv').config();
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const puppeteer = require('puppeteer');
const QRCode = require('qrcode');
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Servir arquivos da pasta public
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.send('Bot da Pousada rodando! Escaneie o QR code em /qrcode.png');
});

app.listen(PORT, () => {
  console.log(`🌐 Servidor Express rodando na porta ${PORT}`);
});

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

let atendimentoLiberado = false;

// Criar pasta public se não existir
if (!fs.existsSync('./public')) {
  fs.mkdirSync('./public');
}

client.on('qr', async (qr) => {
  console.log('📸 Gerando QR Code, aguarde...');

  await QRCode.toFile('./public/qrcode.png', qr, {
    color: {
      dark: '#000',
      light: '#FFF'
    }
  });

  console.log('✅ QR Code gerado! Abra: /qrcode.png no navegador!');
});

client.on('ready', () => {
  console.log('✅ WhatsApp conectado e pronto para atendimento!');
  atendimentoLiberado = true;
});

client.on('message', async (msg) => {
  if (!atendimentoLiberado || !msg.from.includes('@c.us')) return;

  const texto = msg.body.toLowerCase();
  console.log(`📞 Mensagem de ${msg.from}: ${texto}`);

  if (texto.includes('foto')) {
    await msg.reply('📸 Te envio fotos da pousada agora!');
    // (Aqui seu código de envio das fotos pousada1.jpeg até pousada10.jpeg)
    return;
  }

  if (texto.includes('localização') || texto.includes('onde fica')) {
    await msg.reply('📍 Estamos na Ilha Comprida/SP, bairro Pedrinhas! 🌴 Veja o mapa: https://maps.app.goo.gl/kk4wWxqcqm7cx5tm8');
    return;
  }

  if (texto.includes('valor') || texto.includes('preço') || texto.includes('diária')) {
    await msg.reply('🏡 Diária adultos: R$125 | Crianças (8 a 12 anos): R$70. Incluso: café da manhã, ar-condicionado, TV Smart, frigobar, mini cozinha e banheiro privativo.');
    return;
  }

  await msg.reply('😄 Estou aqui para te ajudar! Pergunte sobre reservas, localização ou fotos!');
});

(async () => {
  try {
    await client.initialize();
  } catch (err) {
    console.error('❌ Erro na inicialização do WhatsApp:', err.message);
  }
})();
