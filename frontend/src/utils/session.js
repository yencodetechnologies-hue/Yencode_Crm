const SALES_ROLES = ['Lead', 'Telecaller', 'TeamLeader'];

export const isSalesRole = (role) => SALES_ROLES.includes(role);

/** Sales staff: 8-hour shift session. Others: 30 minutes idle timeout. */
export const getSessionDurationMs = (role) => {
  const r = role || localStorage.getItem('role');
  if (isSalesRole(r)) {
    return 8 * 60 * 60 * 1000;
  }
  return 30 * 60 * 1000;
};

export const refreshSession = () => {
  const expirationTime = Date.now() + getSessionDurationMs();
  localStorage.setItem('tokenExpiration', expirationTime.toString());
};

export const isSessionExpired = () => {
  const empId = localStorage.getItem('empId');
  if (!empId) return true;

  const expirationTime = localStorage.getItem('tokenExpiration');
  if (!expirationTime) {
    refreshSession();
    return false;
  }

  return Date.now() > parseInt(expirationTime, 10);
};
