const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'yencode-crm-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

const normalizeRole = (role) => {
  const map = {
    Superadmin: 'Admin',
    Lead: 'Telecaller',
    employee: 'Telecaller',
    Admin: 'Admin',
    Manager: 'Manager',
    TeamLeader: 'TeamLeader',
    Telecaller: 'Telecaller',
  };
  return map[role] || role;
};

const generateToken = (user, userType = 'employee') => {
  const role = normalizeRole(
    user.role || user.adminType || (userType === 'admin' ? 'Superadmin' : 'Telecaller')
  );
  const salesRoles = ['Telecaller', 'TeamLeader'];
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
