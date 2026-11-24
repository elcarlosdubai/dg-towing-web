const express = require('express');
const cors = require('cors');
const pino = require('pino');
const QRCode = require('qrcode');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require('@whiskeysockets/baileys');

const app = express();
app.use(cors());
app.use(express.json());

let sock = null;
let latestQR = null;
let isConnected = false;

async function startBaileys() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info');

  sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: true
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      latestQR = await QRCode.toDataURL(qr);
      isConnected = false;
    }
    if (connection === 'open') {
      isConnected = true;
      latestQR = null;
      console.log('✓ WhatsApp Baileys conectado para DG Towing LLC');
    }
    if (connection === 'close') {
      isConnected = false;
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) {
        setTimeout(startBaileys, 3000);
      }
    }
  });
}

// Endpoint que consulta el botón "WA QR" en /admin
app.get('/qr', (req, res) => {
  res.json({
    connected: isConnected,
    qrImage: latestQR
  });
});

// Endpoint que dispara mensajes desde /admin
app.post('/send', async (req, res) => {
  if (!isConnected || !sock) {
    return res.status(503).json({ error: 'WhatsApp no conectado. Escanea el QR primero.' });
  }
  const { number, message } = req.body || {};
  if (!number || !message) {
    return res.status(400).json({ error: 'Falta number o message.' });
  }
  const clean = String(number).replace(/\D/g, '');
  const jid = `${clean}@s.whatsapp.net`;

  try {
    await sock.sendMessage(jid, { text: message });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Baileys server corriendo en http://localhost:${PORT}`);
  startBaileys();
});
