import { Account, Transaction, Category } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { useMemo } from "react";
import { ArrowUpRight, ArrowDownRight, DollarSign, TrendingUp, ShoppingCart } from "lucide-react";

interface FinancialSummaryProps {
  accounts: Account[];
  transactions: Transaction[];
}

export default function FinancialSummary({ accounts, transactions }: FinancialSummaryProps) {
  // Calculate net worth
  const netWorth = useMemo(() => {
    if (!accounts) return 0;
    return accounts.reduce((total, account) => total + account.currentBalance, 0);
  }, [accounts]);
  
  // Calculate this month's income
  const monthlyIncome = useMemo(() => {
    if (!transactions) return 0;
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return transactions
      .filter(t => new Date(t.date) >= startOfMonth && t.amount > 0)
      .reduce((total, t) => total + t.amount, 0);
  }, [transactions]);
  
  // Calculate this month's spending
  const monthlySpending = useMemo(() => {
    if (!transactions) return 0;
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return transactions
      .filter(t => new Date(t.date) >= startOfMonth && t.amount < 0)
      .reduce((total, t) => total + Math.abs(t.amount), 0);
  }, [transactions]);
  
  // Dummy percentage changes (would be calculated with historical data in a real app)
  const netWorthChange = 2.4;
  const incomeChange = 5.1;
  const spendingChange = 8.3;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card className="h-full">
        <CardContent className="p-5 h-full">
          <div className="flex justify-between items-start h-full">
            <div>
              <p className="text-sm font-medium text-neutral-500">Net Worth</p>
              <p className="text-2xl font-bold mt-1 text-neutral-800">${netWorth.toFixed(2)}</p>
              <div className="flex items-center mt-1 text-xs">
                <span className="text-green-600 font-medium flex items-center">
                  <ArrowUpRight className="h-3 w-3 mr-1" /> {netWorthChange}%
                </span>
                <span className="text-neutral-500 ml-2">from last month</span>
              </div>
            </div>
            <div className="p-2 bg-blue-50 text-[#2ecc71] rounded-lg">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="h-full">
        <CardContent className="p-5 h-full">
          <div className="flex justify-between items-start h-full">
            <div>
              <p className="text-sm font-medium text-neutral-500">This Month's Income</p>
              <p className="text-2xl font-bold mt-1 text-neutral-800">${monthlyIncome.toFixed(2)}</p>
              <div className="flex items-center mt-1 text-xs">
                <span className="text-green-600 font-medium flex items-center">
                  <ArrowUpRight className="h-3 w-3 mr-1" /> {incomeChange}%
                </span>
                <span className="text-neutral-500 ml-2">from last month</span>
              </div>
            </div>
            <div className="p-2 bg-green-50 text-[#2ecc71] rounded-lg">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="h-full">
        <CardContent className="p-5 h-full">
          <div className="flex justify-between items-start h-full">
            <div>
              <p className="text-sm font-medium text-neutral-500">This Month's Spending</p>
              <p className="text-2xl font-bold mt-1 text-neutral-800">${monthlySpending.toFixed(2)}</p>
              <div className="flex items-center mt-1 text-xs">
                <span className="text-red-600 font-medium flex items-center">
                  <ArrowUpRight className="h-3 w-3 mr-1" /> {spendingChange}%
                </span>
                <span className="text-neutral-500 ml-2">from last month</span>
              </div>
            </div>
            <div className="p-2 bg-red-50 text-red-500 rounded-lg">
              <ShoppingCart className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
