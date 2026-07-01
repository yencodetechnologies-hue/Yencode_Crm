const { normalizeRole } = require('../utils/jwt');

const requireRole = (...allowedRoles) => {
  const normalized = allowedRoles.flat().map((r) => normalizeRole(r));
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    const userRole = normalizeRole(req.user.role);
    if (!normalized.includes(userRole)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
};

module.exports = { requireRole };
