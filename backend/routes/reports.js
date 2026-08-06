const router = require('express').Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const c = require('../controllers/reportController');

router.get('/dashboard',    authenticateToken, c.getDashboard);
router.get('/sales',        authenticateToken, authorizeRole(['superadmin','admin']), c.getSalesReport);
router.get('/top-products', authenticateToken, authorizeRole(['superadmin','admin']), c.getTopProducts);
router.get('/profit-loss',  authenticateToken, authorizeRole(['superadmin','admin']), c.getProfitLoss);

module.exports = router;
