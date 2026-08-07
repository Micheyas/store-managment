const { Expense, User, Branch } = require('../models');
const { Op } = require('sequelize');

exports.getAll = async (req, res) => {
  try {
    const { branchId, dateFrom, dateTo, category, page = 1, limit = 50 } = req.query;
    const where = {};
    if (branchId) where.branchId = branchId;
    else if (req.user.role !== 'owner') where.branchId = req.user.branchId;
    if (category) where.category = category;
    if (dateFrom || dateTo) {
      where.expenseDate = {};
      if (dateFrom) where.expenseDate[Op.gte] = dateFrom;
      if (dateTo)   where.expenseDate[Op.lte] = dateTo;
    }
    const { count, rows } = await Expense.findAndCountAll({
      where,
      include: [
        { model: User,   as: 'recordedBy', attributes: ['id','name'] },
        { model: Branch, as: 'branch',     attributes: ['id','name'] },
      ],
      order: [['expenseDate','DESC'],['createdAt','DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });
    res.json({ expenses: rows, total: count });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.create = async (req, res) => {
  try {
    const { title, amount, category, paymentMethod, branchId, note, expenseDate } = req.body;
    if (!title || !amount) return res.status(400).json({ error: 'title and amount required' });
    const expense = await Expense.create({
      title, amount, category, paymentMethod,
      branchId: branchId || req.user.branchId,
      userId: req.user.id,
      note,
      expenseDate: expenseDate || new Date().toISOString().split('T')[0],
    });
    res.status(201).json(expense);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.update = async (req, res) => {
  try {
    const expense = await Expense.findByPk(req.params.id);
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    await expense.update(req.body);
    res.json(expense);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.remove = async (req, res) => {
  try {
    const expense = await Expense.findByPk(req.params.id);
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    await expense.destroy();
    res.json({ message: 'Expense deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.summary = async (req, res) => {
  try {
    const { dateFrom, dateTo, branchId } = req.query;
    const where = {};
    if (branchId) where.branchId = branchId;
    else if (req.user.role !== 'owner') where.branchId = req.user.branchId;
    if (dateFrom || dateTo) {
      where.expenseDate = {};
      if (dateFrom) where.expenseDate[Op.gte] = dateFrom;
      if (dateTo)   where.expenseDate[Op.lte] = dateTo;
    }
    const expenses = await Expense.findAll({ where });
    const total = expenses.reduce((s, e) => s + parseFloat(e.amount), 0);
    const byCategory = {};
    for (const e of expenses) {
      byCategory[e.category] = (byCategory[e.category] || 0) + parseFloat(e.amount);
    }
    res.json({ total, byCategory, count: expenses.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
