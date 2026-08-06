const router = require('express').Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const c = require('../controllers/purchaseController');

router.get('/',                    authenticateToken, c.getAll);
router.get('/:id',                 authenticateToken, c.getOne);
router.post('/',                   authenticateToken, authorizeRole(['superadmin','admin','warehouse']), c.create);
router.put('/:id/status',          authenticateToken, authorizeRole(['superadmin','admin','warehouse']), c.updateStatus);
router.post('/:id/receive',        authenticateToken, authorizeRole(['superadmin','admin','warehouse']), c.receiveItems);

module.exports = router;
