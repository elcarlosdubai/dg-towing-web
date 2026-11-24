const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const pino = require('pino');
const QRCode = require('qrcode');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
  DisconnectReason,
  Browsers
} = require('@whiskeysockets/baileys');

const app = express();
app.use(cors());
app.use(express.json());

const AUTH_DIR = path.join(__dirname, 'auth_info_baileys');
const logger = pino({ level: 'silent' });

let sock = null;
let latestQR = null;
let connectionState = 'connecting'; // connecting | qr_ready | open | close
let connectedLine = null;
let isStartingBaileys = false;

// Cache Signal anti-errores ("Waiting for this message...") — últimos 500 mensajes
const sentMessagesCache = new Map();
function cacheSentMessage(keyId, messageObj) {
  if (!keyId) return;
  sentMessagesCache.set(keyId, messageObj);
  if (sentMessagesCache.size > 500) {
    const firstKey = sentMessagesCache.keys().next().value;
    sentMessagesCache.delete(firstKey);
  }
}

// Mutex Global: garantiza que jamás salgan 2 mensajes simultáneos
let waMutexQueue = Promise.resolve();
function enqueueWA(fn) {
  const run = waMutexQueue.then(fn, fn);
  waMutexQueue = run.catch(() => {});
  return run;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Spintax: {opción1|opción2|opción3}
function resolveSpintax(text) {
  return String(text || '').replace(/\{([^{}]+)\}/g, (_, opts) => {
    const parts = opts.split('|');
    return parts[Math.floor(Math.random() * parts.length)];
  });
}

// Normalización JID USA (sin sock.onWhatsApp para evitar huella de scraping)
function formatWhatsAppJid(raw) {
  let digits = String(raw || '').replace(/\D/g, '');
  if (digits.length === 10) digits = `1${digits}`;
  return `${digits}@s.whatsapp.net`;
}

// Envío Humanizado: Mutex + Spintax + Composing + Paused + Cache Signal
async function sendWhatsAppMessage(rawNumber, rawText) {
  return enqueueWA(async () => {
    if (connectionState !== 'open' || !sock) {
      throw new Error('WhatsApp no está conectado (escanea el QR primero).');
    }

    const jid = formatWhatsAppJid(rawNumber);
    const text = resolveSpintax(rawText);

    // Simulación de escritura humana proporcional al largo del texto
    try {
      await sock.sendPresenceUpdate('composing', jid);
    } catch (_) {}

    const typingMs = Math.min(6500, Math.max(2200, text.length * 25)) + rand(400, 1100);
    await sleep(typingMs);

    try {
      await sock.sendPresenceUpdate('paused', jid);
    } catch (_) {}
    await sleep(rand(400, 850));

    const sent = await sock.sendMessage(jid, { text });
    if (sent?.key?.id && sent?.message) {
      cacheSentMessage(sent.key.id, sent.message);
    }
    return sent;
  });
}

async function startBaileys() {
  if (isStartingBaileys) return;
  isStartingBaileys = true;

  try {
    if (sock) {
      try { sock.ev.removeAllListeners(); } catch (_) {}
      try { sock.end(); } catch (_) {}
      sock = null;
    }

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

    sock = makeWASocket({
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger)
      },
      browser: Browsers.macOS('Desktop'),
      logger,
      syncFullHistory: false,
      markOnlineOnConnect: false,
      printQRInTerminal: true,
      getMessage: async (key) => {
        if (key?.id && sentMessagesCache.has(key.id)) {
          return sentMessagesCache.get(key.id);
        }
        return undefined;
      }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        latestQR = await QRCode.toDataURL(qr);
        connectionState = 'qr_ready';
        connectedLine = null;
      }

      if (connection === 'open') {
        connectionState = 'open';
        latestQR = null;
        connectedLine = sock.user?.id ? `+${sock.user.id.split(':')[0]}` : 'Connected';
        console.log(`✓ DG Towing Baileys conectado (${connectedLine})`);
      }

      if (connection === 'close') {
        connectionState = 'close';
        connectedLine = null;
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const loggedOut = statusCode === DisconnectReason.loggedOut;

        if (loggedOut) {
          console.log('Sesión cerrada. Limpiando auth_info_baileys y generando nuevo QR...');
          try { fs.rmSync(AUTH_DIR, { recursive: true, force: true }); } catch (_) {}
          setTimeout(startBaileys, 3000);
        } else {
          setTimeout(startBaileys, 5000);
        }
      }
    });
  } finally {
    isStartingBaileys = false;
  }
}

// Estado en vivo (similar a wa.urenatax.com/status)
app.get('/status', (req, res) => {
  res.json({
    status: connectionState,
    connected: connectionState === 'open',
    line: connectedLine
  });
});

// Endpoint QR para /admin
app.get('/qr', (req, res) => {
  res.json({
    status: connectionState,
    connected: connectionState === 'open',
    line: connectedLine,
    qrImage: latestQR
  });
});

// Envío inmediato 1-a-1 (compatible con /send y /send-message)
async function handleSend(req, res) {
  const { number, message } = req.body || {};
  if (!number || !message) {
    return res.status(400).json({ error: 'Falta number o message.' });
  }
  try {
    const sent = await sendWhatsAppMessage(number, message);
    res.json({ ok: true, id: sent?.key?.id || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

app.post('/send', handleSend);
app.post('/send-message', handleSend);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`DG Towing Baileys API corriendo en puerto ${PORT}`);
  startBaileys();
});
