const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

const authorizeRole = (roles) => (req, res, next) => {
  // Map legacy role names to new ones for backward compatibility with old JWTs
  const roleMap = { superadmin: 'owner', admin: 'manager', warehouse: 'manager' };
  const role = roleMap[req.user.role] || req.user.role;
  if (!roles.includes(role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  // Normalize the role on the request object so controllers see the new name
  req.user.role = role;
  next();
};

module.exports = { authenticateToken, authorizeRole };
