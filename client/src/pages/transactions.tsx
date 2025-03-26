import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Sidebar from "@/components/sidebar";
import TopNav from "@/components/top-nav";
import { format } from "date-fns";
import { Loader2, Filter, Plus, Search } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Transaction, Account, Category } from "@shared/schema";

export default function Transactions() {
  const { user } = useAuth();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [accountFilter, setAccountFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  
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
  
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
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
            <Button className="mt-4 md:mt-0 bg-primary-500 hover:bg-primary-600">
              <Plus className="mr-2 h-4 w-4" /> Add Transaction
            </Button>
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
                                <div className={`p-2 rounded-lg mr-3 ${category ? `bg-opacity-10 bg-${category.color}` : 'bg-neutral-100'}`}>
                                  <i className={`fas fa-${category?.icon || 'question'}`}></i>
                                </div>
                                <span className="font-medium">{transaction.merchant}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {category && (
                                <span className={`px-2 py-1 text-xs font-medium rounded-full bg-opacity-10 ${isIncome ? 'bg-primary-500 text-primary-700' : 'bg-secondary-500 text-secondary-700'}`}>
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
                            <TableCell className={`text-right font-medium ${isIncome ? 'text-primary-600' : 'text-red-600'}`}>
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
