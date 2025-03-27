import { 
  type Achievement, 
  type Account, 
  type Transaction, 
  type Budget 
} from "@shared/schema";
import { type UserAchievementWithDetails } from "@/hooks/use-achievements";

// Type for achievement criteria
type AchievementCriteria = {
  action: string;
  count?: number;
  type?: string;
  unique_types?: number;
  months?: number;
  percentage?: number;
  amount?: string | number;
  features?: string[];
};

/**
 * Check if the user qualifies for any achievements they haven't earned yet
 */
export function checkForAchievements(
  achievements: Achievement[],
  userAchievements: UserAchievementWithDetails[],
  accounts: Account[],
  transactions: Transaction[],
  budgets: Budget[]
): Achievement[] {
  if (!achievements || !userAchievements || !accounts || !transactions) {
    return [];
  }
  
  // Get IDs of already earned achievements
  const earnedAchievementIds = new Set(userAchievements.map(ua => ua.achievementId));
  
  // Filter achievements that haven't been earned yet
  const availableAchievements = achievements.filter(a => !earnedAchievementIds.has(a.id));
  
  // Check each achievement to see if the user qualifies
  const newlyEarnedAchievements: Achievement[] = [];
  
  for (const achievement of availableAchievements) {
    let criteria: AchievementCriteria;
    
    try {
      criteria = JSON.parse(achievement.criteria);
    } catch (error) {
      console.error(`Invalid criteria JSON for achievement: ${achievement.name}`, error);
      continue;
    }
    
    // Determine if the user meets the criteria for this achievement
    const qualified = checkAchievementCriteria(criteria, accounts, transactions, budgets);
    
    if (qualified) {
      newlyEarnedAchievements.push(achievement);
    }
  }
  
  return newlyEarnedAchievements;
}

/**
 * Check if the user meets the criteria for a specific achievement
 */
function checkAchievementCriteria(
  criteria: AchievementCriteria,
  accounts: Account[],
  transactions: Transaction[],
  budgets: Budget[]
): boolean {
  switch (criteria.action) {
    case 'create_budget':
      // Check if the user has created at least N budgets
      return budgets.length >= (criteria.count || 1);
      
    case 'add_account':
      // Check if the user has added an account of specific type
      if (criteria.type) {
        return accounts.some(account => account.type === criteria.type);
      }
      return accounts.length >= (criteria.count || 1);
      
    case 'add_transaction':
      // Check if the user has added at least N transactions
      return transactions.length >= (criteria.count || 1);
      
    case 'add_accounts':
      // Check if the user has added accounts of N different types
      if (criteria.unique_types) {
        const uniqueTypes = new Set(accounts.map(account => account.type));
        return uniqueTypes.size >= criteria.unique_types;
      }
      return false;
      
    case 'budget_success':
      // Check if the user has stayed under budget for a month
      // This is a more complex check that would require more data
      // For now, let's simplify by assuming qualifying budgets are those that are less than 80% spent
      if (budgets.length === 0) return false;
      
      // Get the current month's transactions
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentMonthTransactions = transactions.filter(t => {
        const txDate = new Date(t.date);
        return txDate >= startOfMonth;
      });
      
      // Count how many budgets are under their limit
      let budgetsUnderLimit = 0;
      
      for (const budget of budgets) {
        const relevantTransactions = currentMonthTransactions.filter(t => 
          t.categoryId === budget.categoryId
        );
        
        const totalSpent = relevantTransactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
        
        if (totalSpent <= budget.amount * 0.8) {
          budgetsUnderLimit++;
        }
      }
      
      return budgetsUnderLimit >= (criteria.months || 1);
      
    case 'reduce_expenses':
      // This would require historical data to compare months
      // For demonstration, let's assume this is true if the user has more income than expenses
      const incomeTransactions = transactions.filter(t => t.amount > 0);
      const expenseTransactions = transactions.filter(t => t.amount < 0);
      
      const totalIncome = incomeTransactions.reduce((sum, tx) => sum + tx.amount, 0);
      const totalExpenses = expenseTransactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
      
      return totalIncome > totalExpenses && expenseTransactions.length > 0;
      
    case 'save_percentage':
      // Check if the user is saving X% of their income
      if (!criteria.percentage) return false;
      
      const income = transactions
        .filter(t => t.amount > 0)
        .reduce((sum, tx) => sum + tx.amount, 0);
        
      if (income === 0) return false;
      
      const savings = accounts
        .filter(a => a.type === 'savings')
        .reduce((sum, a) => sum + a.currentBalance, 0);
        
      return (savings / income) * 100 >= criteria.percentage;
      
    case 'income_sources':
      // Check if the user has multiple income sources
      if (!criteria.count) return false;
      
      const incomeSourceSet = new Set(
        transactions
          .filter(t => t.amount > 0)
          .map(t => t.merchant)
      );
      
      return incomeSourceSet.size >= criteria.count;
      
    case 'pay_debt':
      // This would usually track a specific debt account being reduced
      // For demo, let's check if there are any repayment transactions to debt categories
      return transactions.some(t => t.amount < 0 && t.description?.toLowerCase().includes('payment'));
      
    case 'use_features':
      // Check if the user has used all the specified features
      if (!criteria.features) return false;
      
      const hasAccounts = accounts.length > 0;
      const hasBudgets = budgets.length > 0;
      const hasTransactions = transactions.length > 0;
      
      // This is a simplified version
      return (
        (!criteria.features.includes('accounts') || hasAccounts) &&
        (!criteria.features.includes('budgets') || hasBudgets) &&
        (!criteria.features.includes('transactions') || hasTransactions)
      );
      
    default:
      return false;
  }
}