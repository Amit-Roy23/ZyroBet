/**
 * Web-safe Sentry wrapper.
 * Avoids loading @sentry/react-native native binary wrappers on web.
 */
export const Sentry = {
  init: (_options?: any) => {},
  captureException: (error: any) => {
    if (__DEV__) console.warn('[Sentry.web] Exception captured:', error);
  },
  captureMessage: (msg: string) => {
    if (__DEV__) console.warn('[Sentry.web] Message captured:', msg);
  },
  addBreadcrumb: (_breadcrumb: any) => {},
  setUser: (_user: any) => {},
};

export function initSentry(_options?: any): void {
  // Safe web no-op or browser Sentry if configured
}

export function captureException(error: any, _context?: any): void {
  if (__DEV__) {
    console.warn('[Sentry.web] captureException:', error);
  }
}

export function addBreadcrumb(_breadcrumb: any): void {
  // Safe web no-op
}
