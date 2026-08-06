const { PurchaseOrder, PurchaseItem, Product, Supplier, Branch, User, Stock, StockMovement, sequelize } = require('../models');
const { Op } = require('sequelize');

const genOrderNumber = () => `PO-${Date.now()}-${Math.floor(Math.random()*100)}`;

exports.getAll = async (req, res) => {
  try {
    const { status, supplierId, branchId, page = 1, limit = 50 } = req.query;
    const where = {};
    if (status) where.status = status;
    if (supplierId) where.supplierId = supplierId;
    if (branchId) where.branchId = branchId;
    else if (req.user.role !== 'superadmin') where.branchId = req.user.branchId;

    const { count, rows } = await PurchaseOrder.findAndCountAll({
      where,
      include: [
        { model: Supplier, as: 'supplier', attributes: ['id','name'] },
        { model: Branch,   as: 'branch',   attributes: ['id','name'] },
        { model: User,     as: 'createdBy', attributes: ['id','name'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });
    res.json({ orders: rows, total: count });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.getOne = async (req, res) => {
  try {
    const order = await PurchaseOrder.findByPk(req.params.id, {
      include: [
        { model: Supplier, as: 'supplier' },
        { model: Branch,   as: 'branch' },
        { model: User,     as: 'createdBy', attributes: ['id','name'] },
        { model: PurchaseItem, as: 'items', include: [{ model: Product, as: 'product' }] },
      ],
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.create = async (req, res) => {
  try {
    const { supplierId, branchId, items, notes, expectedDate } = req.body;
    if (!supplierId || !items || items.length === 0) return res.status(400).json({ error: 'supplierId and items required' });

    let total = 0;
    const itemsData = items.map(item => {
      const sub = parseFloat(item.quantity) * parseFloat(item.unitCost);
      total += sub;
      return { ...item, subtotal: sub, receivedQty: 0 };
    });

    const order = await PurchaseOrder.create({
      orderNumber: genOrderNumber(), supplierId,
      branchId: branchId || req.user.branchId,
      totalAmount: total, notes, expectedDate,
      userId: req.user.id,
    });

    for (const item of itemsData) {
      await PurchaseItem.create({ ...item, purchaseOrderId: order.id });
    }
    res.status(201).json(await PurchaseOrder.findByPk(order.id, {
      include: [
        { model: Supplier, as: 'supplier' },
        { model: PurchaseItem, as: 'items', include: [{ model: Product, as: 'product' }] },
      ],
    }));
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.updateStatus = async (req, res) => {
  try {
    const order = await PurchaseOrder.findByPk(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    await order.update({ status: req.body.status });
    res.json(order);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.receiveItems = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { receivedItems } = req.body; // [{purchaseItemId, receivedQty}]
    const order = await PurchaseOrder.findByPk(req.params.id, {
      include: [{ model: PurchaseItem, as: 'items' }],
      transaction: t,
    });
    if (!order) { await t.rollback(); return res.status(404).json({ error: 'Order not found' }); }

    let allReceived = true;
    let anyReceived = false;

    for (const recv of receivedItems) {
      const item = order.items.find(i => i.id === recv.purchaseItemId);
      if (!item) continue;
      const qty = parseFloat(recv.receivedQty);
      if (qty <= 0) continue;
      anyReceived = true;

      const newReceivedQty = parseFloat(item.receivedQty) + qty;
      await item.update({ receivedQty: newReceivedQty }, { transaction: t });

      // Update stock
      const [stock] = await Stock.findOrCreate({
        where: { productId: item.productId, branchId: order.branchId },
        defaults: { quantity: 0, lowStockThreshold: 10 },
        transaction: t,
      });
      const before = parseFloat(stock.quantity);
      const after = before + qty;
      await stock.update({ quantity: after }, { transaction: t });
      await StockMovement.create({
        productId: item.productId, branchId: order.branchId, type: 'purchase',
        quantity: qty, balanceBefore: before, balanceAfter: after,
        referenceId: order.id, referenceType: 'purchase',
        note: `Received from PO ${order.orderNumber}`, userId: req.user.id,
      }, { transaction: t });

      if (newReceivedQty < parseFloat(item.quantity)) allReceived = false;
    }

    const newStatus = allReceived ? 'received' : anyReceived ? 'partially_received' : order.status;
    await order.update({ status: newStatus, receivedDate: new Date() }, { transaction: t });

    await t.commit();
    res.json({ message: 'Items received and stock updated', status: newStatus });
  } catch (e) {
    await t.rollback();
    res.status(500).json({ error: e.message });
  }
};
