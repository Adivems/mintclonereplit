import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Loader2, Plus, CreditCard, Wallet, Building, ChevronRight, BarChart3 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Account } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

const accountFormSchema = z.object({
  name: z.string().min(1, "Account name is required"),
  type: z.string().min(1, "Account type is required"),
  institution: z.string().min(1, "Institution name is required"),
  accountNumber: z.string().min(4, "Account number is required"),
  currentBalance: z.string().transform(val => parseFloat(val)),
  availableBalance: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  limit: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  interestRate: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
});

type AccountFormValues = z.infer<typeof accountFormSchema>;

export default function Accounts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  
  // Form setup
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      name: "",
      type: "checking",
      institution: "",
      accountNumber: "",
      currentBalance: 0,
      availableBalance: 0,
      limit: 0,
      interestRate: 0
    }
  });
  
  // Fetch accounts
  const { data: accounts, isLoading: isLoadingAccounts } = useQuery<Account[]>({
    queryKey: ['/api/accounts'],
  });
  
  // Add account mutation
  const addAccountMutation = useMutation({
    mutationFn: async (values: AccountFormValues) => {
      const accountData = {
        ...values,
        lastUpdated: new Date().toISOString()
      };
      
      const res = await apiRequest("POST", "/api/accounts", accountData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
      setIsAddAccountOpen(false);
      form.reset();
      toast({
        title: "Account added",
        description: "Your account has been added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add account",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const onSubmit = (values: AccountFormValues) => {
    addAccountMutation.mutate(values);
  };
  
  const toggleMobileNav = () => {
    setIsMobileNavOpen(!isMobileNavOpen);
  };
  
  // Filter accounts by type
  const checkingAccounts = accounts?.filter(acc => acc.type === 'checking') || [];
  const savingsAccounts = accounts?.filter(acc => acc.type === 'savings') || [];
  const creditCards = accounts?.filter(acc => acc.type === 'credit_card') || [];
  const investments = accounts?.filter(acc => acc.type === 'investment') || [];
  
  // Calculate totals
  const calculateTotal = (accounts: Account[]) => {
    return accounts.reduce((sum, acc) => sum + acc.currentBalance, 0);
  };
  
  const checkingTotal = calculateTotal(checkingAccounts);
  const savingsTotal = calculateTotal(savingsAccounts);
  const creditCardTotal = calculateTotal(creditCards);
  const investmentTotal = calculateTotal(investments);
  
  const netWorth = checkingTotal + savingsTotal + investmentTotal - creditCardTotal;
  
  if (isLoadingAccounts) {
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
            <h1 className="text-2xl font-bold text-neutral-800">Accounts</h1>
            <Dialog open={isAddAccountOpen} onOpenChange={setIsAddAccountOpen}>
              <DialogTrigger asChild>
                <Button className="mt-4 md:mt-0 bg-primary text-white hover:bg-primary/90">
                  <Plus className="mr-2 h-4 w-4" /> Add Account
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Account</DialogTitle>
                  <DialogDescription>
                    Enter your account details below.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Chase Checking" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Type</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select account type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="checking">Checking</SelectItem>
                              <SelectItem value="savings">Savings</SelectItem>
                              <SelectItem value="credit_card">Credit Card</SelectItem>
                              <SelectItem value="investment">Investment</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="institution"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Institution</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Chase Bank" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="accountNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last 4 digits of account number</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. 1234" maxLength={4} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="currentBalance"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Balance</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {form.watch('type') === 'credit_card' && (
                      <FormField
                        control={form.control}
                        name="limit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Credit Limit</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    {(form.watch('type') === 'savings' || form.watch('type') === 'investment') && (
                      <FormField
                        control={form.control}
                        name="interestRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Interest Rate (%)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    <DialogFooter>
                      <Button 
                        type="submit" 
                        className="bg-primary text-white hover:bg-primary/90"
                        disabled={addAccountMutation.isPending}
                      >
                        {addAccountMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Add Account
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Net Worth Card */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Net Worth</h2>
                  <p className="text-3xl font-bold text-neutral-800 mt-2">${netWorth.toFixed(2)}</p>
                </div>
                <div className="mt-4 md:mt-0 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-neutral-500">Checking</p>
                    <p className="font-medium">${checkingTotal.toFixed(2)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-neutral-500">Savings</p>
                    <p className="font-medium">${savingsTotal.toFixed(2)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-neutral-500">Credit</p>
                    <p className="font-medium text-red-500">${creditCardTotal.toFixed(2)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-neutral-500">Investments</p>
                    <p className="font-medium">${investmentTotal.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Account Tabs */}
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All Accounts</TabsTrigger>
              <TabsTrigger value="checking">Checking</TabsTrigger>
              <TabsTrigger value="savings">Savings</TabsTrigger>
              <TabsTrigger value="credit">Credit Cards</TabsTrigger>
              <TabsTrigger value="investments">Investments</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-4">
              {accounts?.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-muted-foreground">You don't have any accounts yet. Add your first account to get started.</p>
                  </CardContent>
                </Card>
              ) : (
                accounts?.map(account => (
                  <AccountCard key={account.id} account={account} />
                ))
              )}
            </TabsContent>
            
            <TabsContent value="checking" className="space-y-4">
              {checkingAccounts.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-muted-foreground">You don't have any checking accounts.</p>
                  </CardContent>
                </Card>
              ) : (
                checkingAccounts.map(account => (
                  <AccountCard key={account.id} account={account} />
                ))
              )}
            </TabsContent>
            
            <TabsContent value="savings" className="space-y-4">
              {savingsAccounts.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-muted-foreground">You don't have any savings accounts.</p>
                  </CardContent>
                </Card>
              ) : (
                savingsAccounts.map(account => (
                  <AccountCard key={account.id} account={account} />
                ))
              )}
            </TabsContent>
            
            <TabsContent value="credit" className="space-y-4">
              {creditCards.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-muted-foreground">You don't have any credit cards.</p>
                  </CardContent>
                </Card>
              ) : (
                creditCards.map(account => (
                  <AccountCard key={account.id} account={account} />
                ))
              )}
            </TabsContent>
            
            <TabsContent value="investments" className="space-y-4">
              {investments.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-muted-foreground">You don't have any investment accounts.</p>
                  </CardContent>
                </Card>
              ) : (
                investments.map(account => (
                  <AccountCard key={account.id} account={account} />
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function AccountCard({ account }: { account: Account }) {
  // Use wouter's navigation
  const [_, navigate] = useLocation();
  // Get icon based on account type
  const getAccountIcon = () => {
    switch (account.type) {
      case 'checking':
        return <Building className="h-5 w-5" />;
      case 'savings':
        return <Wallet className="h-5 w-5" />;
      case 'credit_card':
        return <CreditCard className="h-5 w-5" />;
      case 'investment':
        return <BarChart3 className="h-5 w-5" />;
      default:
        return <Building className="h-5 w-5" />;
    }
  };
  
  // Get color based on account type
  const getAccountColor = () => {
    switch (account.type) {
      case 'checking':
        return 'bg-blue-50 text-secondary-500';
      case 'savings':
        return 'bg-green-50 text-primary';
      case 'credit_card':
        return 'bg-purple-50 text-accent-500';
      case 'investment':
        return 'bg-yellow-50 text-yellow-500';
      default:
        return 'bg-neutral-100 text-neutral-500';
    }
  };
  
  // Format account type
  const formatAccountType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
  };
  
  // Credit card utilization calculation
  const creditCardUtilization = account.type === 'credit_card' && account.limit 
    ? Math.min(100, (Math.abs(account.currentBalance) / account.limit) * 100)
    : null;
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <div className={`p-2.5 rounded-lg ${getAccountColor()} mr-3`}>
              {getAccountIcon()}
            </div>
            <div>
              <h3 className="font-medium text-neutral-800">{account.name}</h3>
              <p className="text-xs text-neutral-500">
                {formatAccountType(account.type)} • **** {account.accountNumber}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <p className={`font-medium ${account.currentBalance < 0 ? 'text-red-600' : 'text-neutral-800'}`}>
              ${account.currentBalance.toFixed(2)}
            </p>
            {account.type === 'credit_card' && account.limit && (
              <p className="text-xs text-neutral-500">${account.limit.toFixed(2)} limit</p>
            )}
            {account.type === 'savings' && account.interestRate && (
              <p className="text-xs text-neutral-500">{account.interestRate}% APY</p>
            )}
          </div>
        </div>
        
        {account.type === 'credit_card' && creditCardUtilization !== null && (
          <>
            <div className="w-full bg-neutral-200 rounded-full h-1.5 mt-4">
              <div 
                className={`h-1.5 rounded-full ${
                  creditCardUtilization > 75 ? 'bg-red-500' : 
                  creditCardUtilization > 30 ? 'bg-yellow-500' : 'bg-green-500'
                }`} 
                style={{ width: `${creditCardUtilization}%` }}
              />
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-neutral-500">{creditCardUtilization.toFixed(0)}% used</span>
              <span className="text-neutral-500">Due: {new Date().toLocaleDateString()}</span>
            </div>
          </>
        )}
        
        <div className="flex justify-between mt-4">
          <Button 
            variant="link" 
            className="px-0 text-[#2ecc71] hover:text-[#27ae60]"
            onClick={() => navigate(`/transactions?accountId=${account.id}`)}
          >
            View Transactions
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(`/transactions?accountId=${account.id}`)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
