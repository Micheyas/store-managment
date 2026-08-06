const router = require('express').Router();
const { authenticateToken } = require('../middleware/auth');
const c = require('../controllers/authController');

router.post('/login',           c.login);
router.get('/me',               authenticateToken, c.me);
router.put('/change-password',  authenticateToken, c.changePassword);

module.exports = router;
