const sequelize  = require('../config/database');
const Branch     = require('./Branch');
const User       = require('./User');
const Category   = require('./Category');
const Supplier   = require('./Supplier');
const Product    = require('./Product');
const Stock      = require('./Stock');
const StockMovement = require('./StockMovement');
const PurchaseOrder = require('./PurchaseOrder');
const PurchaseItem  = require('./PurchaseItem');
const Sale       = require('./Sale');
const SaleItem   = require('./SaleItem');
const Currency   = require('./Currency');
const PendingAction = require('./PendingAction');

// ── Branch ↔ User ──────────────────────────────────────────────────────────
Branch.hasMany(User, { foreignKey: 'branchId', as: 'users' });
User.belongsTo(Branch, { foreignKey: 'branchId', as: 'branch' });

// ── Category ↔ Product ─────────────────────────────────────────────────────
Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products' });
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

// ── Supplier ↔ Product ─────────────────────────────────────────────────────
Supplier.hasMany(Product, { foreignKey: 'supplierId', as: 'products' });
Product.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' });

// ── Product ↔ Stock ────────────────────────────────────────────────────────
Product.hasMany(Stock, { foreignKey: 'productId', as: 'stockEntries' });
Stock.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
Branch.hasMany(Stock, { foreignKey: 'branchId', as: 'stockEntries' });
Stock.belongsTo(Branch, { foreignKey: 'branchId', as: 'branch' });

// ── StockMovement ──────────────────────────────────────────────────────────
Product.hasMany(StockMovement, { foreignKey: 'productId', as: 'movements' });
StockMovement.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
Branch.hasMany(StockMovement, { foreignKey: 'branchId', as: 'movements' });
StockMovement.belongsTo(Branch, { foreignKey: 'branchId', as: 'branch' });
User.hasMany(StockMovement, { foreignKey: 'userId', as: 'movements' });
StockMovement.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// ── PurchaseOrder ──────────────────────────────────────────────────────────
Supplier.hasMany(PurchaseOrder, { foreignKey: 'supplierId', as: 'orders' });
PurchaseOrder.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' });
Branch.hasMany(PurchaseOrder, { foreignKey: 'branchId', as: 'purchaseOrders' });
PurchaseOrder.belongsTo(Branch, { foreignKey: 'branchId', as: 'branch' });
User.hasMany(PurchaseOrder, { foreignKey: 'userId', as: 'purchaseOrders' });
PurchaseOrder.belongsTo(User, { foreignKey: 'userId', as: 'createdBy' });

// ── PurchaseItem ───────────────────────────────────────────────────────────
PurchaseOrder.hasMany(PurchaseItem, { foreignKey: 'purchaseOrderId', as: 'items' });
PurchaseItem.belongsTo(PurchaseOrder, { foreignKey: 'purchaseOrderId', as: 'order' });
Product.hasMany(PurchaseItem, { foreignKey: 'productId', as: 'purchaseItems' });
PurchaseItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// ── Sale ───────────────────────────────────────────────────────────────────
Branch.hasMany(Sale, { foreignKey: 'branchId', as: 'sales' });
Sale.belongsTo(Branch, { foreignKey: 'branchId', as: 'branch' });
User.hasMany(Sale, { foreignKey: 'userId', as: 'sales' });
Sale.belongsTo(User, { foreignKey: 'userId', as: 'cashier' });

// ── SaleItem ───────────────────────────────────────────────────────────────
Sale.hasMany(SaleItem, { foreignKey: 'saleId', as: 'items' });
SaleItem.belongsTo(Sale, { foreignKey: 'saleId', as: 'sale' });
Product.hasMany(SaleItem, { foreignKey: 'productId', as: 'saleItems' });
SaleItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// ── PendingAction ──────────────────────────────────────────────────────────
User.hasMany(PendingAction, { foreignKey: 'submittedBy', as: 'submittedActions' });
PendingAction.belongsTo(User, { foreignKey: 'submittedBy', as: 'submitter' });
User.hasMany(PendingAction, { foreignKey: 'reviewedBy', as: 'reviewedActions' });
PendingAction.belongsTo(User, { foreignKey: 'reviewedBy', as: 'reviewer' });

module.exports = {
  sequelize,
  Branch, User, Category, Supplier,
  Product, Stock, StockMovement,
  PurchaseOrder, PurchaseItem,
  Sale, SaleItem, Currency, PendingAction,
};
