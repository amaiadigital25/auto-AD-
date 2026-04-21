const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: './sessions'
  }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

client.on('qr', async (qr) => {
  console.clear();
  console.log('Escaneá este QR desde WhatsApp:');
  qrcode.generate(qr, { small: true });

  try {
    const qrBase64 = await QRCode.toDataURL(qr);
    io.emit('qr', qrBase64);
  } catch (err) {
    console.error('Error generando QR:', err);
  }
});

client.on('authenticated', () => {
  console.log('WhatsApp autenticado correctamente');
});

client.on('auth_failure', (msg) => {
  console.error('Error de autenticación:', msg);
});

client.on('ready', () => {
  console.log('WhatsApp conectado y listo');
  io.emit('ready');
});

client.on('disconnected', (reason) => {
  console.log('WhatsApp desconectado:', reason);
});

client.on('message', async (message) => {
  const texto = message.body.toLowerCase();

  console.log(`Mensaje recibido de ${message.from}: ${message.body}`);

  if (texto === 'hola') {
    await message.reply('👋 Hola, gracias por comunicarte con Amaia Digital. ¿En qué podemos ayudarte?');
  }

  if (texto.includes('precio')) {
    await message.reply('💲 Nuestros servicios son personalizados. Contanos qué necesitás y te enviamos un presupuesto.');
  }

  if (texto.includes('web')) {
    await message.reply('🌐 Creamos páginas web, tiendas online y automatizaciones para tu negocio.');
  }

  if (texto.includes('whatsapp')) {
    await message.reply('🤖 Podemos automatizar tu WhatsApp con respuestas automáticas y conexión por QR.');
  }
});

io.on('connection', (socket) => {
  console.log('Usuario conectado al panel web');

  socket.on('send-message', async (data) => {
    try {
      const numero = data.numero.replace(/\D/g, '');
      const chatId = `${numero}@c.us`;

      await client.sendMessage(chatId, data.mensaje);

      socket.emit('message-status', {
        ok: true,
        mensaje: 'Mensaje enviado correctamente'
      });
    } catch (err) {
      console.error(err);

      socket.emit('message-status', {
        ok: false,
        mensaje: 'No se pudo enviar el mensaje'
      });
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});

client.initialize();
