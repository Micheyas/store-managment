const { Category } = require('../models');

exports.getAll = async (req, res) => {
  try {
    const cats = await Category.findAll({ order: [['name', 'ASC']] });
    res.json(cats);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.create = async (req, res) => {
  try {
    const { name, description, color } = req.body;
    if (!name) return res.status(400).json({ error: 'Category name required' });
    const cat = await Category.create({ name, description, color });
    res.status(201).json(cat);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.update = async (req, res) => {
  try {
    const cat = await Category.findByPk(req.params.id);
    if (!cat) return res.status(404).json({ error: 'Category not found' });
    await cat.update(req.body);
    res.json(cat);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.remove = async (req, res) => {
  try {
    const cat = await Category.findByPk(req.params.id);
    if (!cat) return res.status(404).json({ error: 'Category not found' });
    await cat.destroy();
    res.json({ message: 'Category deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
