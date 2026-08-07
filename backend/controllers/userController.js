const bcrypt = require('bcryptjs');
const { User, Branch } = require('../models');

exports.getAll = async (req, res) => {
  try {
    const where = {};
    // non-superadmin can only see users of their branch
    if (req.user.role !== 'owner') where.branchId = req.user.branchId;
    const users = await User.findAll({
      where,
      attributes: { exclude: ['password'] },
      include: [{ model: Branch, as: 'branch', attributes: ['id', 'name'] }],
      order: [['name', 'ASC']],
    });
    res.json(users);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.create = async (req, res) => {
  try {
    const { name, email, password, role, branchId } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'name, email and password required' });
    const existing = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existing) return res.status(400).json({ error: 'Email already in use' });
    const user = await User.create({
      name, email: email.toLowerCase(), password: await bcrypt.hash(password, 10),
      role: role || 'cashier', branchId: branchId || req.user.branchId,
    });
    const { password: _, ...safe } = user.toJSON();
    res.status(201).json(safe);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.update = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { password, ...rest } = req.body;
    if (password) rest.password = await bcrypt.hash(password, 10);
    await user.update(rest);
    const { password: _, ...safe } = user.toJSON();
    res.json(safe);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.remove = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.id === req.user.id) return res.status(400).json({ error: 'Cannot deactivate yourself' });
    await user.update({ isActive: false });
    res.json({ message: 'User deactivated' });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
