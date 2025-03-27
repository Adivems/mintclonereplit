import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import Sidebar from "@/components/sidebar";
import TopNav from "@/components/top-nav";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Filter, Plus, Search, CreditCard, Home, ShoppingBag, DollarSign, Car, Utensils, Plane, Building, Briefcase, HelpCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Transaction, Account, Category, insertTransactionSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Define the transaction form schema
const transactionFormSchema = insertTransactionSchema.extend({
  accountId: z.number({
    required_error: "Please select an account",
  }),
  categoryId: z.number({
    required_error: "Please select a category",
  }),
  date: z.date({
    required_error: "Please select a date",
  }),
  merchant: z.string({
    required_error: "Please enter a merchant name",
  }).min(2, {
    message: "Merchant name must be at least 2 characters",
  }),
  amount: z.number({
    required_error: "Please enter an amount",
  }).positive({
    message: "Amount must be greater than 0",
  }),
  description: z.string().optional(),
  isRecurring: z.boolean().default(false),
  notes: z.string().optional(),
});

// Type definition for our form
type TransactionFormValues = z.infer<typeof transactionFormSchema>;

export default function Transactions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [accountFilter, setAccountFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  // Fetch accounts
  const { data: accounts, isLoading: isLoadingAccounts } = useQuery<Account[]>({
    queryKey: ['/api/accounts'],
  });
  
  // Fetch transactions
  const { data: transactions, isLoading: isLoadingTransactions } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
  });
  
  // Fetch categories
  const { data: categories, isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });
  
  // Define form with validation
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      userId: user?.id,
      accountId: undefined,
      categoryId: undefined,
      date: new Date(),
      merchant: "",
      amount: undefined,
      description: "",
      isRecurring: false,
      notes: ""
    }
  });
  
  // Create transaction mutation
  const createTransactionMutation = useMutation({
    mutationFn: async (values: TransactionFormValues) => {
      const res = await apiRequest("POST", "/api/transactions", values);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      toast({
        title: "Transaction added",
        description: "Your transaction has been added successfully.",
        variant: "default",
      });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add transaction",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Form submission handler
  function onSubmit(values: TransactionFormValues) {
    createTransactionMutation.mutate({
      ...values,
      userId: user?.id as number
    });
  }
  
  const isLoading = isLoadingAccounts || isLoadingTransactions || isLoadingCategories;
  
  const toggleMobileNav = () => {
    setIsMobileNavOpen(!isMobileNavOpen);
  };
  
  // Filter and search transactions
  const filteredTransactions = transactions?.filter(transaction => {
    let match = true;
    
    if (searchTerm) {
      match = match && (
        transaction.merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (transaction.description?.toLowerCase() || "").includes(searchTerm.toLowerCase())
      );
    }
    
    if (accountFilter) {
      match = match && transaction.accountId === parseInt(accountFilter);
    }
    
    if (categoryFilter) {
      match = match && transaction.categoryId === parseInt(categoryFilter);
    }
    
    return match;
  }) || [];
  
  // Function to get category by ID
  const getCategoryById = (id: number | null | undefined) => {
    if (!id || !categories) return null;
    return categories.find(cat => cat.id === id);
  };
  
  // Function to get account by ID
  const getAccountById = (id: number) => {
    if (!accounts) return null;
    return accounts.find(acc => acc.id === id);
  };
  
  // Function to get appropriate icon based on category
  const getCategoryIcon = (category: Category | null | undefined) => {
    if (!category) return <HelpCircle size={16} />;
    
    switch(category.name.toLowerCase()) {
      case 'housing': return <Home size={16} />;
      case 'transportation': return <Car size={16} />;
      case 'food': return <Utensils size={16} />;
      case 'utilities': return <Building size={16} />;
      case 'insurance': return <Building size={16} />;
      case 'medical': return <Building size={16} />;
      case 'shopping': return <ShoppingBag size={16} />;
      case 'travel': return <Plane size={16} />;
      case 'income': return <DollarSign size={16} />;
      case 'salary': return <Briefcase size={16} />;
      case 'interest': return <DollarSign size={16} />;
      default: 
        return category.type === 'income' 
          ? <DollarSign size={16} /> 
          : <CreditCard size={16} />;
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} />
      
      <div className="flex-1 overflow-y-auto bg-neutral-50">
        <TopNav onToggleSidebar={toggleMobileNav} />
        
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <h1 className="text-2xl font-bold text-neutral-800">Transactions</h1>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="mt-4 md:mt-0 bg-primary text-white hover:bg-primary/90">
                  <Plus className="mr-2 h-4 w-4" /> Add Transaction
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>Add Transaction</DialogTitle>
                  <DialogDescription>
                    Enter the details of your transaction below.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <FormField
                      control={form.control}
                      name="accountId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account</FormLabel>
                          <Select 
                            value={field.value?.toString()} 
                            onValueChange={(value) => field.onChange(parseInt(value))}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select an account" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {accounts?.map(account => (
                                <SelectItem key={account.id} value={account.id.toString()}>
                                  {account.name}
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
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select 
                            value={field.value?.toString()} 
                            onValueChange={(value) => field.onChange(parseInt(value))}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories?.map(category => (
                                <SelectItem key={category.id} value={category.id.toString()}>
                                  {category.name} ({category.type})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={
                                      "w-full pl-3 text-left font-normal"
                                    }
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Amount</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01" 
                                placeholder="0.00" 
                                {...field}
                                onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="merchant"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Merchant</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter merchant name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter a description (optional)" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="isRecurring"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Recurring Transaction</FormLabel>
                            <FormDescription>
                              Mark this transaction as recurring
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Add any additional notes here" 
                              className="resize-none" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <Button 
                        type="submit" 
                        className="bg-primary text-white hover:bg-primary/90"
                        disabled={createTransactionMutation.isPending}
                      >
                        {createTransactionMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Add Transaction
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
          
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative w-full md:w-1/2">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    placeholder="Search transactions..." 
                    className="pl-9" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex flex-1 gap-4">
                  <Select value={accountFilter || ""} onValueChange={setAccountFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Accounts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Accounts</SelectItem>
                      {accounts?.map(account => (
                        <SelectItem key={account.id} value={account.id.toString()}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={categoryFilter || ""} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Categories</SelectItem>
                      {categories?.map(category => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button variant="outline" onClick={() => {
                    setSearchTerm("");
                    setAccountFilter(null);
                    setCategoryFilter(null);
                  }}>
                    <Filter className="mr-2 h-4 w-4" /> Reset
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>All Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Merchant</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          No transactions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTransactions.map(transaction => {
                        const category = getCategoryById(transaction.categoryId);
                        const account = getAccountById(transaction.accountId);
                        const isIncome = category?.type === 'income';
                        
                        return (
                          <TableRow key={transaction.id} className="hover:bg-neutral-50">
                            <TableCell>
                              <div className="flex items-center">
                                <div className={`p-2 rounded-lg mr-3 ${isIncome ? 'bg-primary/10' : 'bg-destructive/10'}`}>
                                  {getCategoryIcon(category)}
                                </div>
                                <span className="font-medium">{transaction.merchant}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {category && (
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${isIncome ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                                  {category.name}
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {format(new Date(transaction.date), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell>
                              {account?.name || "Unknown"}
                            </TableCell>
                            <TableCell className={`text-right font-medium ${isIncome ? 'text-primary' : 'text-destructive'}`}>
                              {isIncome ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
