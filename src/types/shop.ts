export interface CoinPack {
  id: string;
  storeProductId: string;
  coins: number;
  bonusCoins: number;
  totalCoins: number;
  priceFormatted: string;
  priceAmountMicros: number;
  currencyCode: string;
  isPopular?: boolean;
  isBestValue?: boolean;
  tag?: string;
}

export interface PurchaseResult {
  success: boolean;
  productId: string;
  coinsCredited: number;
  transactionId?: string;
  error?: string;
}
