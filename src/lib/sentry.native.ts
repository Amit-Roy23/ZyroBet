import * as Sentry from '@sentry/react-native';

export { Sentry };

export function initSentry(options?: Sentry.ReactNativeOptions): void {
  try {
    if (options) {
      Sentry.init(options);
    }
  } catch (err) {
    console.warn('[Sentry.native] Failed to initialize Sentry:', err);
  }
}

export function captureException(error: any, context?: any): void {
  try {
    Sentry.captureException(error, context);
  } catch {
    // Ignore
  }
}

export function addBreadcrumb(breadcrumb: Sentry.Breadcrumb): void {
  try {
    Sentry.addBreadcrumb(breadcrumb);
  } catch {
    // Ignore
  }
}
