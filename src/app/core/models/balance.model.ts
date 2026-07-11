export interface Balance {
  userId: string;
  balance: number;
  currency: string;
  availableBalance: number;
  pendingBalance: number;
  lastUpdated: string;
}

export interface UserBalanceResponse {
  userId: string;
  balance: number;
  currency: string;
  availableBalance: number;
  pendingBalance: number;
  lastUpdated: string;
}
