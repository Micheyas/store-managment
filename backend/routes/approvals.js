const router = require('express').Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const c = require('../controllers/approvalController');

router.post('/',            authenticateToken, authorizeRole(['it']), c.submit);
router.get('/mine',         authenticateToken, authorizeRole(['it']), c.myActions);
router.get('/count',        authenticateToken, authorizeRole(['owner']), c.pendingCount);
router.get('/',             authenticateToken, authorizeRole(['owner']), c.getAll);
router.post('/:id/approve', authenticateToken, authorizeRole(['owner']), c.approve);
router.post('/:id/reject',  authenticateToken, authorizeRole(['owner']), c.reject);

module.exports = router;
