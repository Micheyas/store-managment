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

  console.log('✅ Initial data seeded');
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
});

module.exports = app;
