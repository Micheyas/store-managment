const router = require('express').Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const c = require('../controllers/activityController');

router.get('/', authenticateToken, authorizeRole(['owner','manager']), c.getAll);

module.exports = router;
