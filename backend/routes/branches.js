const router = require('express').Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const c = require('../controllers/branchController');

router.get('/',       authenticateToken, c.getAll);
router.get('/:id',    authenticateToken, c.getOne);
router.post('/',      authenticateToken, authorizeRole(['superadmin']), c.create);
router.put('/:id',    authenticateToken, authorizeRole(['superadmin']), c.update);
router.delete('/:id', authenticateToken, authorizeRole(['superadmin']), c.remove);

module.exports = router;
