import { pgTable, text, serial, integer, boolean, doublePrecision, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
});

export const insertUserSchema = createInsertSchema(users)
  .pick({
    username: true,
    password: true,
    fullName: true,
    email: true,
  })
  .extend({
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    email: z.string().email("Please enter a valid email address"),
    fullName: z.string().min(1, "Full name is required"),
  });

// Financial Accounts
export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  type: text("type").notNull(), // checking, savings, credit_card, investment
  institution: text("institution").notNull(),
  accountNumber: text("account_number").notNull(),
  currentBalance: doublePrecision("current_balance").notNull(),
  availableBalance: doublePrecision("available_balance"),
  limit: doublePrecision("limit"), // for credit cards
  interestRate: doublePrecision("interest_rate"),
  lastUpdated: timestamp("last_updated").notNull(),
});

export const insertAccountSchema = createInsertSchema(accounts).omit({
  id: true,
});

// Transaction Categories
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // income, expense
  icon: text("icon").notNull(),
  color: text("color").notNull(),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
});

// Transactions
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  accountId: integer("account_id").notNull().references(() => accounts.id),
  categoryId: integer("category_id").references(() => categories.id),
  date: timestamp("date").notNull(),
  merchant: text("merchant").notNull(),
  amount: doublePrecision("amount").notNull(),
  description: text("description"),
  isRecurring: boolean("is_recurring").default(false),
  notes: text("notes"),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
});

// Budgets
export const budgets = pgTable("budgets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  categoryId: integer("category_id").notNull().references(() => categories.id),
  amount: doublePrecision("amount").notNull(),
  period: text("period").notNull(), // monthly, weekly, yearly
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
});

export const insertBudgetSchema = createInsertSchema(budgets).omit({
  id: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type Budget = typeof budgets.$inferSelect;
export type InsertBudget = z.infer<typeof insertBudgetSchema>;

// Extended types for frontend use
export type AccountWithTransactions = Account & {
  transactions: Transaction[];
};

export type CategoryWithTransactions = Category & {
  transactions: Transaction[];
  total: number;
  percentage?: number;
};

export type BudgetWithCategory = Budget & {
  category: Category;
  spent: number;
  remaining: number;
  percentage: number;
};

// Achievements
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(), // Lucide icon name or SVG path
  category: text("category").notNull(), // saving, budgeting, tracking, investment
  criteria: text("criteria").notNull(), // JSON string of criteria
  backgroundColor: text("background_color").notNull(),
  textColor: text("text_color").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  createdAt: true,
});

// User Achievements (linking users to their earned achievements)
export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  achievementId: integer("achievement_id").notNull().references(() => achievements.id),
  earnedAt: timestamp("earned_at").notNull().defaultNow(),
  viewed: boolean("viewed").default(false),
});

export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({
  id: true,
  earnedAt: true,
});

export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;

export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;
