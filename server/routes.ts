import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { 
  insertAccountSchema, 
  insertTransactionSchema, 
  insertBudgetSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // API routes
  // Accounts
  app.get("/api/accounts", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    const accounts = await storage.getAccounts(req.user!.id);
    res.json(accounts);
  });
  
  app.post("/api/accounts", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const accountData = insertAccountSchema.parse({
        ...req.body,
        userId: req.user!.id,
        lastUpdated: new Date()
      });
      
      const account = await storage.createAccount(accountData);
      res.status(201).json(account);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid account data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create account" });
    }
  });
  
  app.put("/api/accounts/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    const accountId = parseInt(req.params.id);
    const account = await storage.getAccount(accountId);
    
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }
    
    if (account.userId !== req.user!.id) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    try {
      const updatedAccount = await storage.updateAccount(accountId, {
        ...req.body,
        lastUpdated: new Date()
      });
      
      res.json(updatedAccount);
    } catch (error) {
      res.status(500).json({ message: "Failed to update account" });
    }
  });
  
  app.delete("/api/accounts/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    const accountId = parseInt(req.params.id);
    const account = await storage.getAccount(accountId);
    
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }
    
    if (account.userId !== req.user!.id) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    const deleted = await storage.deleteAccount(accountId);
    if (deleted) {
      res.status(204).send();
    } else {
      res.status(500).json({ message: "Failed to delete account" });
    }
  });
  
  // Categories
  app.get("/api/categories", async (req, res) => {
    const categories = await storage.getCategories();
    res.json(categories);
  });
  
  // Transactions
  app.get("/api/transactions", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    const filters: any = {};
    
    if (req.query.accountId) {
      filters.accountId = parseInt(req.query.accountId as string);
    }
    
    if (req.query.categoryId) {
      filters.categoryId = parseInt(req.query.categoryId as string);
    }
    
    const transactions = await storage.getTransactions(req.user!.id, filters);
    res.json(transactions);
  });
  
  app.post("/api/transactions", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      // Parse date from string if it's not already a Date object
      const transactionDataWithDate = {
        ...req.body,
        userId: req.user!.id,
        date: req.body.date ? new Date(req.body.date) : undefined
      };
      
      const transactionData = insertTransactionSchema.parse(transactionDataWithDate);
      
      // Validate that the account belongs to the user
      const account = await storage.getAccount(transactionData.accountId);
      if (!account || account.userId !== req.user!.id) {
        return res.status(403).json({ message: "Cannot add transaction to this account" });
      }
      
      const transaction = await storage.createTransaction(transactionData);
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid transaction data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });
  
  app.put("/api/transactions/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    const transactionId = parseInt(req.params.id);
    const transaction = await storage.getTransaction(transactionId);
    
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    
    if (transaction.userId !== req.user!.id) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    try {
      // Parse date from string if it's not already a Date object
      const updateData = {
        ...req.body,
        date: req.body.date ? new Date(req.body.date) : undefined
      };
      
      const updatedTransaction = await storage.updateTransaction(transactionId, updateData);
      res.json(updatedTransaction);
    } catch (error) {
      res.status(500).json({ message: "Failed to update transaction" });
    }
  });
  
  app.delete("/api/transactions/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    const transactionId = parseInt(req.params.id);
    const transaction = await storage.getTransaction(transactionId);
    
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    
    if (transaction.userId !== req.user!.id) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    const deleted = await storage.deleteTransaction(transactionId);
    if (deleted) {
      res.status(204).send();
    } else {
      res.status(500).json({ message: "Failed to delete transaction" });
    }
  });
  
  // Budgets
  app.get("/api/budgets", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    const budgets = await storage.getBudgets(req.user!.id);
    res.json(budgets);
  });
  
  app.post("/api/budgets", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      // Parse dates from strings if they're not already Date objects
      const budgetDataWithDates = {
        ...req.body,
        userId: req.user!.id,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined
      };
      
      const budgetData = insertBudgetSchema.parse(budgetDataWithDates);
      
      const budget = await storage.createBudget(budgetData);
      res.status(201).json(budget);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid budget data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create budget" });
    }
  });
  
  app.put("/api/budgets/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    const budgetId = parseInt(req.params.id);
    const budget = await storage.getBudget(budgetId);
    
    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }
    
    if (budget.userId !== req.user!.id) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    try {
      // Parse dates from strings if they're not already Date objects
      const updateData = {
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined
      };
      
      const updatedBudget = await storage.updateBudget(budgetId, updateData);
      res.json(updatedBudget);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid budget data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update budget" });
    }
  });
  
  app.delete("/api/budgets/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    const budgetId = parseInt(req.params.id);
    const budget = await storage.getBudget(budgetId);
    
    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }
    
    if (budget.userId !== req.user!.id) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    const deleted = await storage.deleteBudget(budgetId);
    if (deleted) {
      res.status(204).send();
    } else {
      res.status(500).json({ message: "Failed to delete budget" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
