import { useMemo, useState } from "react";
import { Transaction, Account, Category } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { format } from "date-fns";

interface RecentTransactionsProps {
  transactions?: Transaction[];
  accounts?: Account[];
  categories?: Category[];
}

export default function RecentTransactions({ transactions, accounts, categories }: RecentTransactionsProps) {
  const [, navigate] = useLocation();
  const [loadLimit, setLoadLimit] = useState(5);
  
  // Sort and limit transactions
  const recentTransactions = useMemo(() => {
    if (!transactions) return [];
    
    // Sort by date (newest first)
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, loadLimit);
  }, [transactions, loadLimit]);
  
  // Helper to get category by ID
  const getCategoryById = (id: number | null | undefined) => {
    if (!id || !categories) return null;
    return categories.find(cat => cat.id === id);
  };
  
  // Helper to get account by ID
  const getAccountById = (id: number) => {
    if (!accounts) return null;
    return accounts.find(acc => acc.id === id);
  };
  
  // Handle load more
  const handleLoadMore = () => {
    setLoadLimit(prev => prev + 5);
  };
  
  // Helper to get transaction icon based on category
  const getTransactionIcon = (transaction: Transaction) => {
    const category = getCategoryById(transaction.categoryId);
    if (!category) return "question";
    return category.icon;
  };
  
  // Helper to get transaction color based on category
  const getTransactionColor = (transaction: Transaction) => {
    const category = getCategoryById(transaction.categoryId);
    if (!category) return "bg-neutral-100 text-neutral-500";
    
    return `bg-opacity-10 bg-${category.color} text-${category.color.replace('#', '')}`;
  };
  
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-neutral-800">Recent Transactions</h2>
        <Button 
          variant="link" 
          onClick={() => navigate('/transactions')}
          className="text-sm text-primary-500 hover:text-primary-700 font-medium"
        >
          View All
        </Button>
      </div>
      
      <Card className="border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Merchant
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Category
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Account
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-neutral-500">
                    No transactions found
                  </td>
                </tr>
              ) : (
                recentTransactions.map(transaction => {
                  const category = getCategoryById(transaction.categoryId);
                  const account = getAccountById(transaction.accountId);
                  const isIncome = category?.type === 'income';
                  
                  return (
                    <tr key={transaction.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`p-2 rounded-lg ${getTransactionColor(transaction)} mr-3`}>
                            <i className={`fas fa-${getTransactionIcon(transaction)}`}></i>
                          </div>
                          <span className="text-sm font-medium text-neutral-800">{transaction.merchant}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {category && (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            isIncome 
                              ? 'bg-primary-50 text-primary-700' 
                              : 'bg-secondary-50 text-secondary-700'
                          }`}>
                            {category.name}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                        {format(new Date(transaction.date), "MMM d, yyyy")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                        {account?.name || "Unknown"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                        <span className={isIncome ? 'text-primary-600' : 'text-red-600'}>
                          {isIncome ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {transactions && transactions.length > loadLimit && (
          <div className="bg-neutral-50 px-6 py-3 flex justify-center">
            <Button 
              variant="ghost" 
              onClick={handleLoadMore}
              className="text-sm text-neutral-500 hover:text-neutral-700 font-medium"
            >
              Load More
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
