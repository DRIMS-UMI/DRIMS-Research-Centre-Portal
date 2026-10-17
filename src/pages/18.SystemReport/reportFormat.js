import { format } from 'date-fns';

export const STATUS_META = {
  PASS: { label: 'Pass', className: 'bg-green-50 text-green-700 border-green-200', rgb: [21, 128, 61] },
  WARN: { label: 'Warning', className: 'bg-amber-50 text-amber-700 border-amber-200', rgb: [180, 83, 9] },
  FAIL: { label: 'Fail', className: 'bg-red-50 text-red-700 border-red-200', rgb: [185, 28, 28] },
  NOT_MEASURED: { label: 'Not measured', className: 'bg-gray-100 text-gray-600 border-gray-200', rgb: [75, 85, 99] },
};

export const SEVERITY_META = {
  HIGH: { className: 'bg-red-50 text-red-700 border-red-200', rgb: [185, 28, 28] },
  MEDIUM: { className: 'bg-amber-50 text-amber-700 border-amber-200', rgb: [180, 83, 9] },
  LOW: { className: 'bg-blue-50 text-blue-700 border-blue-200', rgb: [29, 78, 216] },
  INFO: { className: 'bg-gray-100 text-gray-600 border-gray-200', rgb: [75, 85, 99] },
};

// Categorical slots, fixed order (validated: adjacent CVD ΔE ≥ 9.1 on light surface).
export const SERIES_COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100'];

export const ACCESS_LABELS = {
  ROLE_RESTRICTED: 'Role restricted',
  SELF_SERVICE: 'Own account (any role)',
  MACHINE_KEY: 'Machine key (backup script)',
  ANY_AUTHENTICATED: 'Any signed-in role',
  PUBLIC_EXPECTED: 'Public (intended)',
  PUBLIC_UNEXPECTED: 'Public (unexpected)',
};

export const EVENT_LABELS = {
  UNAUTHENTICATED: 'No token (401)',
  INVALID_TOKEN: 'Invalid token (401)',
  TOKEN_EXPIRED: 'Expired token (401)',
  TOKEN_REVOKED: 'Revoked token (401)',
  RBAC_DENIED: 'Role denied (403)',
  READONLY_BLOCKED: 'Auditor write blocked (403)',
  LOGIN_FAILED: 'Failed login',
  RATE_LIMITED: 'Rate limited (429)',
};

export const fmtDateTime = (value) => (value ? format(new Date(value), 'dd MMM yyyy HH:mm') : '—');
export const fmtDate = (value) => (value ? format(new Date(value), 'dd MMM yyyy') : '—');
export const fmtPercent = (value, digits = 2) => (value == null ? 'Not measured' : `${Number(value).toFixed(digits)}%`);
export const fmtNumber = (value) => (value == null ? '—' : Number(value).toLocaleString());

export const fmtDuration = (minutes) => {
  if (minutes == null) return '—';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h < 24) return m ? `${h} h ${m} min` : `${h} h`;
  const d = Math.floor(h / 24);
  return `${d} d ${h % 24} h`;
};

export const BACKUP_TYPE_LABELS = {
  SCHEDULED_DUMP: 'Scheduled backup',
  MANUAL_EXPORT: 'Manual export',
  RESTORE_TEST: 'Restore test',
  SNAPSHOT: 'Snapshot',
};

const STEP_LABELS = { OK: 'OK', FAILED: 'Failed', SKIPPED: 'Skipped', MISMATCH: 'Mismatch' };
/** Backup stage result (off-site / Atlas mirror / verify); blank for manual records. */
export const stepText = (value) => (value ? STEP_LABELS[value] || value : '—');

/** "Allowed roles" cell text for an RBAC matrix row. */
export const allowedRolesText = (route) => {
  if (route.roles) return route.roles.join(', ');
  if (!route.authenticated) return 'None (public)';
  if (route.access === 'MACHINE_KEY') return 'Backup script key only';
  return route.access === 'SELF_SERVICE' ? 'Any signed-in (own account only)' : 'Any signed-in';
};

export const fileStamp = (report) => `DRIMS_System_Report_${report.meta.from}_to_${report.meta.to}`;
