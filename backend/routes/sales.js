const router = require('express').Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const c = require('../controllers/saleController');

router.get('/',          authenticateToken, authorizeRole(['owner','manager']), c.getSales);
router.get('/:id',       authenticateToken, c.getOne);
router.post('/',         authenticateToken, c.createSale);
router.put('/:id/void',  authenticateToken, authorizeRole(['owner','manager']), c.voidSale);

module.exports = router;
