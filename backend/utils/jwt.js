const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'yencode-crm-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

const normalizeRole = (role) => {
  const map = {
    Superadmin: 'Admin',
    Admin: 'Admin',
    Lead: 'Lead',
    Telecaller: 'Telecaller',
    employee: 'employee',
  };
  return map[role] || role;
};

const generateToken = (user, userType = 'employee') => {
  const role = normalizeRole(
    user.role || user.adminType || (userType === 'admin' ? 'Admin' : 'employee')
  );
  const salesRoles = ['Telecaller', 'Lead'];
  const expiresIn = salesRoles.includes(role)
    ? (process.env.JWT_SALES_EXPIRES_IN || '12h')
    : JWT_EXPIRES_IN;
  const payload = {
    id: user._id.toString(),
    empId: user.empId || null,
    role,
    userType,
    email: user.email || user.officeEmail,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

module.exports = { generateToken, normalizeRole, JWT_SECRET };
