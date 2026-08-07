const { Stock, StockMovement, Product, Branch, sequelize } = require('../models');
const { Op } = require('sequelize');

// Get stock for a branch
exports.getBranchStock = async (req, res) => {
  try {
    const branchId = req.params.branchId || req.query.branchId || req.user.branchId;
    const { lowStock, search } = req.query;

    let productWhere = { isActive: true };
    if (search) productWhere.name = { [Op.iLike]: `%${search}%` };

    const stock = await Stock.findAll({
      where: { branchId },
      include: [{ model: Product, as: 'product', where: productWhere }],
      order: [[{ model: Product, as: 'product' }, 'name', 'ASC']],
    });

    const result = lowStock === 'true'
      ? stock.filter(s => parseFloat(s.quantity) <= parseFloat(s.lowStockThreshold))
      : stock;

    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// Adjust stock (in/out/adjustment)
exports.adjustStock = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { productId, branchId, type, quantity, note } = req.body;
    if (!productId || !branchId || !type || !quantity) {
      return res.status(400).json({ error: 'productId, branchId, type, quantity required' });
    }

    const qty = parseFloat(quantity);
    const [stock] = await Stock.findOrCreate({
      where: { productId, branchId },
      defaults: { quantity: 0, lowStockThreshold: 10 },
      transaction: t,
    });

    const before = parseFloat(stock.quantity);
    let after = before;

    if (type === 'in' || type === 'purchase' || type === 'transfer_in') {
      after = before + qty;
    } else if (type === 'out' || type === 'sale' || type === 'transfer_out') {
      if (before < qty) {
        await t.rollback();
        return res.status(400).json({ error: `Insufficient stock. Available: ${before}` });
      }
      after = before - qty;
    } else if (type === 'adjustment') {
      after = qty; // direct set
    }

    await stock.update({ quantity: after }, { transaction: t });

    await StockMovement.create({
      productId, branchId, type, quantity: qty,
      balanceBefore: before, balanceAfter: after,
      note, userId: req.user.id,
    }, { transaction: t });

    await t.commit();
    res.json({ message: 'Stock updated', stock, before, after });
  } catch (e) {
    await t.rollback();
    res.status(500).json({ error: e.message });
  }
};

// Transfer stock between branches
exports.transferStock = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { productId, fromBranchId, toBranchId, quantity, note } = req.body;
    const qty = parseFloat(quantity);

    const fromStock = await Stock.findOne({ where: { productId, branchId: fromBranchId }, transaction: t });
    if (!fromStock || parseFloat(fromStock.quantity) < qty) {
      await t.rollback();
      return res.status(400).json({ error: 'Insufficient stock in source branch' });
    }

    const before = parseFloat(fromStock.quantity);
    await fromStock.update({ quantity: before - qty }, { transaction: t });
    await StockMovement.create({
      productId, branchId: fromBranchId, type: 'transfer_out', quantity: qty,
      balanceBefore: before, balanceAfter: before - qty,
      note: note || `Transfer to branch ${toBranchId}`, userId: req.user.id,
    }, { transaction: t });

    const [toStock] = await Stock.findOrCreate({
      where: { productId, branchId: toBranchId },
      defaults: { quantity: 0, lowStockThreshold: 10 },
      transaction: t,
    });
    const toBefore = parseFloat(toStock.quantity);
    await toStock.update({ quantity: toBefore + qty }, { transaction: t });
    await StockMovement.create({
      productId, branchId: toBranchId, type: 'transfer_in', quantity: qty,
      balanceBefore: toBefore, balanceAfter: toBefore + qty,
      note: note || `Transfer from branch ${fromBranchId}`, userId: req.user.id,
    }, { transaction: t });

    await t.commit();
    res.json({ message: 'Transfer successful' });
  } catch (e) {
    await t.rollback();
    res.status(500).json({ error: e.message });
  }
};

// Movement history
exports.getMovements = async (req, res) => {
  try {
    const { branchId, productId, type, dateFrom, dateTo, page = 1, limit = 50 } = req.query;
    const where = {};
    if (branchId) where.branchId = branchId;
    else if (req.user.role !== 'owner') where.branchId = req.user.branchId;
    if (productId) where.productId = productId;
    if (type) where.type = type;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt[Op.gte] = new Date(dateFrom);
      if (dateTo)   where.createdAt[Op.lte] = new Date(dateTo + 'T23:59:59');
    }

    const { count, rows } = await StockMovement.findAndCountAll({
      where,
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name', 'sku', 'unit'] },
        { model: Branch,  as: 'branch',  attributes: ['id', 'name'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });
    res.json({ movements: rows, total: count });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// Low stock alerts across all branches (owner) or one branch
exports.getLowStock = async (req, res) => {
  try {
    const where = req.user.role === 'owner' ? {} : { branchId: req.user.branchId };

    // Fetch all active stock entries then filter in JS — avoids column-vs-column SQL issues
    const stock = await Stock.findAll({
      where,
      include: [
        { model: Product, as: 'product', where: { isActive: true }, required: true },
        { model: Branch,  as: 'branch',  attributes: ['id', 'name'] },
      ],
      order: [['quantity', 'ASC']],
    });

    const lowStock = stock.filter(s =>
      parseFloat(s.quantity) <= parseFloat(s.lowStockThreshold || 10)
    );

    res.json(lowStock);
  } catch (e) { res.status(500).json({ error: e.message }); }
};
