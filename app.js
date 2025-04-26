require('dotenv').config();
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const axios = require('axios');
const puppeteer = require('puppeteer');
const { executablePath } = require('puppeteer');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const express = require('express');
const QRCode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.send('✅ Bot rodando! Acesse /qrcode.png para escanear.');
});

app.listen(PORT, () => {
  console.log(`🌐 Servidor Express rodando na porta ${PORT}`);
});

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    executablePath: executablePath(),
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ]
  }
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let atendimentoLiberado = false;
const modoFechamento = new Map();

const palavrasDeFoto = ["foto", "fotos", "ver fotos", "ver a pousada", "quero ver", "mostrar", "imagem", "mostrar lugar", "ver como é"];
const palavrasLocalizacao = ["localização", "onde fica", "como chegar", "mapa", "endereço"];
const saudacoes = ["oi", "olá", "boa tarde", "boa noite", "bom dia"];
const respostaDeDuvida = ["vou ver", "ainda não", "vou pensar", "depois vejo", "ver com meu esposo", "ver com minha esposa", "ver certinho"];

if (!fs.existsSync('./public')) {
  fs.mkdirSync('./public');
}

client.on('qr', async (qr) => {
  console.log('📸 Gerando QR Code...');
  try {
    await QRCode.toFile('./public/qrcode.png', qr, {
      color: {
        dark: '#000',
        light: '#FFF'
      }
    });
    console.log('✅ QR Code gerado! Acesse /qrcode.png para escanear.');
  } catch (error) {
    console.error('❌ Erro ao gerar QR Code:', error.message);
  }
});

client.on('ready', () => {
  console.log('✅ WhatsApp conectado!');
  rl.question('Pressione ENTER depois de escanear o QR Code para iniciar o atendimento: ', (input) => {
    atendimentoLiberado = true;
    console.log('🚀 Atendimento liberado! Aguardando mensagens dos clientes...');
  });
});

client.on('message', async (msg) => {
  if (!atendimentoLiberado) return;
  if (!msg.from.includes('@c.us')) return;

  console.log(`📞 Mensagem recebida de ${msg.from}: ${msg.body}`);

  const texto = msg.body.toLowerCase();

  if (texto.includes('pet') || texto.includes('animal') || texto.includes('cachorro') || texto.includes('gato')) {
    await msg.reply('🐾 Aceitamos pets de pequeno porte na pousada! 😄');
    return;
  }

  if (msg.hasMedia && msg.type === 'audio') {
    await msg.reply('📢 No momento não consigo ouvir áudios. Por favor, digite sua mensagem! 😄');
    return;
  }

  if (palavrasDeFoto.some(p => texto.includes(p))) {
    await msg.reply('📸 Claro! Vou te mandar algumas fotos da pousada! 😄');
    for (let i = 1; i <= 10; i++) {
      try {
        const media = MessageMedia.fromFilePath(`./pousada${i}.jpeg`);
        await client.sendMessage(msg.from, media);
      } catch (err) {
        console.error(`Erro ao enviar pousada${i}.jpeg:`, err.message);
      }
    }
    await msg.reply('✨ Veja mais no Instagram: https://www.instagram.com/pousadaparaisodaspedrinhas');
    return;
  }

  if (palavrasLocalizacao.some(p => texto.includes(p))) {
    await msg.reply('📍 Estamos na Ilha Comprida/SP, bairro Pedrinhas! 🌴 Mapa: https://maps.app.goo.gl/kk4wWxqcqm7cx5tm8');
    return;
  }

  if (saudacoes.some(p => texto.includes(p))) {
    await msg.reply('Oi! 👋 Seja bem-vindo(a) à Pousada Paraíso das Pedrinhas! 🏡✨');
    return;
  }

  if (respostaDeDuvida.some(p => texto.includes(p))) {
    await msg.reply('😄 Sem problema! Quando decidirem, estarei por aqui para garantir sua reserva! 🏡✨');
    return;
  }

  const respostaIA = await gerarRespostaDoCliente(texto);
  await msg.reply(respostaIA);
});

async function gerarRespostaDoCliente(texto) {
  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: texto }]
    }, {
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      }
    });

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('❌ Erro ao conversar com a IA:', error.response?.data || error.message);
    return "Desculpe, não entendi muito bem. Pode repetir, por favor?";
  }
}

(async () => {
  try {
    await client.initialize();
  } catch (err) {
    console.error('❌ Erro na inicialização do WhatsApp:', err.message);
  }
})();
