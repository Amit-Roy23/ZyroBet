import * as StoreReview from 'expo-store-review';

export async function requestStoreReview(): Promise<void> {
  try {
    const isAvailable = await StoreReview.isAvailableAsync();
    if (isAvailable) {
      await StoreReview.requestReview();
    }
  } catch {
    // Ignore store review error
  }
}
