const { Branch, User } = require('../models');

exports.getAll = async (req, res) => {
  try {
    const branches = await Branch.findAll({ order: [['name', 'ASC']] });
    res.json(branches);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.getOne = async (req, res) => {
  try {
    const branch = await Branch.findByPk(req.params.id);
    if (!branch) return res.status(404).json({ error: 'Branch not found' });
    res.json(branch);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.create = async (req, res) => {
  try {
    const { name, location, phone, email } = req.body;
    if (!name) return res.status(400).json({ error: 'Branch name is required' });
    const branch = await Branch.create({ name, location, phone, email });
    res.status(201).json(branch);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.update = async (req, res) => {
  try {
    const branch = await Branch.findByPk(req.params.id);
    if (!branch) return res.status(404).json({ error: 'Branch not found' });
    await branch.update(req.body);
    res.json(branch);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.remove = async (req, res) => {
  try {
    const branch = await Branch.findByPk(req.params.id);
    if (!branch) return res.status(404).json({ error: 'Branch not found' });
    await branch.update({ isActive: false });
    res.json({ message: 'Branch deactivated' });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
