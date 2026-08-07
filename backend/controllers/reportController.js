const { Sale, SaleItem, Product, Branch, Stock, PurchaseOrder, sequelize } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

// Dashboard summary
exports.getDashboard = async (req, res) => {
  try {
    const branchId = req.user.role === 'owner' ? null : req.user.branchId;
    const where = branchId ? { branchId } : {};
    const today = new Date(); today.setHours(0,0,0,0);

    const [todaySales, totalSales, lowStockCount, pendingOrders] = await Promise.all([
      Sale.sum('totalAmount', { where: { ...where, status: 'completed', createdAt: { [Op.gte]: today } } }),
      Sale.count({ where: { ...where, status: 'completed' } }),
      Stock.count({ where: { ...where, quantity: { [Op.lte]: sequelize.col('lowStockThreshold') } } }),
      PurchaseOrder.count({ where: { ...where, status: { [Op.in]: ['draft','sent','partially_received'] } } }),
    ]);

    res.json({
      todayRevenue: todaySales || 0,
      totalSales,
      lowStockCount,
      pendingOrders,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// Sales report — daily/weekly/monthly
exports.getSalesReport = async (req, res) => {
  try {
    const { dateFrom, dateTo, branchId, groupBy = 'day' } = req.query;
    const where = { status: 'completed' };
    if (branchId) where.branchId = branchId;
    else if (req.user.role !== 'owner') where.branchId = req.user.branchId;
    if (dateFrom) where.createdAt = { [Op.gte]: new Date(dateFrom) };
    if (dateTo)   where.createdAt = { ...where.createdAt, [Op.lte]: new Date(dateTo + 'T23:59:59') };

    const truncFn = groupBy === 'month' ? 'month' : groupBy === 'week' ? 'week' : 'day';
    const sales = await Sale.findAll({
      where,
      attributes: [
        [fn('date_trunc', truncFn, col('createdAt')), 'period'],
        [fn('SUM', col('totalAmount')), 'revenue'],
        [fn('SUM', col('discount')), 'discount'],
        [fn('COUNT', col('id')), 'count'],
      ],
      group: [fn('date_trunc', truncFn, col('createdAt'))],
      order: [[fn('date_trunc', truncFn, col('createdAt')), 'ASC']],
    });
    res.json(sales);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// Top selling products
exports.getTopProducts = async (req, res) => {
  try {
    const { dateFrom, dateTo, branchId, limit = 10 } = req.query;
    const saleWhere = { status: 'completed' };
    if (branchId) saleWhere.branchId = branchId;
    else if (req.user.role !== 'owner') saleWhere.branchId = req.user.branchId;
    if (dateFrom) saleWhere.createdAt = { [Op.gte]: new Date(dateFrom) };
    if (dateTo)   saleWhere.createdAt = { ...saleWhere.createdAt, [Op.lte]: new Date(dateTo + 'T23:59:59') };

    const items = await SaleItem.findAll({
      attributes: [
        'productId',
        [fn('SUM', col('SaleItem.quantity')), 'totalQty'],
        [fn('SUM', col('SaleItem.subtotal')), 'totalRevenue'],
        [fn('COUNT', col('SaleItem.saleId')), 'saleCount'],
      ],
      include: [
        { model: Sale, as: 'sale', where: saleWhere, attributes: [] },
        { model: Product, as: 'product', attributes: ['id','name','sku','unit','sellingPrice','image'] },
      ],
      group: ['SaleItem.productId','product.id'],
      order: [[fn('SUM', col('SaleItem.subtotal')), 'DESC']],
      limit: parseInt(limit),
    });
    res.json(items);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// Profit/loss report
exports.getProfitLoss = async (req, res) => {
  try {
    const { dateFrom, dateTo, branchId } = req.query;
    const saleWhere = { status: 'completed' };
    if (branchId) saleWhere.branchId = branchId;
    else if (req.user.role !== 'owner') saleWhere.branchId = req.user.branchId;
    if (dateFrom) saleWhere.createdAt = { [Op.gte]: new Date(dateFrom) };
    if (dateTo)   saleWhere.createdAt = { ...saleWhere.createdAt, [Op.lte]: new Date(dateTo + 'T23:59:59') };

    const items = await SaleItem.findAll({
      include: [
        { model: Sale, as: 'sale', where: saleWhere, attributes: ['id','totalAmount','discount','tax','createdAt'] },
        { model: Product, as: 'product', attributes: ['id','name','costPrice','sellingPrice'] },
      ],
    });

    let totalRevenue = 0, totalCost = 0;
    for (const item of items) {
      totalRevenue += parseFloat(item.subtotal);
      totalCost += parseFloat(item.product.costPrice) * parseFloat(item.quantity);
    }

    res.json({
      revenue: totalRevenue,
      cost: totalCost,
      grossProfit: totalRevenue - totalCost,
      margin: totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue * 100).toFixed(2) : 0,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// Expense summary for profit/loss enrichment (owner only)
exports.getExpenseSummary = async (req, res) => {
  try {
    const { dateFrom, dateTo, branchId } = req.query;
    const { Expense } = require('../models');
    const { Op } = require('sequelize');
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
