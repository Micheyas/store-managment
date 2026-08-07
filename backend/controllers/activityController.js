const { ActivityLog, User } = require('../models');

// Middleware helper — call this inside other controllers to log actions
exports.log = async ({ userId, action, entity, entityId, detail, ip }) => {
  try {
    await ActivityLog.create({ userId, action, entity, entityId, detail, ip });
  } catch (_) {} // never block main flow
};

// GET /api/activity
exports.getAll = async (req, res) => {
  try {
    const { userId, action, page = 1, limit = 100 } = req.query;
    const where = {};
    if (userId) where.userId = userId;
    if (action) where.action = action;
    const { count, rows } = await ActivityLog.findAndCountAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['id','name','role'] }],
      order: [['createdAt','DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });
    res.json({ logs: rows, total: count });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
