
export interface BankAccount {
  id: string;
  name: string;
  bankName: string;
  balance: number;
  color: string;
  createdAt: number;
}

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  accountId: string;
  amount: number;
  type: TransactionType;
  category: string;
  note: string;
  date: string;
  createdAt: number;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
}
