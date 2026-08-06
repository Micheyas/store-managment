const { Supplier, PurchaseOrder } = require('../models');

exports.getAll = async (req, res) => {
  try {
    const suppliers = await Supplier.findAll({ where: { isActive: true }, order: [['name', 'ASC']] });
    res.json(suppliers);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.getOne = async (req, res) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id, {
      include: [{ model: PurchaseOrder, as: 'orders', limit: 10, order: [['createdAt', 'DESC']] }],
    });
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
    res.json(supplier);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.create = async (req, res) => {
  try {
    const { name, phone, email, address, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'Supplier name required' });
    const supplier = await Supplier.create({ name, phone, email, address, notes });
    res.status(201).json(supplier);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.update = async (req, res) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id);
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
    await supplier.update(req.body);
    res.json(supplier);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.remove = async (req, res) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id);
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
    await supplier.update({ isActive: false });
    res.json({ message: 'Supplier deactivated' });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
