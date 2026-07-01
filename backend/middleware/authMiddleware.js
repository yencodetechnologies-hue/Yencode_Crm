const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../utils/jwt');

/**
 * Optional auth: requests without a token work as before (legacy).
 * If a Bearer token is sent, it must be valid.
 */
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = authMiddleware;
