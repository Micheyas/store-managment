const express = require('express');
const cors    = require('cors');
const dotenv  = require('dotenv');
dotenv.config();

const { sequelize } = require('./models');

const app = express();
app.use(cors());
app.options('*', cors());
app.use(express.json());

// Routes
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/users',      require('./routes/users'));
app.use('/api/branches',   require('./routes/branches'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/suppliers',  require('./routes/suppliers'));
app.use('/api/products',   require('./routes/products'));
app.use('/api/stock',      require('./routes/stock'));
app.use('/api/purchases',  require('./routes/purchases'));
app.use('/api/sales',      require('./routes/sales'));
app.use('/api/currency',   require('./routes/currency'));
app.use('/api/reports',    require('./routes/reports'));
app.use('/api/approvals',  require('./routes/approvals'));
app.use('/api/expenses',   require('./routes/expenses'));
app.use('/api/activity',   require('./routes/activity'));

app.get('/', (req, res) => res.json({ message: 'Store Management API running' }));

const addColIfMissing = async (table, col, def) => {
  try { await sequelize.getQueryInterface().addColumn(table, col, def); }
  catch (_) {}
};

sequelize.sync({ alter: false }).then(async () => {
  console.log('✅ Database synced');
  const { DataTypes } = require('sequelize');

  // Safe column migrations
  await addColIfMissing('Stocks',   'lowStockThreshold', { type: DataTypes.DECIMAL(12,3), defaultValue: 10 });
  await addColIfMissing('Users',    'branchId',          { type: DataTypes.INTEGER, allowNull: true });
  await addColIfMissing('Users',    'isActive',          { type: DataTypes.BOOLEAN, defaultValue: true });
  await addColIfMissing('Branches', 'isActive',          { type: DataTypes.BOOLEAN, defaultValue: true });
  await addColIfMissing('Products', 'isActive',          { type: DataTypes.BOOLEAN, defaultValue: true });
  await addColIfMissing('Products', 'image',             { type: DataTypes.STRING,  allowNull: true });
  await addColIfMissing('Products', 'costPrice',         { type: DataTypes.DECIMAL(14,2), defaultValue: 0 });
  await addColIfMissing('Products', 'lowStockThreshold', { type: DataTypes.DECIMAL(12,3), defaultValue: 10 });

  // Add new role values to ENUM (PostgreSQL)
  const newRoles = ['it', 'owner', 'manager'];
  for (const role of newRoles) {
    try { await sequelize.query(`ALTER TYPE "enum_Users_role" ADD VALUE IF NOT EXISTS '${role}'`); } catch (_) {}
  }

  // Create PendingActions table if missing
  try {
    await sequelize.getQueryInterface().createTable('PendingActions', {
      id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      type:        { type: DataTypes.STRING,  allowNull: false },
      payload:     { type: DataTypes.JSONB,   allowNull: false },
      submittedBy: { type: DataTypes.INTEGER, allowNull: false },
      status:      { type: DataTypes.STRING,  defaultValue: 'pending' },
      reviewedBy:  { type: DataTypes.INTEGER, allowNull: true },
      reviewNote:  { type: DataTypes.TEXT,    allowNull: true },
      reviewedAt:  { type: DataTypes.DATE,    allowNull: true },
      createdAt:   { type: DataTypes.DATE,    allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt:   { type: DataTypes.DATE,    allowNull: false, defaultValue: DataTypes.NOW },
    });
  } catch (_) {}

  // Create Expenses table if missing
  try {
    await sequelize.getQueryInterface().createTable('Expenses', {
      id:            { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      title:         { type: DataTypes.STRING,  allowNull: false },
      amount:        { type: DataTypes.DECIMAL(14,2), allowNull: false },
      category:      { type: DataTypes.STRING,  defaultValue: 'other' },
      paymentMethod: { type: DataTypes.STRING,  defaultValue: 'cash' },
      branchId:      { type: DataTypes.INTEGER, allowNull: true },
      userId:        { type: DataTypes.INTEGER, allowNull: false },
      note:          { type: DataTypes.TEXT,    allowNull: true },
      expenseDate:   { type: DataTypes.DATEONLY, allowNull: false },
      createdAt:     { type: DataTypes.DATE,    allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt:     { type: DataTypes.DATE,    allowNull: false, defaultValue: DataTypes.NOW },
    });
  } catch (_) {}

  // Create ActivityLogs table if missing
  try {
    await sequelize.getQueryInterface().createTable('ActivityLogs', {
      id:       { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      userId:   { type: DataTypes.INTEGER, allowNull: false },
      action:   { type: DataTypes.STRING,  allowNull: false },
      entity:   { type: DataTypes.STRING,  allowNull: true },
      entityId: { type: DataTypes.INTEGER, allowNull: true },
      detail:   { type: DataTypes.TEXT,    allowNull: true },
      ip:       { type: DataTypes.STRING,  allowNull: true },
      createdAt:{ type: DataTypes.DATE,    allowNull: false, defaultValue: DataTypes.NOW },
    });
  } catch (_) {}

  // Seed initial data
  const bcrypt = require('bcryptjs');
  const { Branch, User, Currency, Category } = require('./models');

  let [branch] = await Branch.findOrCreate({
    where: { name: 'Main Branch' },
    defaults: { name: 'Main Branch', location: 'HQ', isActive: true },
  });

  // Seed owner account (was superadmin)
  const existing = await User.findOne({ where: { email: 'admin@store.com' } });
  if (!existing) {
    await User.create({
      name: 'Store Owner', email: 'admin@store.com',
      password: await bcrypt.hash('admin123', 10),
      role: 'owner', branchId: branch.id, isActive: true,
    });
    console.log('✅ Seeded owner: admin@store.com / admin123');
  } else if (existing.role === 'superadmin') {
    await existing.update({ role: 'owner' });
    console.log('✅ Migrated superadmin → owner');
  }

  // Seed demo manager
  const mgr = await User.findOne({ where: { email: 'manager@store.com' } });
  if (!mgr) {
    await User.create({ name: 'Demo Manager', email: 'manager@store.com', password: await bcrypt.hash('manager123', 10), role: 'manager', branchId: branch.id, isActive: true });
    console.log('✅ Seeded manager: manager@store.com / manager123');
  }

  // Seed demo cashier
  const csh = await User.findOne({ where: { email: 'cashier@store.com' } });
  if (!csh) {
    await User.create({ name: 'Demo Cashier', email: 'cashier@store.com', password: await bcrypt.hash('cashier123', 10), role: 'cashier', branchId: branch.id, isActive: true });
    console.log('✅ Seeded cashier: cashier@store.com / cashier123');
  }

  // Seed demo IT
  const it = await User.findOne({ where: { email: 'it@store.com' } });
  if (!it) {
    await User.create({ name: 'Demo IT', email: 'it@store.com', password: await bcrypt.hash('it123456', 10), role: 'it', branchId: branch.id, isActive: true });
    console.log('✅ Seeded IT: it@store.com / it123456');
  }

  // Seed currencies
  const currencies = [
    { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br', rate: 1,      isBase: true  },
    { code: 'USD', name: 'US Dollar',       symbol: '$',  rate: 0.0071, isBase: false },
    { code: 'EUR', name: 'Euro',            symbol: '€',  rate: 0.0065, isBase: false },
    { code: 'GBP', name: 'British Pound',   symbol: '£',  rate: 0.0056, isBase: false },
  ];
  for (const cur of currencies) {
    await Currency.findOrCreate({ where: { code: cur.code }, defaults: cur });
  }

  // Seed categories
  const cats = ['Electronics','Clothing','Food & Beverages','Health & Beauty','Home & Kitchen','Tools & Hardware','Other'];
  for (const name of cats) {
    await Category.findOrCreate({ where: { name } });
  }

  // Seed sample products + stock
  const { Product, Stock, Supplier } = require('./models');

  const catMap = {};
  for (const name of cats) {
    const [c] = await Category.findOrCreate({ where: { name } });
    catMap[name] = c.id;
  }

  // Seed a default supplier
  const [supplier] = await Supplier.findOrCreate({
    where: { name: 'Demo Supplier' },
    defaults: { name: 'Demo Supplier', phone: '+251900000000', email: 'supplier@demo.com', address: 'Addis Ababa' },
  });

  const sampleProducts = [
    // Electronics
    { name: 'USB Charging Cable', sku: 'ELEC-001', costPrice: 50,   sellingPrice: 120,  category: 'Electronics',      unit: 'pcs', stock: 50,  image: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&q=80' },
    { name: 'Wireless Earbuds',   sku: 'ELEC-002', costPrice: 400,  sellingPrice: 850,  category: 'Electronics',      unit: 'pcs', stock: 20,  image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&q=80' },
    { name: 'Phone Case',         sku: 'ELEC-003', costPrice: 80,   sellingPrice: 200,  category: 'Electronics',      unit: 'pcs', stock: 35,  image: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400&q=80' },
    { name: 'Power Bank 10000mAh',sku: 'ELEC-004', costPrice: 550,  sellingPrice: 1200, category: 'Electronics',      unit: 'pcs', stock: 15,  image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&q=80' },
    // Food & Beverages
    { name: 'Bottled Water 1L',   sku: 'FOOD-001', costPrice: 8,    sellingPrice: 15,   category: 'Food & Beverages', unit: 'pcs', stock: 200, image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&q=80' },
    { name: 'Coca Cola 500ml',    sku: 'FOOD-002', costPrice: 18,   sellingPrice: 30,   category: 'Food & Beverages', unit: 'pcs', stock: 120, image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&q=80' },
    { name: 'Instant Coffee Jar', sku: 'FOOD-003', costPrice: 120,  sellingPrice: 200,  category: 'Food & Beverages', unit: 'pcs', stock: 40,  image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&q=80' },
    { name: 'Biscuit Pack',       sku: 'FOOD-004', costPrice: 25,   sellingPrice: 45,   category: 'Food & Beverages', unit: 'pack',stock: 80,  image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&q=80' },
    { name: 'Sugar 1kg',          sku: 'FOOD-005', costPrice: 55,   sellingPrice: 80,   category: 'Food & Beverages', unit: 'kg',  stock: 60,  image: 'https://images.unsplash.com/photo-1550534791-2677533605ab?w=400&q=80' },
    { name: 'Cooking Oil 1L',     sku: 'FOOD-006', costPrice: 140,  sellingPrice: 200,  category: 'Food & Beverages', unit: 'L',   stock: 45,  image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80' },
    // Health & Beauty
    { name: 'Hand Sanitizer',     sku: 'HLTH-001', costPrice: 40,   sellingPrice: 80,   category: 'Health & Beauty',  unit: 'pcs', stock: 60,  image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80' },
    { name: 'Toothpaste',         sku: 'HLTH-002', costPrice: 35,   sellingPrice: 65,   category: 'Health & Beauty',  unit: 'pcs', stock: 55,  image: 'https://images.unsplash.com/photo-1559163499-413811fb2344?w=400&q=80' },
    { name: 'Body Lotion 200ml',  sku: 'HLTH-003', costPrice: 90,   sellingPrice: 160,  category: 'Health & Beauty',  unit: 'pcs', stock: 30,  image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&q=80' },
    { name: 'Shampoo 400ml',      sku: 'HLTH-004', costPrice: 110,  sellingPrice: 200,  category: 'Health & Beauty',  unit: 'pcs', stock: 25,  image: 'https://images.unsplash.com/photo-1585751119414-ef2636f8aede?w=400&q=80' },
    // Clothing
    { name: "Men's T-Shirt",      sku: 'CLTH-001', costPrice: 150,  sellingPrice: 350,  category: 'Clothing',         unit: 'pcs', stock: 40,  image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80' },
    { name: "Women's Scarf",      sku: 'CLTH-002', costPrice: 80,   sellingPrice: 200,  category: 'Clothing',         unit: 'pcs', stock: 30,  image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=400&q=80' },
    { name: 'Kids Socks (pair)',   sku: 'CLTH-003', costPrice: 30,   sellingPrice: 60,   category: 'Clothing',         unit: 'pcs', stock: 100, image: 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=400&q=80' },
    // Home & Kitchen
    { name: 'Plastic Plates Set', sku: 'HOME-001', costPrice: 120,  sellingPrice: 250,  category: 'Home & Kitchen',   unit: 'set', stock: 20,  image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400&q=80' },
    { name: 'Stainless Mug',      sku: 'HOME-002', costPrice: 70,   sellingPrice: 150,  category: 'Home & Kitchen',   unit: 'pcs', stock: 35,  image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&q=80' },
    { name: 'Dish Soap 500ml',    sku: 'HOME-003', costPrice: 45,   sellingPrice: 85,   category: 'Home & Kitchen',   unit: 'pcs', stock: 50,  image: 'https://images.unsplash.com/photo-1585667927711-1f5a2ed5a46a?w=400&q=80' },
    // Tools & Hardware
    { name: 'AA Batteries (4pk)', sku: 'TOOL-001', costPrice: 40,   sellingPrice: 80,   category: 'Tools & Hardware', unit: 'pack',stock: 60,  image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400&q=80' },
    { name: 'Tape Measure 5m',    sku: 'TOOL-002', costPrice: 90,   sellingPrice: 180,  category: 'Tools & Hardware', unit: 'pcs', stock: 20,  image: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=400&q=80' },
  ];

  let seededProducts = 0;
  for (const p of sampleProducts) {
    const [product, created] = await Product.findOrCreate({
      where: { sku: p.sku },
      defaults: {
        name: p.name, sku: p.sku, unit: p.unit,
        costPrice: p.costPrice, sellingPrice: p.sellingPrice,
        categoryId: catMap[p.category], supplierId: supplier.id,
        lowStockThreshold: 5, isActive: true, image: p.image,
      },
    });
    // Update image on existing products that have none
    if (!created && !product.image && p.image) {
      await product.update({ image: p.image });
    }
    if (created) {
      await Stock.findOrCreate({
        where: { productId: product.id, branchId: branch.id },
        defaults: { quantity: p.stock, lowStockThreshold: 5 },
      });
      seededProducts++;
    }
  }
  if (seededProducts > 0) console.log(`✅ Seeded ${seededProducts} sample products with stock`);

  console.log('✅ Initial data seeded');
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
});

module.exports = app;
