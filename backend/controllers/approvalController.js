const bcrypt = require('bcryptjs');
const { PendingAction, User, Branch } = require('../models');

// ── IT: Submit an action for approval ─────────────────────────────────────
exports.submit = async (req, res) => {
  try {
    const { type, payload } = req.body;
    const valid = ['create_user', 'update_user', 'reset_password', 'delete_user'];
    if (!valid.includes(type)) return res.status(400).json({ error: 'Invalid action type' });

    const action = await PendingAction.create({
      type, payload, submittedBy: req.user.id, status: 'pending',
    });
    res.status(201).json(action);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── IT: Get own pending actions ────────────────────────────────────────────
exports.myActions = async (req, res) => {
  try {
    const actions = await PendingAction.findAll({
      where: { submittedBy: req.user.id },
      include: [
        { model: User, as: 'reviewer', attributes: ['id', 'name'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(actions);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── Superadmin: Get all pending actions ────────────────────────────────────
exports.getAll = async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    const where = status === 'all' ? {} : { status };
    const actions = await PendingAction.findAll({
      where,
      include: [
        { model: User, as: 'submitter', attributes: ['id', 'name', 'email', 'role'] },
        { model: User, as: 'reviewer',  attributes: ['id', 'name'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(actions);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── Superadmin: Approve and instantly execute action ──────────────────────
exports.approve = async (req, res) => {
  try {
    const action = await PendingAction.findByPk(req.params.id);
    if (!action) return res.status(404).json({ error: 'Action not found' });
    if (action.status !== 'pending') return res.status(400).json({ error: `Action already ${action.status}` });

    const p = action.payload;
    let result = {};

    switch (action.type) {
      case 'create_user': {
        const existing = await User.findOne({ where: { email: p.email.toLowerCase() } });
        if (existing) {
          await action.update({ status: 'rejected', reviewedBy: req.user.id, reviewNote: 'Email already in use', reviewedAt: new Date() });
          return res.status(400).json({ error: 'Email already in use — action rejected' });
        }
        const user = await User.create({
          name: p.name, email: p.email.toLowerCase(),
          password: await bcrypt.hash(p.password, 10),
          role: p.role || 'cashier', branchId: p.branchId || null, isActive: true,
        });
        const { password: _, ...safe } = user.toJSON();
        result = safe;
        break;
      }
      case 'update_user': {
        const user = await User.findByPk(p.userId);
        if (!user) return res.status(404).json({ error: 'Target user not found' });
        const updates = {};
        if (p.name)  updates.name  = p.name;
        if (p.email) updates.email = p.email.toLowerCase();
        if (p.role)  updates.role  = p.role;
        if (p.branchId !== undefined) updates.branchId = p.branchId;
        await user.update(updates);
        const { password: _, ...safe } = user.toJSON();
        result = safe;
        break;
      }
      case 'reset_password': {
        const user = await User.findByPk(p.userId);
        if (!user) return res.status(404).json({ error: 'Target user not found' });
        await user.update({ password: await bcrypt.hash(p.newPassword, 10) });
        result = { message: `Password reset for ${user.name}` };
        break;
      }
      case 'delete_user': {
        const user = await User.findByPk(p.userId);
        if (!user) return res.status(404).json({ error: 'Target user not found' });
        await user.update({ isActive: false });
        result = { message: `User ${user.name} deactivated` };
        break;
      }
      default:
        return res.status(400).json({ error: 'Unknown action type' });
    }

    await action.update({
      status: 'approved', reviewedBy: req.user.id,
      reviewNote: req.body.note || null, reviewedAt: new Date(),
    });

    res.json({ message: 'Action approved and executed', result });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── Superadmin: Reject action ──────────────────────────────────────────────
exports.reject = async (req, res) => {
  try {
    const action = await PendingAction.findByPk(req.params.id);
    if (!action) return res.status(404).json({ error: 'Action not found' });
    if (action.status !== 'pending') return res.status(400).json({ error: `Action already ${action.status}` });

    await action.update({
      status: 'rejected', reviewedBy: req.user.id,
      reviewNote: req.body.note || null, reviewedAt: new Date(),
    });
    res.json({ message: 'Action rejected' });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── Pending count (for badge in navbar) ───────────────────────────────────
exports.pendingCount = async (req, res) => {
  try {
    const count = await PendingAction.count({ where: { status: 'pending' } });
    res.json({ count });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
