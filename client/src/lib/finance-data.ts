import { 
  Account,
  Transaction,
  Category,
  Budget,
  CategoryWithTransactions,
  BudgetWithCategory,
  AccountWithTransactions
} from "@shared/schema";
import { startOfMonth, endOfMonth, subMonths, isWithinInterval } from "date-fns";

/**
 * Calculate net worth from accounts
 */
export function calculateNetWorth(accounts: Account[]): number {
  if (!accounts || accounts.length === 0) return 0;
  
  return accounts.reduce((total, account) => {
    return total + account.currentBalance;
  }, 0);
}

/**
 * Calculate monthly income from transactions
 */
export function calculateMonthlyIncome(transactions: Transaction[], month?: Date): number {
  if (!transactions || transactions.length === 0) return 0;
  
  const now = month || new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  
  return transactions
    .filter(t => {
      const date = new Date(t.date);
      return date >= monthStart && date <= monthEnd && t.amount > 0;
    })
    .reduce((total, t) => total + t.amount, 0);
}

/**
 * Calculate monthly spending from transactions
 */
export function calculateMonthlySpending(transactions: Transaction[], month?: Date): number {
  if (!transactions || transactions.length === 0) return 0;
  
  const now = month || new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  
  return transactions
    .filter(t => {
      const date = new Date(t.date);
      return date >= monthStart && date <= monthEnd && t.amount < 0;
    })
    .reduce((total, t) => total + Math.abs(t.amount), 0);
}

/**
 * Calculate spending by category
 */
export function calculateSpendingByCategory(
  transactions: Transaction[],
  categories: Category[],
  startDate: Date,
  endDate: Date
): CategoryWithTransactions[] {
  if (!transactions || !categories) return [];
  
  // Group transactions by category
  const categoryMap = new Map<number, Transaction[]>();
  
  // Filter transactions by date and amount (negative for expenses)
  const filteredTransactions = transactions.filter(
    t => isWithinInterval(new Date(t.date), { start: startDate, end: endDate }) && t.amount < 0
  );
  
  // Group by category
  filteredTransactions.forEach(transaction => {
    if (!transaction.categoryId) return;
    
    if (!categoryMap.has(transaction.categoryId)) {
      categoryMap.set(transaction.categoryId, []);
    }
    
    categoryMap.get(transaction.categoryId)?.push(transaction);
  });
  
  // Calculate total spending
  const totalSpending = filteredTransactions.reduce(
    (sum, t) => sum + Math.abs(t.amount), 0
  );
  
  // Map to CategoryWithTransactions
  const result: CategoryWithTransactions[] = [];
  
  categories.forEach(category => {
    const categoryTransactions = categoryMap.get(category.id) || [];
    if (categoryTransactions.length === 0) return;
    
    const total = categoryTransactions.reduce(
      (sum, t) => sum + Math.abs(t.amount), 0
    );
    
    const percentage = totalSpending > 0 ? (total / totalSpending) * 100 : 0;
    
    result.push({
      ...category,
      transactions: categoryTransactions,
      total,
      percentage
    });
  });
  
  // Sort by total (highest first)
  return result.sort((a, b) => b.total - a.total);
}

/**
 * Calculate budget progress
 */
export function calculateBudgetProgress(
  budget: Budget,
  transactions: Transaction[],
  categories: Category[]
): BudgetWithCategory {
  // Get category
  const category = categories.find(c => c.id === budget.categoryId);
  if (!category) {
    throw new Error(`Category not found for budget: ${budget.id}`);
  }
  
  // Determine date range based on budget period
  const now = new Date();
  let periodStart: Date;
  let periodEnd: Date = now;
  
  switch (budget.period) {
    case 'monthly':
      periodStart = startOfMonth(now);
      periodEnd = endOfMonth(now);
      break;
    case 'weekly':
      const day = now.getDay();
      periodStart = new Date(now);
      periodStart.setDate(now.getDate() - day);
      periodEnd = new Date(now);
      periodEnd.setDate(periodStart.getDate() + 6);
      break;
    case 'yearly':
      periodStart = new Date(now.getFullYear(), 0, 1);
      periodEnd = new Date(now.getFullYear(), 11, 31);
      break;
    default:
      periodStart = startOfMonth(now);
      periodEnd = endOfMonth(now);
  }
  
  // Calculate spent amount
  const spent = transactions
    .filter(t => 
      t.categoryId === budget.categoryId && 
      isWithinInterval(new Date(t.date), { start: periodStart, end: periodEnd }) &&
      t.amount < 0
    )
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  // Calculate progress
  const remaining = budget.amount - spent;
  const percentage = (spent / budget.amount) * 100;
  
  return {
    ...budget,
    category,
    spent,
    remaining,
    percentage
  };
}

/**
 * Enrich accounts with transactions
 */
export function enrichAccountsWithTransactions(
  accounts: Account[],
  transactions: Transaction[]
): AccountWithTransactions[] {
  return accounts.map(account => {
    const accountTransactions = transactions.filter(t => t.accountId === account.id);
    
    return {
      ...account,
      transactions: accountTransactions
    };
  });
}
