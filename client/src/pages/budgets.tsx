import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Sidebar from "@/components/sidebar";
import TopNav from "@/components/top-nav";
import { Loader2, Plus, PieChart, Filter } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Budget, Category, Transaction } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const budgetFormSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  amount: z.string().transform(val => parseFloat(val)),
  period: z.string().min(1, "Budget period is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
});

type BudgetFormValues = z.infer<typeof budgetFormSchema>;

export default function Budgets() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isAddBudgetOpen, setIsAddBudgetOpen] = useState(false);
  
  // Form setup
  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      categoryId: "",
      amount: "0.00",
      period: "monthly",
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: "",
    }
  });
  
  // Fetch budgets
  const { data: budgets, isLoading: isLoadingBudgets } = useQuery<Budget[]>({
    queryKey: ['/api/budgets'],
  });
  
  // Fetch categories
  const { data: categories, isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });
  
  // Fetch transactions
  const { data: transactions, isLoading: isLoadingTransactions } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
  });
  
  // Add budget mutation
  const addBudgetMutation = useMutation({
    mutationFn: async (values: BudgetFormValues) => {
      const budgetData = {
        ...values,
        categoryId: parseInt(values.categoryId),
        amount: values.amount,
        startDate: new Date(values.startDate).toISOString(),
        endDate: values.endDate ? new Date(values.endDate).toISOString() : undefined,
      };
      
      const res = await apiRequest("POST", "/api/budgets", budgetData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/budgets'] });
      setIsAddBudgetOpen(false);
      form.reset({
        categoryId: "",
        amount: "0.00",
        period: "monthly",
        startDate: format(new Date(), "yyyy-MM-dd"),
        endDate: "",
      });
      toast({
        title: "Budget added",
        description: "Your budget has been added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add budget",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const onSubmit = (values: BudgetFormValues) => {
    addBudgetMutation.mutate(values);
  };
  
  const toggleMobileNav = () => {
    setIsMobileNavOpen(!isMobileNavOpen);
  };
  
  // Helper function to get spending for a budget
  const getSpendingForBudget = (budget: Budget) => {
    if (!transactions) return 0;
    
    const now = new Date();
    const startDate = new Date(budget.startDate);
    const endDate = budget.endDate ? new Date(budget.endDate) : now;
    
    // If budget period is monthly, adjust dates to current month
    let periodStart = startDate;
    let periodEnd = endDate;
    
    if (budget.period === 'monthly') {
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (budget.period === 'weekly') {
      const day = now.getDay();
      periodStart = new Date(now.setDate(now.getDate() - day));
      periodEnd = new Date(now.setDate(periodStart.getDate() + 6));
    }
    
    return transactions
      .filter(t => 
        t.categoryId === budget.categoryId && 
        new Date(t.date) >= periodStart && 
        new Date(t.date) <= periodEnd
      )
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  };
  
  const isLoading = isLoadingBudgets || isLoadingCategories || isLoadingTransactions;
  
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
      </div>
    );
  }
  
  // Prepare budgets with spending data
  const budgetsWithSpending = budgets?.map(budget => {
    const spent = getSpendingForBudget(budget);
    const percentage = (spent / budget.amount) * 100;
    const remaining = budget.amount - spent;
    
    return {
      ...budget,
      spent,
      percentage,
      remaining,
      category: categories?.find(c => c.id === budget.categoryId)
    };
  }) || [];

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} />
      
      <div className="flex-1 overflow-y-auto bg-neutral-50">
        <TopNav onToggleSidebar={toggleMobileNav} />
        
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <h1 className="text-2xl font-bold text-neutral-800">Budget Management</h1>
            <Dialog open={isAddBudgetOpen} onOpenChange={setIsAddBudgetOpen}>
              <DialogTrigger asChild>
                <Button className="mt-4 md:mt-0 bg-primary-500 hover:bg-primary-600">
                  <Plus className="mr-2 h-4 w-4" /> Create Budget
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New Budget</DialogTitle>
                  <DialogDescription>
                    Set a spending limit for a specific category.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories?.filter(c => c.type === 'expense').map(category => (
                                <SelectItem key={category.id} value={category.id.toString()}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Budget Amount</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="period"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Budget Period</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select period" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="yearly">Yearly</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date (Optional)</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit" disabled={addBudgetMutation.isPending}>
                        {addBudgetMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Budget
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Budget Summary */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Monthly Budget Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 flex flex-col">
                  <span className="text-sm text-neutral-500">Total Budgeted</span>
                  <span className="text-2xl font-bold">
                    ${budgetsWithSpending
                      .filter(b => b.period === 'monthly')
                      .reduce((sum, b) => sum + b.amount, 0)
                      .toFixed(2)}
                  </span>
                </div>
                <div className="flex-1 flex flex-col">
                  <span className="text-sm text-neutral-500">Total Spent</span>
                  <span className="text-2xl font-bold">
                    ${budgetsWithSpending
                      .filter(b => b.period === 'monthly')
                      .reduce((sum, b) => sum + b.spent, 0)
                      .toFixed(2)}
                  </span>
                </div>
                <div className="flex-1 flex flex-col">
                  <span className="text-sm text-neutral-500">Remaining</span>
                  <span className="text-2xl font-bold">
                    ${budgetsWithSpending
                      .filter(b => b.period === 'monthly')
                      .reduce((sum, b) => sum + b.remaining, 0)
                      .toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Budget List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgetsWithSpending.length === 0 ? (
              <Card className="md:col-span-2 lg:col-span-3">
                <CardContent className="pt-6 text-center">
                  <PieChart className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
                  <h3 className="text-lg font-medium mb-2">No budgets yet</h3>
                  <p className="text-muted-foreground">
                    Create your first budget to start tracking your spending.
                  </p>
                  <Button className="mt-4 bg-primary-500 hover:bg-primary-600" onClick={() => setIsAddBudgetOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Create Budget
                  </Button>
                </CardContent>
              </Card>
            ) : (
              budgetsWithSpending.map(budget => (
                <BudgetCard key={budget.id} budget={budget} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BudgetCard({ budget }: { budget: any }) {
  // Calculate progress color
  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return "bg-red-500";
    if (percentage >= 85) return "bg-yellow-500";
    return "bg-primary-500";
  };
  
  // Format period
  const formatPeriod = (period: string) => {
    return period.charAt(0).toUpperCase() + period.slice(1);
  };
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg mr-3 ${budget.category ? `bg-opacity-10 bg-${budget.category.color}` : 'bg-neutral-100'}`}>
              <i className={`fas fa-${budget.category?.icon || 'question'}`}></i>
            </div>
            <span className="font-medium text-neutral-800">{budget.category?.name || 'Unknown'}</span>
          </div>
          <span className="text-sm font-medium text-neutral-500">
            ${budget.spent.toFixed(2)} / ${budget.amount.toFixed(2)}
          </span>
        </div>
        
        <Progress 
          value={Math.min(budget.percentage, 100)} 
          className="h-2.5 bg-neutral-200" 
          indicatorClassName={getProgressColor(budget.percentage)} 
        />
        
        <div className="mt-2 flex justify-between text-xs">
          <span className={`font-medium ${budget.percentage >= 100 ? 'text-red-600' : budget.percentage >= 85 ? 'text-yellow-600' : 'text-primary-700'}`}>
            {budget.percentage.toFixed(0)}% of budget spent
          </span>
          <span className="text-neutral-500">{formatPeriod(budget.period)}</span>
        </div>
        
        {budget.percentage >= 100 && (
          <div className="mt-2 text-xs text-red-600">
            <span className="font-medium">Over budget by ${(budget.spent - budget.amount).toFixed(2)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
