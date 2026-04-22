const express = require('express');
const QRCode = require('qrcode');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: './sessions'
  }),
  puppeteer: {
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--single-process',
      '--no-zygote'
    ]
  }
});

client.on('qr', async (qr) => {
  console.clear();
  console.log('Escaneá este QR desde WhatsApp:');
  qrcode.generate(qr, { small: true });

  try {
    const qrImage = await QRCode.toDataURL(qr);
    io.emit('qr', qrImage);
  } catch (error) {
    console.error('Error generando el QR:', error);
  }
});

client.on('authenticated', () => {
  console.log('WhatsApp autenticado correctamente');
});

client.on('ready', () => {
  console.log('WhatsApp conectado y listo');
  io.emit('ready');
});

client.on('auth_failure', (msg) => {
  console.error('Error de autenticación:', msg);
});

client.on('disconnected', (reason) => {
  console.log('WhatsApp desconectado:', reason);
});

client.on('message', async (message) => {
  const texto = message.body.toLowerCase().trim();

  console.log(`Mensaje recibido de ${message.from}: ${message.body}`);

  try {
    if (texto === 'hola') {
      await message.reply('👋 Hola, gracias por comunicarte con Amaia Digital. ¿En qué podemos ayudarte?');
    }

    if (texto.includes('precio')) {
      await message.reply('💲 Nuestros precios son personalizados. Decinos qué necesitás y te enviamos una propuesta.');
    }

    if (texto.includes('web')) {
      await message.reply('🌐 Creamos páginas web, tiendas online y landing pages profesionales.');
    }

    if (texto.includes('whatsapp')) {
      await message.reply('🤖 Podemos automatizar tu WhatsApp con respuestas automáticas y QR de conexión.');
    }
  } catch (error) {
    console.error('Error respondiendo mensaje:', error);
  }
});

io.on('connection', (socket) => {

