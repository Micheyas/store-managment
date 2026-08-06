const router = require('express').Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const c = require('../controllers/stockController');

router.get('/low-stock',           authenticateToken, c.getLowStock);
router.get('/movements',           authenticateToken, c.getMovements);
router.get('/',                    authenticateToken, c.getBranchStock);
router.get('/:branchId',           authenticateToken, c.getBranchStock);
router.post('/adjust',             authenticateToken, authorizeRole(['superadmin','admin','warehouse']), c.adjustStock);
router.post('/transfer',           authenticateToken, authorizeRole(['superadmin','admin','warehouse']), c.transferStock);

module.exports = router;
