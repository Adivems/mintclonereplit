import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import TopNav from "@/components/top-nav";
import FinancialSummary from "@/components/dashboard/financial-summary";
import CashFlowChart from "@/components/dashboard/cash-flow-chart";
import SpendingCategoryChart from "@/components/dashboard/spending-category-chart";
import BudgetProgress from "@/components/dashboard/budget-progress";
import RecentTransactions from "@/components/dashboard/recent-transactions";
import AccountsOverview from "@/components/dashboard/accounts-overview";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const firstName = user?.fullName?.split(' ')[0] || '';
  const currentDate = format(new Date(), "EEEE, MMMM d, yyyy");
  
  // Fetch accounts
  const { data: accounts, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['/api/accounts'],
  });
  
  // Fetch transactions
  const { data: transactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['/api/transactions'],
  });
  
  // Fetch budgets
  const { data: budgets, isLoading: isLoadingBudgets } = useQuery({
    queryKey: ['/api/budgets'],
  });
  
  // Fetch categories
  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['/api/categories'],
  });
  
  const isLoading = isLoadingAccounts || isLoadingTransactions || isLoadingBudgets || isLoadingCategories;
  
  const toggleMobileNav = () => {
    setIsMobileNavOpen(!isMobileNavOpen);
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
          {/* Welcome Message + Date */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-neutral-800">Welcome back, {firstName}</h1>
              <p className="text-neutral-500">{currentDate}</p>
            </div>
            <div className="mt-4 md:mt-0">
              <button className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors flex items-center space-x-2">
                <i className="fas fa-plus"></i>
                <span>Add Account</span>
              </button>
            </div>
          </div>
          
          {/* Financial Summary */}
          <FinancialSummary 
            accounts={accounts} 
            transactions={transactions} 
          />
          
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <CashFlowChart 
              transactions={transactions} 
              categories={categories} 
            />
            <SpendingCategoryChart 
              transactions={transactions} 
              categories={categories} 
            />
          </div>
          
          {/* Budget Progress */}
          <BudgetProgress 
            budgets={budgets} 
            transactions={transactions} 
            categories={categories} 
          />
          
          {/* Recent Transactions */}
          <RecentTransactions 
            transactions={transactions} 
            accounts={accounts} 
            categories={categories} 
          />
          
          {/* Accounts Overview */}
          <AccountsOverview 
            accounts={accounts} 
            transactions={transactions} 
          />
        </div>
      </div>
    </div>
  );
}
