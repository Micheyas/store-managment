const router = require('express').Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const c = require('../controllers/userController');

router.get('/',       authenticateToken, authorizeRole(['superadmin','admin']), c.getAll);
router.post('/',      authenticateToken, authorizeRole(['superadmin','admin']), c.create);
router.put('/:id',    authenticateToken, authorizeRole(['superadmin','admin']), c.update);
router.delete('/:id', authenticateToken, authorizeRole(['superadmin','admin']), c.remove);

module.exports = router;
