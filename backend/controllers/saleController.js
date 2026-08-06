const { Sale, SaleItem, Product, Branch, User, Stock, StockMovement, sequelize } = require('../models');
const { Op } = require('sequelize');

const generateInvoice = () => `INV-${Date.now()}-${Math.floor(Math.random()*1000)}`;

exports.createSale = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { branchId, items, discount = 0, tax = 0, paymentMethod = 'cash',
            currency = 'ETB', exchangeRate = 1, amountPaid, notes, customerId } = req.body;

    if (!items || items.length === 0) return res.status(400).json({ error: 'Sale items required' });

    const branch = branchId || req.user.branchId;
    let subtotal = 0;
    const saleItemsData = [];

    for (const item of items) {
      const product = await Product.findByPk(item.productId, { transaction: t });
      if (!product) { await t.rollback(); return res.status(404).json({ error: `Product ${item.productId} not found` }); }

      // Check stock
      const stock = await Stock.findOne({ where: { productId: item.productId, branchId: branch }, transaction: t });
      const available = stock ? parseFloat(stock.quantity) : 0;
      if (available < item.quantity) {
        await t.rollback();
        return res.status(400).json({ error: `Insufficient stock for ${product.name}. Available: ${available}` });
      }

      const lineTotal = parseFloat(item.unitPrice || product.sellingPrice) * parseFloat(item.quantity) - parseFloat(item.discount || 0);
      subtotal += lineTotal;
      saleItemsData.push({ productId: item.productId, quantity: item.quantity, unitPrice: item.unitPrice || product.sellingPrice, discount: item.discount || 0, subtotal: lineTotal });
    }

    const totalAmount = subtotal - parseFloat(discount) + parseFloat(tax);
    const change = parseFloat(amountPaid) - totalAmount;

    const sale = await Sale.create({
      invoiceNumber: generateInvoice(), branchId: branch, userId: req.user.id,
      subtotal, discount, tax, totalAmount, amountPaid: amountPaid || totalAmount,
      change: change > 0 ? change : 0, paymentMethod, currency, exchangeRate, notes, customerId,
    }, { transaction: t });

    for (const item of saleItemsData) {
      await SaleItem.create({ ...item, saleId: sale.id }, { transaction: t });

      // Deduct stock
      const stock = await Stock.findOne({ where: { productId: item.productId, branchId: branch }, transaction: t });
      const before = parseFloat(stock.quantity);
      const after = before - parseFloat(item.quantity);
      await stock.update({ quantity: after }, { transaction: t });
      await StockMovement.create({
        productId: item.productId, branchId: branch, type: 'sale',
        quantity: item.quantity, balanceBefore: before, balanceAfter: after,
        referenceId: sale.id, referenceType: 'sale', userId: req.user.id,
      }, { transaction: t });
    }

    await t.commit();
    const full = await Sale.findByPk(sale.id, {
      include: [{ model: SaleItem, as: 'items', include: [{ model: Product, as: 'product', attributes: ['id','name','unit'] }] }],
    });
    res.status(201).json(full);
  } catch (e) {
    await t.rollback();
    res.status(500).json({ error: e.message });
  }
};

exports.getSales = async (req, res) => {
  try {
    const { branchId, dateFrom, dateTo, page = 1, limit = 50, search } = req.query;
    const where = {};
    if (branchId) where.branchId = branchId;
    else if (req.user.role !== 'superadmin') where.branchId = req.user.branchId;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt[Op.gte] = new Date(dateFrom);
      if (dateTo)   where.createdAt[Op.lte] = new Date(dateTo + 'T23:59:59');
    }
    if (search) where.invoiceNumber = { [Op.iLike]: `%${search}%` };

    const { count, rows } = await Sale.findAndCountAll({
      where,
      include: [
        { model: User,   as: 'cashier',  attributes: ['id','name'] },
        { model: Branch, as: 'branch',   attributes: ['id','name'] },
        { model: SaleItem, as: 'items', include: [{ model: Product, as: 'product', attributes: ['id','name','unit'] }] },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });
    res.json({ sales: rows, total: count, page: parseInt(page), totalPages: Math.ceil(count / limit) });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.getOne = async (req, res) => {
  try {
    const sale = await Sale.findByPk(req.params.id, {
      include: [
        { model: User,     as: 'cashier',  attributes: ['id','name'] },
        { model: Branch,   as: 'branch',   attributes: ['id','name'] },
        { model: SaleItem, as: 'items', include: [{ model: Product, as: 'product' }] },
      ],
    });
    if (!sale) return res.status(404).json({ error: 'Sale not found' });
    res.json(sale);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.voidSale = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const sale = await Sale.findByPk(req.params.id, {
      include: [{ model: SaleItem, as: 'items' }],
      transaction: t,
    });
    if (!sale) { await t.rollback(); return res.status(404).json({ error: 'Sale not found' }); }
    if (sale.status !== 'completed') { await t.rollback(); return res.status(400).json({ error: `Sale is already ${sale.status}` }); }

    for (const item of sale.items) {
      const stock = await Stock.findOne({ where: { productId: item.productId, branchId: sale.branchId }, transaction: t });
      if (stock) {
        const before = parseFloat(stock.quantity);
        const after = before + parseFloat(item.quantity);
        await stock.update({ quantity: after }, { transaction: t });
        await StockMovement.create({
          productId: item.productId, branchId: sale.branchId, type: 'in',
          quantity: item.quantity, balanceBefore: before, balanceAfter: after,
          referenceId: sale.id, referenceType: 'void', note: 'Sale voided',
          userId: req.user.id,
        }, { transaction: t });
      }
    }
    await sale.update({ status: 'voided' }, { transaction: t });
    await t.commit();
    res.json({ message: 'Sale voided and stock restored' });
  } catch (e) {
    await t.rollback();
    res.status(500).json({ error: e.message });
  }
};
