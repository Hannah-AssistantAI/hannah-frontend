/**
 * Flagging Status Utilities
 * Handles status normalization and display for flagging system
 */

// Backend status values (as-is from API)
export const BackendStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  ASSIGNED: 'assigned',
  RESOLVED: 'resolved'
} as const;

// Frontend display status
export const DisplayStatus = {
  PENDING: 'Pending',
  ASSIGNED: 'Assigned',
  RESOLVED: 'Resolved'
} as const;

/**
 * Normalize backend status to consistent lowercase format
 */
export const normalizeStatus = (status: string): string => {
  return status.toLowerCase().trim();
};

/**
 * Get display-friendly status text
 */
export const getStatusDisplay = (status: string): string => {
  const normalized = normalizeStatus(status);

  switch (normalized) {
    case 'pending':
      return DisplayStatus.PENDING;
    case 'in_progress':
    case 'assigned':
      return DisplayStatus.ASSIGNED;
    case 'resolved':
      return DisplayStatus.RESOLVED;
    default:
      return status; // Fallback to original
  }
};

/**
 * Get status badge CSS class
 */
export const getStatusClass = (status: string): string => {
  const normalized = normalizeStatus(status);

  switch (normalized) {
    case 'pending':
      return 'status-pending';
    case 'in_progress':
    case 'assigned':
      return 'status-assigned';
    case 'resolved':
      return 'status-resolved';
    default:
      return 'status-unknown';
  }
};

/**
 * Check if flag can be resolved (not already resolved)
 */
export const canResolve = (status: string): boolean => {
  const normalized = normalizeStatus(status);
  return normalized !== 'resolved';
};

/**
 * Check if flag is resolved
 */
export const isResolved = (status: string): boolean => {
  const normalized = normalizeStatus(status);
  return normalized === 'resolved';
};

/**
 * Check if flag is pending (not yet assigned)
 */
export const isPending = (status: string): boolean => {
  const normalized = normalizeStatus(status);
  return normalized === 'pending';
};

/**
 * Check if flag is assigned (assigned to faculty, waiting for resolution)
 */
export const isAssigned = (status: string): boolean => {
  const normalized = normalizeStatus(status);
  return normalized === 'in_progress' || normalized === 'assigned';
};

/**
 * Vietnamese translations
 */
export const getStatusDisplayVi = (status: string): string => {
  const normalized = normalizeStatus(status);

  switch (normalized) {
    case 'pending':
      return 'Chờ xử lý';
    case 'in_progress':
    case 'assigned':
      return 'Đã giao việc';
    case 'resolved':
      return 'Đã giải quyết';
    default:
      return status;
  }
};
