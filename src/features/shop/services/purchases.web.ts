/**
 * Purchases service - Web platform stub
 * Web platform does not support Apple StoreKit / Google Play Billing IAP.
 * In-app purchases are disabled on web.
 */
export const canPurchase = false;

export async function initializePurchases(): Promise<void> {
  // No-op on web
}
