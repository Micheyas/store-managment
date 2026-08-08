const router = require('express').Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const c = require('../controllers/reportController');

router.get('/dashboard',    authenticateToken, c.getDashboard); // all roles
router.get('/sales',        authenticateToken, authorizeRole(['owner','manager']), c.getSalesReport);
router.get('/top-products', authenticateToken, authorizeRole(['owner','manager']), c.getTopProducts);
router.get('/profit-loss',  authenticateToken, authorizeRole(['owner']), c.getProfitLoss); // owner only
router.get('/expenses',     authenticateToken, authorizeRole(['owner']), c.getExpenseSummary);

module.exports = router;
