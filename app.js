require('dotenv').config();
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { executablePath } = require('puppeteer');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

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

const esperar = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let atendimentoLiberado = false;
const bufferMensagens = {};
const delayResposta = 4000;

client.on('qr', qr => {
  console.log('📸 Escaneie o QR Code abaixo para conectar no WhatsApp:');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('✅ WhatsApp conectado e pronto!');
  atendimentoLiberado = true;
});

client.on('message', async (msg) => {
  if (!atendimentoLiberado || !msg.from.includes('@c.us')) return;

  const cliente = msg.from;
  const textoCorrigido = corrigirTexto(msg.body.toLowerCase());

  console.log(`📞 [${cliente}] -> ${textoCorrigido}`);

  if (!bufferMensagens[cliente]) {
    bufferMensagens[cliente] = [];
  }
  bufferMensagens[cliente].push(textoCorrigido);

  setTimeout(async () => {
    const mensagensCliente = bufferMensagens[cliente] || [];
    const textoCompleto = mensagensCliente.join(' ').trim();
    bufferMensagens[cliente] = [];

    if (!textoCompleto) return;
    const chat = await msg.getChat();

    const simularDigitando = async (tempo = 2000) => {
      await chat.sendStateTyping();
      await esperar(tempo);
      await chat.clearState();
    };

    const enviarMensagem = async (mensagem) => {
      const partes = mensagem.match(/(.|[\r\n]){1,380}/g);
      for (const parte of partes) {
        await simularDigitando(1800);
        await msg.reply(parte.trim());
        await esperar(1500);
      }
    };

    if (textoCompleto.includes('pet') || textoCompleto.includes('animal') || textoCompleto.includes('cachorro') || textoCompleto.includes('gato')) {
      await simularDigitando(1800);
      await msg.reply('🐾 Aceitamos pets de pequeno porte na pousada! 😄');
      return;
    }

    if (msg.hasMedia && msg.type === 'audio') {
      await simularDigitando(1500);
      await msg.reply('📢 Desculpe, no momento não consigo ouvir áudios. Poderia digitar sua mensagem, por favor? 😄');
      return;
    }

    if (textoCompleto.includes('foto') || textoCompleto.includes('fotos') || textoCompleto.includes('imagem')) {
      await simularDigitando(2000);
      await msg.reply('📸 Claro! Vou te mandar algumas fotos da pousada! 😄');
      for (let i = 1; i <= 10; i++) {
        try {
          await esperar(700);
          const media = MessageMedia.fromFilePath(`./pousada${i}.jpeg`);
          await client.sendMessage(msg.from, media);
        } catch (err) {
          console.error(`Erro ao enviar pousada${i}.jpeg:`, err.message);
        }
      }
      await simularDigitando(2000);
      await msg.reply('✨ Mais fotos no Instagram: https://www.instagram.com/pousadaparaisodaspedrinhas');
      return;
    }

    if (textoCompleto.includes('localização') || textoCompleto.includes('onde fica') || textoCompleto.includes('como chegar') || textoCompleto.includes('mapa')) {
      await simularDigitando(1800);
      await msg.reply('📍 Estamos na Ilha Comprida/SP, bairro Pedrinhas! 🌴 Aqui está o mapa: https://maps.app.goo.gl/kk4wWxqcqm7cx5tm8');
      return;
    }

    if (textoCompleto.includes('vaga') || textoCompleto.includes('disponível') || textoCompleto.includes('disponibilidade')) {
      await simularDigitando(1800);
      await msg.reply('😄 Vamos verificar a disponibilidade!\n\nPode me confirmar:\n- Data de entrada e saída\n- Quantos adultos e crianças virão? 🏡✨');
      return;
    }

    if (textoCompleto.includes('quanto') || textoCompleto.includes('valor') || textoCompleto.includes('preço') || textoCompleto.includes('diária')) {
      await simularDigitando(1800);
      await msg.reply('🏡 Diária adultos: R$125\nCrianças (8-12 anos): R$70\nIncluso: café da manhã, ar-condicionado, TV Smart, frigobar, mini cozinha equipada e banheiro privativo.\n\nQuer que eu reserve pra você? 😄🏡');
      return;
    }

    if (textoCompleto.includes('vou ver') || textoCompleto.includes('depois vejo') || textoCompleto.includes('não sei ainda') || textoCompleto.includes('talvez')) {
      await simularDigitando(1800);
      await msg.reply('😄 Sem problema! Quando decidir, estarei aqui para garantir sua reserva! 🏡✨');
      return;
    }

    if (textoCompleto.includes('oi') || textoCompleto.includes('olá') || textoCompleto.includes('bom dia') || textoCompleto.includes('boa tarde') || textoCompleto.includes('boa noite')) {
      await simularDigitando(1500);
      await msg.reply('Oi! 👋 Seja bem-vindo(a) à Pousada Paraíso das Pedrinhas! 🏡✨ Posso te ajudar a encontrar a melhor data para sua estadia? 😄');
      return;
    }

    await simularDigitando(1800);
    await msg.reply('😅 Desculpe, não entendi direitinho. Pode repetir, por favor? 🙏🏡');
  }, delayResposta);
});

function corrigirTexto(texto) {
  return texto
    .replace(/fotus|fottos|fottus|fotis/gi, 'fotos')
    .replace(/pouzada|posada/gi, 'pousada')
    .replace(/diaria|diárias/gi, 'diária')
    .replace(/fik|fica|fikr/gi, 'fica')
    .replace(/keru|ker|quero/gi, 'quero')
    .replace(/be|ve|vê/gi, 'ver')
    .replace(/localisacao|localização|locau/gi, 'localização');
}

(async () => {
  try {
    await client.initialize();
  } catch (err) {
    console.error('❌ Erro na inicialização do WhatsApp:', err.message);
  }
})();
