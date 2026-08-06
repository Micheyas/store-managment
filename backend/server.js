const express = require('express');
const cors    = require('cors');
const dotenv  = require('dotenv');
dotenv.config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // TODO: remove before production — disables TLS cert validation

const { sequelize } = require('./models');

const app = express();
app.use(cors());
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

app.get('/', (req, res) => res.json({ message: 'Store Management API running' }));

const addColIfMissing = async (table, col, def) => {
  try { await sequelize.getQueryInterface().addColumn(table, col, def); }
  catch (_) {}
};

sequelize.sync({ alter: false }).then(async () => {
  console.log('✅ Database synced');
  const { DataTypes } = require('sequelize');

  // Safe migrations
  await addColIfMissing('Stocks',  'lowStockThreshold', { type: DataTypes.DECIMAL(12,3), defaultValue: 10 });
  await addColIfMissing('Users',   'branchId',          { type: DataTypes.INTEGER, allowNull: true });
  await addColIfMissing('Users',   'isActive',          { type: DataTypes.BOOLEAN, defaultValue: true });
  await addColIfMissing('Branches','isActive',          { type: DataTypes.BOOLEAN, defaultValue: true });
  await addColIfMissing('Products','isActive',          { type: DataTypes.BOOLEAN, defaultValue: true });
  await addColIfMissing('Products','image',             { type: DataTypes.STRING,  allowNull: true });
  await addColIfMissing('Products','costPrice',         { type: DataTypes.DECIMAL(14,2), defaultValue: 0 });
  await addColIfMissing('Products','lowStockThreshold', { type: DataTypes.DECIMAL(12,3), defaultValue: 10 });

  // Seed initial data
  const bcrypt = require('bcryptjs');
  const { Branch, User, Currency, Category } = require('./models');

  // Seed default branch
  let [branch] = await Branch.findOrCreate({ where: { name: 'Main Branch' }, defaults: { name: 'Main Branch', location: 'HQ', isActive: true } });

  // Seed superadmin
  const existing = await User.findOne({ where: { email: 'admin@store.com' } });
  if (!existing) {
    await User.create({ name: 'Super Admin', email: 'admin@store.com', password: await bcrypt.hash('admin123', 10), role: 'superadmin', branchId: branch.id, isActive: true });
    console.log('✅ Seeded superadmin: admin@store.com / admin123');
  }

  // Seed currencies
  const currencies = [
    { code: 'ETB', name: 'Ethiopian Birr',  symbol: 'Br',  rate: 1,      isBase: true  },
    { code: 'USD', name: 'US Dollar',        symbol: '$',   rate: 0.0071, isBase: false },
    { code: 'EUR', name: 'Euro',             symbol: '€',   rate: 0.0065, isBase: false },
    { code: 'GBP', name: 'British Pound',    symbol: '£',   rate: 0.0056, isBase: false },
  ];
  for (const cur of currencies) {
    await Currency.findOrCreate({ where: { code: cur.code }, defaults: cur });
  }

  // Seed categories
  const cats = ['Electronics', 'Clothing', 'Food & Beverages', 'Health & Beauty', 'Home & Kitchen', 'Tools & Hardware', 'Other'];
  for (const name of cats) {
    await Category.findOrCreate({ where: { name } });
  }

  console.log('✅ Initial data seeded');

  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
});

module.exports = app;
