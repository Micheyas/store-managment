const router = require('express').Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const c = require('../controllers/categoryController');

router.get('/',       authenticateToken, c.getAll);
router.post('/',      authenticateToken, authorizeRole(['owner','manager']), c.create);
router.put('/:id',    authenticateToken, authorizeRole(['owner','manager']), c.update);
router.delete('/:id', authenticateToken, authorizeRole(['owner','manager']), c.remove);

module.exports = router;
