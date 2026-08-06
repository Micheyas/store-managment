const router = require('express').Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { Currency } = require('../models');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const currencies = await Currency.findAll({ where: { isActive: true }, order: [['code', 'ASC']] });
    res.json(currencies);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', authenticateToken, authorizeRole(['superadmin']), async (req, res) => {
  try {
    const cur = await Currency.create(req.body);
    res.status(201).json(cur);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', authenticateToken, authorizeRole(['superadmin','admin']), async (req, res) => {
  try {
    const cur = await Currency.findByPk(req.params.id);
    if (!cur) return res.status(404).json({ error: 'Currency not found' });
    await cur.update(req.body);
    res.json(cur);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
