import { 
  users, type User, type InsertUser,
  accounts, type Account, type InsertAccount,
  categories, type Category, type InsertCategory,
  transactions, type Transaction, type InsertTransaction,
  budgets, type Budget, type InsertBudget
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// modify the interface with any CRUD methods
// you might need
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
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private accounts: Map<number, Account>;
  private categories: Map<number, Category>;
  private transactions: Map<number, Transaction>;
  private budgets: Map<number, Budget>;
  
  sessionStore: session.SessionStore;
  
  private userCurrentId: number;
  private accountCurrentId: number;
  private categoryCurrentId: number;
  private transactionCurrentId: number;
  private budgetCurrentId: number;

  constructor() {
    this.users = new Map();
    this.accounts = new Map();
    this.categories = new Map();
    this.transactions = new Map();
    this.budgets = new Map();
    
    this.userCurrentId = 1;
    this.accountCurrentId = 1;
    this.categoryCurrentId = 1;
    this.transactionCurrentId = 1;
    this.budgetCurrentId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    
    // Initialize default categories
    this.initializeDefaultCategories();
  }
  
  private initializeDefaultCategories() {
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
    
    defaultCategories.forEach(category => {
      this.createCategory(category);
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Account methods
  async getAccounts(userId: number): Promise<Account[]> {
    return Array.from(this.accounts.values()).filter(
      (account) => account.userId === userId,
    );
  }
  
  async getAccount(id: number): Promise<Account | undefined> {
    return this.accounts.get(id);
  }
  
  async createAccount(account: InsertAccount): Promise<Account> {
    const id = this.accountCurrentId++;
    const newAccount: Account = { ...account, id };
    this.accounts.set(id, newAccount);
    return newAccount;
  }
  
  async updateAccount(id: number, accountUpdate: Partial<Account>): Promise<Account | undefined> {
    const account = this.accounts.get(id);
    if (!account) return undefined;
    
    const updatedAccount = { ...account, ...accountUpdate };
    this.accounts.set(id, updatedAccount);
    return updatedAccount;
  }
  
  async deleteAccount(id: number): Promise<boolean> {
    return this.accounts.delete(id);
  }
  
  // Category methods
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }
  
  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }
  
  async createCategory(category: InsertCategory): Promise<Category> {
    const id = this.categoryCurrentId++;
    const newCategory: Category = { ...category, id };
    this.categories.set(id, newCategory);
    return newCategory;
  }
  
  // Transaction methods
  async getTransactions(userId: number, filters?: Partial<Transaction>): Promise<Transaction[]> {
    let transactions = Array.from(this.transactions.values()).filter(
      (transaction) => transaction.userId === userId,
    );
    
    if (filters) {
      if (filters.accountId) {
        transactions = transactions.filter(t => t.accountId === filters.accountId);
      }
      
      if (filters.categoryId) {
        transactions = transactions.filter(t => t.categoryId === filters.categoryId);
      }
    }
    
    // Sort by date, newest first
    return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  
  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }
  
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const id = this.transactionCurrentId++;
    const newTransaction: Transaction = { ...transaction, id };
    this.transactions.set(id, newTransaction);
    
    // Update account balance
    const account = this.accounts.get(newTransaction.accountId);
    if (account) {
      const category = newTransaction.categoryId ? this.categories.get(newTransaction.categoryId) : undefined;
      const isIncome = category?.type === 'income';
      
      const updatedBalance = account.currentBalance + (isIncome ? newTransaction.amount : -newTransaction.amount);
      this.updateAccount(account.id, { currentBalance: updatedBalance });
    }
    
    return newTransaction;
  }
  
  async updateTransaction(id: number, transactionUpdate: Partial<Transaction>): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(id);
    if (!transaction) return undefined;
    
    // If amount or category changed, we need to adjust account balance
    if ((transactionUpdate.amount !== undefined && transactionUpdate.amount !== transaction.amount) ||
        (transactionUpdate.categoryId !== undefined && transactionUpdate.categoryId !== transaction.categoryId)) {
      
      const account = this.accounts.get(transaction.accountId);
      if (account) {
        // Revert old transaction effect
        const oldCategory = transaction.categoryId ? this.categories.get(transaction.categoryId) : undefined;
        const wasIncome = oldCategory?.type === 'income';
        account.currentBalance -= (wasIncome ? transaction.amount : -transaction.amount);
        
        // Apply new transaction effect
        const newCategory = transactionUpdate.categoryId !== undefined ? 
          this.categories.get(transactionUpdate.categoryId) : oldCategory;
        const isIncome = newCategory?.type === 'income';
        const amount = transactionUpdate.amount !== undefined ? transactionUpdate.amount : transaction.amount;
        account.currentBalance += (isIncome ? amount : -amount);
        
        this.accounts.set(account.id, account);
      }
    }
    
    const updatedTransaction = { ...transaction, ...transactionUpdate };
    this.transactions.set(id, updatedTransaction);
    return updatedTransaction;
  }
  
  async deleteTransaction(id: number): Promise<boolean> {
    const transaction = this.transactions.get(id);
    if (!transaction) return false;
    
    // Update account balance
    const account = this.accounts.get(transaction.accountId);
    if (account) {
      const category = transaction.categoryId ? this.categories.get(transaction.categoryId) : undefined;
      const isIncome = category?.type === 'income';
      
      const updatedBalance = account.currentBalance - (isIncome ? transaction.amount : -transaction.amount);
      this.updateAccount(account.id, { currentBalance: updatedBalance });
    }
    
    return this.transactions.delete(id);
  }
  
  // Budget methods
  async getBudgets(userId: number): Promise<Budget[]> {
    return Array.from(this.budgets.values()).filter(
      (budget) => budget.userId === userId,
    );
  }
  
  async getBudget(id: number): Promise<Budget | undefined> {
    return this.budgets.get(id);
  }
  
  async createBudget(budget: InsertBudget): Promise<Budget> {
    const id = this.budgetCurrentId++;
    const newBudget: Budget = { ...budget, id };
    this.budgets.set(id, newBudget);
    return newBudget;
  }
  
  async updateBudget(id: number, budgetUpdate: Partial<Budget>): Promise<Budget | undefined> {
    const budget = this.budgets.get(id);
    if (!budget) return undefined;
    
    const updatedBudget = { ...budget, ...budgetUpdate };
    this.budgets.set(id, updatedBudget);
    return updatedBudget;
  }
  
  async deleteBudget(id: number): Promise<boolean> {
    return this.budgets.delete(id);
  }
}

export const storage = new MemStorage();
