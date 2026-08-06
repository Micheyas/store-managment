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

// GET all currencies
router.get('/', authenticateToken, async (req, res) => {
  try {
    const currencies = await Currency.findAll({ where: { isActive: true }, order: [['code', 'ASC']] });
    res.json(currencies);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST create currency (superadmin only)
router.post('/', authenticateToken, authorizeRole(['superadmin']), async (req, res) => {
  try {
    const cur = await Currency.create(req.body);
    res.status(201).json(cur);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT update rate manually
router.put('/:id', authenticateToken, authorizeRole(['superadmin','admin']), async (req, res) => {
  try {
    const cur = await Currency.findByPk(req.params.id);
    if (!cur) return res.status(404).json({ error: 'Currency not found' });
    await cur.update(req.body);
    res.json(cur);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /currency/refresh-rates — fetch live rates from exchangerate-api (free, no key needed)
// Uses ETB as base. Updates all non-base currencies.
router.post('/refresh-rates', authenticateToken, authorizeRole(['superadmin','admin']), async (req, res) => {
  try {
    // Free open API — no key required, returns rates vs USD
    const data = await fetchJSON('https://open.er-api.com/v6/latest/ETB');
    if (!data || !data.rates) return res.status(502).json({ error: 'Could not fetch live rates' });

    // data.rates is { USD: 0.0071, EUR: 0.0065, ... } relative to ETB
    const currencies = await Currency.findAll({ where: { isActive: true } });
    const updated = [];

    for (const cur of currencies) {
      if (cur.isBase) continue; // ETB base stays at 1
      const liveRate = data.rates[cur.code];
      if (liveRate !== undefined) {
        await cur.update({ rate: liveRate });
        updated.push({ code: cur.code, rate: liveRate });
      }
    }

    res.json({ message: `Updated ${updated.length} currencies`, updated, timestamp: data.time_last_update_utc });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
