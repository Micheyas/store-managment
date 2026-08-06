const { Product, Category, Supplier, Stock, sequelize } = require('../models');
const { Op } = require('sequelize');
const { v2: cloudinary } = require('cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.getAll = async (req, res) => {
  try {
    const { search, categoryId, supplierId, page = 1, limit = 50 } = req.query;
    const where = { isActive: true };
    if (search) where[Op.or] = [
      { name:    { [Op.iLike]: `%${search}%` } },
      { sku:     { [Op.iLike]: `%${search}%` } },
      { barcode: { [Op.iLike]: `%${search}%` } },
    ];
    if (categoryId) where.categoryId = categoryId;
    if (supplierId) where.supplierId = supplierId;

    const { count, rows } = await Product.findAndCountAll({
      where,
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'color'] },
        { model: Supplier,  as: 'supplier',  attributes: ['id', 'name'] },
        { model: Stock,     as: 'stockEntries', required: false },
      ],
      order: [['name', 'ASC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });
    res.json({ products: rows, total: count, page: parseInt(page), totalPages: Math.ceil(count / limit) });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.getOne = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        { model: Category, as: 'category' },
        { model: Supplier,  as: 'supplier' },
        { model: Stock,     as: 'stockEntries' },
      ],
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.getByBarcode = async (req, res) => {
  try {
    const product = await Product.findOne({
      where: { barcode: req.params.barcode, isActive: true },
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name'] },
        { model: Stock,     as: 'stockEntries', required: false },
      ],
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.create = async (req, res) => {
  try {
    const { name, sku, barcode, description, unit, costPrice, sellingPrice, taxRate, categoryId, supplierId } = req.body;
    if (!name) return res.status(400).json({ error: 'Product name required' });

    let imageUrl = null;
    if (req.file?.path) imageUrl = req.file.path;

    // Auto-generate SKU if not provided
    const finalSku = sku || `PRD-${Date.now()}`;

    const product = await Product.create({
      name, sku: finalSku, barcode, description, image: imageUrl,
      unit: unit || 'pcs',
      costPrice: parseFloat(costPrice) || 0,
      sellingPrice: parseFloat(sellingPrice) || 0,
      taxRate: parseFloat(taxRate) || 0,
      categoryId: categoryId || null,
      supplierId: supplierId || null,
    });

    res.status(201).json(product);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.update = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    let imageUrl = product.image;
    if (req.file?.path) imageUrl = req.file.path;

    await product.update({ ...req.body, image: imageUrl });
    res.json(product);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.remove = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    await product.update({ isActive: false });
    res.json({ message: 'Product deactivated' });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
