const router = require('express').Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const c = require('../controllers/approvalController');

// IT: submit action for approval
router.post('/',         authenticateToken, authorizeRole(['it']), c.submit);
// IT: view own submissions
router.get('/mine',      authenticateToken, authorizeRole(['it']), c.myActions);
// Superadmin: view all + badge count
router.get('/count',     authenticateToken, authorizeRole(['superadmin']), c.pendingCount);
router.get('/',          authenticateToken, authorizeRole(['superadmin']), c.getAll);
// Superadmin: approve / reject
router.post('/:id/approve', authenticateToken, authorizeRole(['superadmin']), c.approve);
router.post('/:id/reject',  authenticateToken, authorizeRole(['superadmin']), c.reject);

module.exports = router;
