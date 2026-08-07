const router = require('express').Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const c = require('../controllers/branchController');

router.get('/',       authenticateToken, c.getAll);
router.get('/:id',    authenticateToken, c.getOne);
router.post('/',      authenticateToken, authorizeRole(['owner']), c.create);
router.put('/:id',    authenticateToken, authorizeRole(['owner']), c.update);
router.delete('/:id', authenticateToken, authorizeRole(['owner']), c.remove);

module.exports = router;
