const router = require('express').Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const c = require('../controllers/expenseController');

router.get('/',         authenticateToken, authorizeRole(['owner','manager']), c.getAll);
router.get('/summary',  authenticateToken, authorizeRole(['owner']), c.summary);
router.post('/',        authenticateToken, authorizeRole(['owner','manager']), c.create);
router.put('/:id',      authenticateToken, authorizeRole(['owner','manager']), c.update);
router.delete('/:id',   authenticateToken, authorizeRole(['owner']), c.remove);

module.exports = router;
