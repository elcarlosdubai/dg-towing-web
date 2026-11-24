module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = req.query.action || 'status';
  const baseUrl = (req.query.baseUrl || process.env.WA_SERVER_URL || 'https://wa.dgtowingllc.com').replace(/\/$/, '');

  try {
    if (action === 'send' && req.method === 'POST') {
      const upstream = await fetch(`${baseUrl}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body || {})
      });
      const data = await upstream.json();
      return res.status(upstream.status).json(data);
    }

    const endpoint = action === 'qr' ? '/qr' : '/status';
    const upstream = await fetch(`${baseUrl}${endpoint}`);
    const data = await upstream.json();
    return res.status(upstream.status).json(data);
  } catch (err) {
    return res.status(502).json({ error: 'No se pudo conectar con el servidor Baileys', details: err.message });
  }
};
