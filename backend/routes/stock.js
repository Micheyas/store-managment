const router = require('express').Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const c = require('../controllers/stockController');

router.get('/low-stock',  authenticateToken, c.getLowStock);
router.get('/movements',  authenticateToken, authorizeRole(['owner','manager']), c.getMovements);
router.get('/',           authenticateToken, authorizeRole(['owner','manager']), c.getBranchStock);
router.get('/:branchId',  authenticateToken, authorizeRole(['owner','manager']), c.getBranchStock);
router.post('/adjust',    authenticateToken, authorizeRole(['owner','manager']), c.adjustStock);
router.post('/transfer',  authenticateToken, authorizeRole(['owner','manager']), c.transferStock);

module.exports = router;
