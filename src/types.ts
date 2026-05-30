export interface ExpenseItem {
  name: string;
  price: number;
  quantity?: number;
}

export interface Expense {
  id: string;
  merchant: string;
  amount: number;
  date: string; // YYYY-MM-DD
  category: string;
  description: string;
  items?: ExpenseItem[];
  tax?: number;
  paymentMethod?: string;
  currency: string;
  receiptImageName?: string;
  isScanned?: boolean;
}

export interface CategoryBudget {
  category: string;
  limit: number;
}

export interface ReceiptScanResult {
  merchant: string;
  amount: number;
  date: string; // YYYY-MM-DD
  category: string;
  description: string;
  items?: ExpenseItem[];
  tax?: number;
  paymentMethod?: string;
  currency: string;
  confidenceScore?: number;
}
