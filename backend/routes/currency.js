const router  = require('express').Router();
const https   = require('https');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { Currency } = require('../models');

// Helper: fetch JSON from a URL
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { reject(e); } });
    }).on('error', reject);
  });
}

// Shared auto-refresh function — called on startup and every 6 hours
async function refreshRates(silent = false) {
  try {
    const data = await fetchJSON('https://open.er-api.com/v6/latest/ETB');
    if (!data || !data.rates) { if (!silent) console.warn('⚠️ Currency API returned no rates'); return null; }

    const currencies = await Currency.findAll({ where: { isActive: true } });
    const updated = [];
    for (const cur of currencies) {
      if (cur.isBase) continue;
      const liveRate = data.rates[cur.code];
      if (liveRate !== undefined) {
        await cur.update({ rate: liveRate, updatedAt: new Date() });
        updated.push({ code: cur.code, rate: liveRate });
      }
    }
    if (!silent) console.log(`✅ Exchange rates refreshed: ${updated.map(u=>u.code).join(', ')} — ${data.time_last_update_utc}`);
    return { updated, timestamp: data.time_last_update_utc };
  } catch (e) {
    if (!silent) console.warn('⚠️ Currency auto-refresh failed:', e.message);
    return null;
  }
}

module.exports.refreshRates = refreshRates;

// GET all currencies
router.get('/', authenticateToken, async (req, res) => {
  try {
    const currencies = await Currency.findAll({ where: { isActive: true }, order: [['code', 'ASC']] });
    res.json(currencies);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST create currency (owner only)
router.post('/', authenticateToken, authorizeRole(['owner']), async (req, res) => {
  try {
    const cur = await Currency.create(req.body);
    res.status(201).json(cur);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT update rate manually
router.put('/:id', authenticateToken, authorizeRole(['owner','manager']), async (req, res) => {
  try {
    const cur = await Currency.findByPk(req.params.id);
    if (!cur) return res.status(404).json({ error: 'Currency not found' });
    await cur.update(req.body);
    res.json(cur);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /currency/refresh-rates — manual trigger (owner/manager can still force refresh)
router.post('/refresh-rates', authenticateToken, authorizeRole(['owner','manager']), async (req, res) => {
  try {
    const result = await refreshRates(false);
    if (!result) return res.status(502).json({ error: 'Could not fetch live rates' });
    res.json({ message: `Updated ${result.updated.length} currencies`, ...result });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
module.exports.refreshRates = refreshRates;
