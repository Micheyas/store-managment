const router = require('express').Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const c = require('../controllers/purchaseController');

router.get('/',              authenticateToken, authorizeRole(['owner','manager']), c.getAll);
router.get('/:id',           authenticateToken, authorizeRole(['owner','manager']), c.getOne);
router.post('/',             authenticateToken, authorizeRole(['owner','manager']), c.create);
router.put('/:id/status',    authenticateToken, authorizeRole(['owner','manager']), c.updateStatus);
router.post('/:id/receive',  authenticateToken, authorizeRole(['owner','manager']), c.receiveItems);

module.exports = router;
