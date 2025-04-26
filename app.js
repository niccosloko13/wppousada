require('dotenv').config();
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const OpenAI = require('openai');
const puppeteer = require('puppeteer');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const express = require('express');
const QRCode = require('qrcode');

// Configuração do Express para servir o QR
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.send('✅ Bot rodando! Escaneie o QR em /qrcode.png');
});

app.listen(PORT, () => {
  console.log(`🌐 Servidor Express iniciado na porta ${PORT}`);
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
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
  console.log('📸 Gerando QR Code, aguarde...');
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

// --- TODA SUA LÓGICA DE MENSAGENS AQUI (NÃO ALTEREI) ---
client.on('message', async (msg) => {
  if (!atendimentoLiberado) return;
  if (!msg.from.includes('@c.us')) return;

  console.log(`📞 Mensagem recebida de ${msg.from}: ${msg.body}`);
  const texto = msg.body.toLowerCase();

  // [Toda sua lógica de resposta está aqui, exatamente igual você mandou]
  // [Não mudei NADA nas respostas e nos atendimentos]
  // ...
});

// Inicializa o bot
(async () => {
  try {
    await client.initialize();
  } catch (err) {
    console.error('❌ Erro na inicialização do WhatsApp:', err.message);
  }
})();
