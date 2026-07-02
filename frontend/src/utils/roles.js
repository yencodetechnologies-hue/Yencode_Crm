export const ROLES = {
  EMPLOYEE: 'employee',
  TELECALLER: 'Telecaller',
  LEAD: 'Lead',
  ADMIN: 'Admin',
};

export const EMPLOYEE_FORM_ROLE_OPTIONS = [
  { value: ROLES.EMPLOYEE, label: 'Employee' },
  { value: ROLES.TELECALLER, label: 'Telecaller' },
  { value: ROLES.LEAD, label: 'Lead' },
  { value: ROLES.ADMIN, label: 'Admin' },
];

export const normalizeRole = (role) => {
  const value = String(role || '').trim();
  if (!value) return '';

  const map = {
    superadmin: ROLES.ADMIN,
    Superadmin: ROLES.ADMIN,
    admin: ROLES.ADMIN,
    Admin: ROLES.ADMIN,
    telecaller: ROLES.TELECALLER,
    Telecaller: ROLES.TELECALLER,
    lead: ROLES.LEAD,
    Lead: ROLES.LEAD,
    employee: ROLES.EMPLOYEE,
    Employee: ROLES.EMPLOYEE,
  };

  return map[value] || map[value.toLowerCase()] || value;
};

export const SALES_ROLES = [ROLES.TELECALLER, ROLES.LEAD];

export const isSalesRole = (role) => SALES_ROLES.includes(normalizeRole(role));

export const isTelecallerRole = (role) => normalizeRole(role) === ROLES.TELECALLER;

export const isLeadRole = (role) => normalizeRole(role) === ROLES.LEAD;

export const isAdminRole = (role) => {
  const normalized = normalizeRole(role);
  return normalized === ROLES.ADMIN;
};

export const isEmployeeRole = (role) => normalizeRole(role) === ROLES.EMPLOYEE;

export const isSalesAgent = (employee) =>
  isSalesRole(employee?.role);
