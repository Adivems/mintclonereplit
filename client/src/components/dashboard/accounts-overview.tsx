import { useMemo } from "react";
import { Account, Transaction } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowUpIcon, ArrowRightLeftIcon, MoreHorizontalIcon } from "lucide-react";
import { format, subDays } from "date-fns";

interface AccountsOverviewProps {
  accounts?: Account[];
  transactions?: Transaction[];
}

export default function AccountsOverview({ accounts, transactions }: AccountsOverviewProps) {
  const [, navigate] = useLocation();
  
  // Get accounts with additional data
  const processedAccounts = useMemo(() => {
    if (!accounts || !transactions) return [];
    
    return accounts.map(account => {
      // Calculate month-to-date change
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // Get month-to-date transactions for this account
      const monthTransactions = transactions.filter(
        t => t.accountId === account.id && new Date(t.date) >= startOfMonth
      );
      
      // Calculate the total change
      const monthlyChange = monthTransactions.reduce((sum, t) => sum + t.amount, 0);
      const monthlyChangePercent = account.currentBalance !== 0 
        ? (monthlyChange / (account.currentBalance - monthlyChange)) * 100 
        : 0;
      
      return {
        ...account,
        monthlyChange,
        monthlyChangePercent
      };
    });
  }, [accounts, transactions]);
  
  // Get only the top 3 accounts to display
  const displayAccounts = useMemo(() => {
    return processedAccounts.slice(0, 3);
  }, [processedAccounts]);
  
  // Handle navigation to accounts page
  const handleManageAccounts = () => {
    navigate('/accounts');
  };
  
  // Helper to get icon based on account type
  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'checking':
        return 'university';
      case 'savings':
        return 'piggy-bank';
      case 'credit_card':
        return 'credit-card';
      case 'investment':
        return 'chart-line';
      default:
        return 'university';
    }
  };
  
  // Helper to get color based on account type
  const getAccountColorClass = (type: string) => {
    switch (type) {
      case 'checking':
        return 'bg-secondary-50 text-secondary-600';
      case 'savings':
        return 'bg-primary-50 text-primary-600';
      case 'credit_card':
        return 'bg-accent-50 text-accent-600';
      case 'investment':
        return 'bg-yellow-50 text-yellow-600';
      default:
        return 'bg-neutral-100 text-neutral-500';
    }
  };
  
  // Format account type for display
  const formatAccountType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-neutral-800">Your Accounts</h2>
        <Button 
          variant="link" 
          onClick={handleManageAccounts}
          className="text-sm text-primary-500 hover:text-primary-700 font-medium"
        >
          Manage Accounts
        </Button>
      </div>
      
      {processedAccounts.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-neutral-500">No accounts found. Add an account to get started.</p>
            <Button 
              className="mt-4 bg-primary-500 hover:bg-primary-600"
              onClick={handleManageAccounts}
            >
              Add Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayAccounts.map(account => (
            <Card key={account.id} className="border border-neutral-200">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <div className={`p-2.5 rounded-lg ${getAccountColorClass(account.type)} mr-3`}>
                      <i className={`fas fa-${getAccountIcon(account.type)}`}></i>
                    </div>
                    <div>
                      <p className="font-medium text-neutral-800">{account.name}</p>
                      <p className="text-xs text-neutral-500">**** {account.accountNumber}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${account.currentBalance < 0 ? 'text-red-600' : 'text-neutral-800'}`}>
                      ${account.currentBalance.toFixed(2)}
                    </p>
                    {account.monthlyChangePercent !== 0 && (
                      <p className={`text-xs flex items-center justify-end ${
                        account.monthlyChangePercent > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        <ArrowUpIcon className={`mr-1 h-3 w-3 ${
                          account.monthlyChangePercent < 0 ? 'rotate-180' : ''
                        }`} />
                        {Math.abs(account.monthlyChangePercent).toFixed(1)}% MTD
                      </p>
                    )}
                  </div>
                </div>
                
                {account.type === 'credit_card' && account.limit && (
                  <>
                    <div className="w-full bg-neutral-200 rounded-full h-1.5 mb-3">
                      <div 
                        className="bg-accent-500 h-1.5 rounded-full" 
                        style={{ width: `${Math.min(100, (Math.abs(account.currentBalance) / account.limit) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-neutral-500">{((Math.abs(account.currentBalance) / account.limit) * 100).toFixed(0)}% used</span>
                      <span className="text-neutral-500">Due: {format(new Date(), "MMM d, yyyy")}</span>
                    </div>
                  </>
                )}
                
                <div className="flex justify-between mt-4">
                  <Button 
                    variant="link" 
                    className="px-0 text-secondary-500 hover:text-secondary-700 text-xs"
                    onClick={() => navigate('/transactions')}
                  >
                    View Transactions
                  </Button>
                  <div className="flex items-center space-x-3">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <ArrowRightLeftIcon className="h-4 w-4 text-secondary-500" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontalIcon className="h-4 w-4 text-neutral-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
