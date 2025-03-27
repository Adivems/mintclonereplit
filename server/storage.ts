import { 
  users, type User, type InsertUser,
  accounts, type Account, type InsertAccount,
  categories, type Category, type InsertCategory,
  transactions, type Transaction, type InsertTransaction,
  budgets, type Budget, type InsertBudget,
  achievements, type Achievement, type InsertAchievement,
  userAchievements, type UserAchievement, type InsertUserAchievement
} from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

// Interface defining storage operations
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Account methods
  getAccounts(userId: number): Promise<Account[]>;
  getAccount(id: number): Promise<Account | undefined>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(id: number, account: Partial<Account>): Promise<Account | undefined>;
  deleteAccount(id: number): Promise<boolean>;
  
  // Category methods
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Transaction methods
  getTransactions(userId: number, filters?: Partial<Transaction>): Promise<Transaction[]>;
  getTransaction(id: number): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, transaction: Partial<Transaction>): Promise<Transaction | undefined>;
  deleteTransaction(id: number): Promise<boolean>;
  
  // Budget methods
  getBudgets(userId: number): Promise<Budget[]>;
  getBudget(id: number): Promise<Budget | undefined>;
  createBudget(budget: InsertBudget): Promise<Budget>;
  updateBudget(id: number, budget: Partial<Budget>): Promise<Budget | undefined>;
  deleteBudget(id: number): Promise<boolean>;
  
  // Achievement methods
  getAchievements(): Promise<Achievement[]>;
  getAchievement(id: number): Promise<Achievement | undefined>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  getUserAchievements(userId: number): Promise<(UserAchievement & { achievement: Achievement })[]>;
  awardAchievement(userAchievement: InsertUserAchievement): Promise<UserAchievement>;
  markAchievementViewed(id: number): Promise<UserAchievement | undefined>;
  
  // Session store
  sessionStore: session.Store;
}

