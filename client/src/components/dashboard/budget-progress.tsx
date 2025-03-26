import { useMemo } from "react";
import { Budget, Transaction, Category } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { startOfMonth, endOfMonth } from "date-fns";

interface BudgetProgressProps {
  budgets?: Budget[];
  transactions?: Transaction[];
  categories?: Category[];
}

export default function BudgetProgress({ budgets, transactions, categories }: BudgetProgressProps) {
  const [, navigate] = useLocation();
  
  // Calculate budget progress
  const budgetsWithProgress = useMemo(() => {
    if (!budgets || !transactions || !categories) return [];
    
    // Get only monthly budgets for display
    const monthlyBudgets = budgets.filter(budget => budget.period === 'monthly');
    
    // Current date ranges for monthly budget
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    
    const processedBudgets = monthlyBudgets.map(budget => {
      // Get category
      const category = categories.find(c => c.id === budget.categoryId);
      if (!category) return null;
      
      // Calculate spent amount for this budget
      const spent = transactions
        .filter(t => 
          t.categoryId === budget.categoryId && 
          new Date(t.date) >= monthStart && 
          new Date(t.date) <= monthEnd && 
          t.amount < 0
        )
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      // Calculate percentage and status
      const percentage = (spent / budget.amount) * 100;
      const remaining = budget.amount - spent;
      const isOver = spent > budget.amount;
      
      return {
        ...budget,
        category,
        spent,
        remaining,
        percentage,
        isOver
      };
    }).filter(Boolean) as (Budget & {
      category: Category;
      spent: number;
      remaining: number;
      percentage: number;
      isOver: boolean;
    })[];
    
    // Sort by percentage (highest first)
    return processedBudgets.sort((a, b) => b.percentage - a.percentage);
  }, [budgets, transactions, categories]);
  
  // Get color based on percentage
  const getColorClass = (percentage: number) => {
    if (percentage >= 100) return "bg-red-500";
    if (percentage >= 85) return "bg-yellow-500";
    return "bg-primary-500";
  };
  
  // Get only the top 3 budgets to display
  const topBudgets = useMemo(() => {
    return budgetsWithProgress.slice(0, 3);
  }, [budgetsWithProgress]);
  
  // Handle view all budgets
  const handleViewAll = () => {
    navigate('/budgets');
  };
  
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-neutral-800">Budget Progress</h2>
        <Button 
          variant="link" 
          onClick={handleViewAll}
          className="text-sm text-primary-500 hover:text-primary-700 font-medium"
        >
          View All
        </Button>
      </div>
      
      {budgetsWithProgress.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-neutral-500">No budgets found. Create a budget to track your spending.</p>
            <Button 
              className="mt-4 bg-primary-500 hover:bg-primary-600"
              onClick={() => navigate('/budgets')}
            >
              Create Budget
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topBudgets.map(budget => (
            <Card key={budget.id} className="border border-neutral-200">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg bg-opacity-10 mr-3`} style={{ backgroundColor: budget.category.color }}>
                      <i className={`fas fa-${budget.category.icon}`}></i>
                    </div>
                    <span className="font-medium text-neutral-800">{budget.category.name}</span>
                  </div>
                  <span className="text-sm font-medium text-neutral-500">
                    ${budget.spent.toFixed(2)} / ${budget.amount.toFixed(2)}
                  </span>
                </div>
                
                <div className="w-full bg-neutral-200 rounded-full h-2.5">
                  <div 
                    className={`${getColorClass(budget.percentage)} h-2.5 rounded-full`} 
                    style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                  />
                </div>
                
                {budget.isOver ? (
                  <div className="mt-2 text-xs text-red-600">
                    <span className="font-medium">Over budget by ${(budget.spent - budget.amount).toFixed(2)}</span>
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-neutral-500">
                    <span className={`${getColorClass(budget.percentage).replace('bg-', 'text-')} font-medium`}>
                      {budget.percentage.toFixed(0)}%
                    </span> of budget spent
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
