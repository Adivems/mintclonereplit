import { Category, Account, Transaction } from "@shared/schema";
import { format } from "date-fns";

/**
 * Format currency with dollar sign and two decimal places
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Format percentage with % sign
 */
export function formatPercentage(value: number, decimalPlaces: number = 1): string {
  return `${value.toFixed(decimalPlaces)}%`;
}

/**
 * Format date in a user-friendly way
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'MMM d, yyyy');
}

/**
 * Get color class for account type
 */
export function getAccountColorClass(type: string): string {
  switch (type) {
    case 'checking':
      return 'bg-blue-50 text-secondary-500';
    case 'savings':
      return 'bg-green-50 text-primary-500';
    case 'credit_card':
      return 'bg-purple-50 text-accent-500';
    case 'investment':
      return 'bg-yellow-50 text-yellow-500';
    default:
      return 'bg-neutral-100 text-neutral-500';
  }
}

/**
 * Get icon for account type
 */
export function getAccountIcon(type: string): string {
  switch (type) {
    case 'checking':
      return 'university';
    case 'savings':
      return 'piggy-bank';
    case 'credit_card':
      return 'credit-card';
    case 'investment':
      return 'chart-line';
    default:
      return 'university';
  }
}

/**
 * Get icon for transaction based on category
 */
export function getTransactionIcon(transaction: Transaction, categories: Category[]): string {
  if (!transaction.categoryId) return 'question';
  
  const category = categories.find(c => c.id === transaction.categoryId);
  return category?.icon || 'question';
}

/**
 * Format account type for display (e.g., 'credit_card' -> 'Credit Card')
 */
export function formatAccountType(type: string): string {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get appropriate color class for budget progress percentage
 */
export function getBudgetProgressColorClass(percentage: number): string {
  if (percentage >= 100) return 'bg-red-500';
  if (percentage >= 85) return 'bg-yellow-500';
  return 'bg-primary-500';
}

/**
 * Get appropriate text color class for budget progress percentage
 */
export function getBudgetProgressTextColorClass(percentage: number): string {
  if (percentage >= 100) return 'text-red-600';
  if (percentage >= 85) return 'text-yellow-600';
  return 'text-primary-700';
}

/**
 * Get color for transaction amount (positive for income, negative for expense)
 */
export function getTransactionAmountColorClass(amount: number): string {
  return amount >= 0 ? 'text-primary-600' : 'text-red-600';
}

/**
 * Get last 4 digits of account number
 */
export function getLastFourDigits(accountNumber: string): string {
  return accountNumber.slice(-4);
}

/**
 * Get month-to-date percentage change for an account
 */
export function calculateMTDPercentageChange(account: Account, transactions: Transaction[]): number {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // Get month-to-date transactions for this account
  const monthTransactions = transactions.filter(
    t => t.accountId === account.id && new Date(t.date) >= startOfMonth
  );
  
  // Calculate the total change
  const monthlyChange = monthTransactions.reduce((sum, t) => sum + t.amount, 0);
  
  // Calculate percentage change
  if (account.currentBalance === 0 || (account.currentBalance - monthlyChange) === 0) {
    return 0;
  }
  
  return (monthlyChange / (account.currentBalance - monthlyChange)) * 100;
}