// PostgreSQL Session Store
const PostgresSessionStore = connectPg(session);

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      conObject: {
        connectionString: process.env.DATABASE_URL,
      },
      createTableIfMissing: true 
    });
    
    // Initialize default categories
    this.initializeDefaultCategories();
  }
  
  private async initializeDefaultCategories() {
    try {
      const existingCategories = await this.getCategories();
      
      // Only add default categories if none exist
      if (existingCategories.length === 0) {
        const defaultCategories: InsertCategory[] = [
          { name: 'Housing', type: 'expense', icon: 'home', color: '#60A5FA' },
          { name: 'Food', type: 'expense', icon: 'utensils', color: '#34D399' },
          { name: 'Transportation', type: 'expense', icon: 'car', color: '#FBBF24' },
          { name: 'Entertainment', type: 'expense', icon: 'film', color: '#F87171' },
          { name: 'Shopping', type: 'expense', icon: 'shopping-bag', color: '#A78BFA' },
          { name: 'Utilities', type: 'expense', icon: 'bolt', color: '#FDBA74' },
          { name: 'Healthcare', type: 'expense', icon: 'heartbeat', color: '#F472B6' },
          { name: 'Personal', type: 'expense', icon: 'user', color: '#6EE7B7' },
          { name: 'Debt', type: 'expense', icon: 'credit-card', color: '#94A3B8' },
          { name: 'Income', type: 'income', icon: 'dollar-sign', color: '#10B981' },
          { name: 'Investments', type: 'income', icon: 'chart-line', color: '#3B82F6' },
          { name: 'Other', type: 'expense', icon: 'ellipsis-h', color: '#9CA3AF' }
        ];
      
        for (const category of defaultCategories) {
          await this.createCategory(category);
        }
      }
    } catch (error) {
      console.error("Error initializing default categories:", error);
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  // Account methods
  async getAccounts(userId: number): Promise<Account[]> {
    return db.select().from(accounts).where(eq(accounts.userId, userId));
  }

  async getAccount(id: number): Promise<Account | undefined> {
    const [account] = await db.select().from(accounts).where(eq(accounts.id, id));
    return account || undefined;
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    const [newAccount] = await db
      .insert(accounts)
      .values(account)
      .returning();
    return newAccount;
  }

  async updateAccount(id: number, accountUpdate: Partial<Account>): Promise<Account | undefined> {
    const [updated] = await db
      .update(accounts)
      .set(accountUpdate)
      .where(eq(accounts.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteAccount(id: number): Promise<boolean> {
    // First delete related transactions
    await db.delete(transactions).where(eq(transactions.accountId, id));
    
    // Then delete the account
    await db.delete(accounts).where(eq(accounts.id, id));
    return true;
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    return db.select().from(categories);
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category || undefined;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db
      .insert(categories)
      .values(category)
      .returning();
    return newCategory;
  }

  // Transaction methods
  async getTransactions(userId: number, filters?: Partial<Transaction>): Promise<Transaction[]> {
    // Start with base query
    let conditions = eq(transactions.userId, userId);
    
    // Add filters if they exist
    if (filters) {
      if (filters.accountId !== undefined) {
        conditions = and(conditions, eq(transactions.accountId, filters.accountId));
      }
      if (filters.categoryId !== undefined) {
        conditions = and(conditions, eq(transactions.categoryId, filters.categoryId));
      }
    }
    
    // Execute query with conditions and sort by date descending
    return db
      .select()
      .from(transactions)
      .where(conditions)
      .orderBy(desc(transactions.date));
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction || undefined;
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    // First create the transaction
    const [newTransaction] = await db
      .insert(transactions)
      .values(transaction)
      .returning();
    
    // Then update account balance
    const account = await this.getAccount(transaction.accountId);
    if (account) {
      const category = transaction.categoryId
        ? await this.getCategory(transaction.categoryId)
        : undefined;
      const isIncome = category?.type === 'income';
      
      const updatedBalance = account.currentBalance + (isIncome ? transaction.amount : -transaction.amount);
      await this.updateAccount(account.id, { currentBalance: updatedBalance });
    }
    
    return newTransaction;
  }

  async updateTransaction(id: number, transactionUpdate: Partial<Transaction>): Promise<Transaction | undefined> {
    // Get current transaction
    const currentTransaction = await this.getTransaction(id);
    if (!currentTransaction) return undefined;
    
    // If amount or category changed, adjust account balance
    if ((transactionUpdate.amount !== undefined && transactionUpdate.amount !== currentTransaction.amount) ||
        (transactionUpdate.categoryId !== undefined && transactionUpdate.categoryId !== currentTransaction.categoryId)) {
      
      const account = await this.getAccount(currentTransaction.accountId);
      if (account) {
        // Revert old transaction effect
        const oldCategory = currentTransaction.categoryId
          ? await this.getCategory(currentTransaction.categoryId)
          : undefined;
        const wasIncome = oldCategory?.type === 'income';
        let updatedBalance = account.currentBalance - (wasIncome ? currentTransaction.amount : -currentTransaction.amount);
        
        // Apply new transaction effect
        const newCategoryId = transactionUpdate.categoryId !== undefined
          ? transactionUpdate.categoryId
          : currentTransaction.categoryId;
        const newCategory = newCategoryId
          ? await this.getCategory(newCategoryId)
          : undefined;
        const isIncome = newCategory?.type === 'income';
        const amount = transactionUpdate.amount !== undefined
          ? transactionUpdate.amount
          : currentTransaction.amount;
        updatedBalance += (isIncome ? amount : -amount);
        
        // Update the account balance
        await this.updateAccount(account.id, { currentBalance: updatedBalance });
      }
    }
    
    // Update the transaction
    const [updated] = await db
      .update(transactions)
      .set(transactionUpdate)
      .where(eq(transactions.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteTransaction(id: number): Promise<boolean> {
    // Get the transaction first
    const transaction = await this.getTransaction(id);
    if (!transaction) return false;
    
    // Update account balance
    const account = await this.getAccount(transaction.accountId);
    if (account) {
      const category = transaction.categoryId
        ? await this.getCategory(transaction.categoryId)
        : undefined;
      const isIncome = category?.type === 'income';
      
      const updatedBalance = account.currentBalance - (isIncome ? transaction.amount : -transaction.amount);
      await this.updateAccount(account.id, { currentBalance: updatedBalance });
    }
    
    // Delete the transaction
    await db.delete(transactions).where(eq(transactions.id, id));
    return true;
  }

  // Budget methods
  async getBudgets(userId: number): Promise<Budget[]> {
    return db.select().from(budgets).where(eq(budgets.userId, userId));
  }

  async getBudget(id: number): Promise<Budget | undefined> {
    const [budget] = await db.select().from(budgets).where(eq(budgets.id, id));
    return budget || undefined;
  }

  async createBudget(budget: InsertBudget): Promise<Budget> {
    const [newBudget] = await db
      .insert(budgets)
      .values(budget)
      .returning();
    return newBudget;
  }

  async updateBudget(id: number, budgetUpdate: Partial<Budget>): Promise<Budget | undefined> {
    const [updated] = await db
      .update(budgets)
      .set(budgetUpdate)
      .where(eq(budgets.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteBudget(id: number): Promise<boolean> {
    await db.delete(budgets).where(eq(budgets.id, id));
    return true;
  }
  
  // Achievement methods
  async getAchievements(): Promise<Achievement[]> {
    return db.select().from(achievements);
  }

  async getAchievement(id: number): Promise<Achievement | undefined> {
    const [achievement] = await db.select().from(achievements).where(eq(achievements.id, id));
    return achievement || undefined;
  }

  async createAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const [newAchievement] = await db
      .insert(achievements)
      .values(achievement)
      .returning();
    return newAchievement;
  }

  async getUserAchievements(userId: number): Promise<(UserAchievement & { achievement: Achievement })[]> {
    const userAchievementResults = await db
      .select({
        userAchievement: userAchievements,
        achievement: achievements
      })
      .from(userAchievements)
      .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
      .where(eq(userAchievements.userId, userId))
      .orderBy(desc(userAchievements.earnedAt));

    return userAchievementResults.map(result => ({
      ...result.userAchievement,
      achievement: result.achievement
    }));
  }

  async awardAchievement(userAchievement: InsertUserAchievement): Promise<UserAchievement> {
    // Check if the user already has this achievement to avoid duplicates
    const existing = await db
      .select()
      .from(userAchievements)
      .where(
        and(
          eq(userAchievements.userId, userAchievement.userId),
          eq(userAchievements.achievementId, userAchievement.achievementId)
        )
      );

    // If the user already has the achievement, don't create a new record
    if (existing.length > 0) {
      return existing[0];
    }

    // Otherwise, award the achievement
    const [newUserAchievement] = await db
      .insert(userAchievements)
      .values(userAchievement)
      .returning();
    
    return newUserAchievement;
  }

  async markAchievementViewed(id: number): Promise<UserAchievement | undefined> {
    const [updated] = await db
      .update(userAchievements)
      .set({ viewed: true })
      .where(eq(userAchievements.id, id))
      .returning();
    
    return updated || undefined;
  }
}

// Create and export the storage instance
export const storage = new DatabaseStorage();
