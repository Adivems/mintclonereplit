import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Wallet } from "lucide-react";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const [location, navigate] = useLocation();
  const { user, logoutMutation } = useAuth();
  
  const isActive = (path: string) => {
    return location === path;
  };
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const firstName = user?.fullName?.split(' ')[0] || '';
  const lastName = user?.fullName?.split(' ').slice(1).join(' ') || '';
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`;
  
  return (
    <div 
      id="sidebar" 
      className={`bg-white shadow-md h-full sidebar-transition z-20 border-r border-neutral-200 fixed md:static 
        ${isOpen ? 'w-64' : 'w-0 -ml-64 md:ml-0 md:w-64'}`}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="px-6 py-4 border-b border-neutral-200">
          <div className="flex items-center">
            <div className="bg-[#2ecc71] text-white rounded-lg p-2 flex items-center justify-center">
              <Wallet className="h-5 w-5" />
            </div>
            <h1 className="ml-3 text-xl font-semibold text-neutral-800">FinanceTrak</h1>
          </div>
        </div>
        
        {/* Navigation Menu */}
        <nav className="flex-grow p-4 space-y-1 overflow-y-auto">
          {/* Modified to use div + onClick for navigation instead of Link+child to avoid nesting issues */}
          <div 
            onClick={() => navigate("/")}
            className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg cursor-pointer ${
              isActive('/') ? 'bg-[#e6f9f0] text-[#2ecc71]' : 'text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            <i className="fas fa-tachometer-alt w-5 h-5 mr-3"></i>
            <span>Dashboard</span>
          </div>
          
          <div 
            onClick={() => navigate("/transactions")}
            className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg cursor-pointer ${
              isActive('/transactions') ? 'bg-[#e6f9f0] text-[#2ecc71]' : 'text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            <i className="fas fa-exchange-alt w-5 h-5 mr-3"></i>
            <span>Transactions</span>
          </div>
          
          <div 
            onClick={() => navigate("/accounts")}
            className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg cursor-pointer ${
              isActive('/accounts') ? 'bg-[#e6f9f0] text-[#2ecc71]' : 'text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            <i className="fas fa-wallet w-5 h-5 mr-3"></i>
            <span>Accounts</span>
          </div>
          
          <div 
            onClick={() => navigate("/budgets")}
            className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg cursor-pointer ${
              isActive('/budgets') ? 'bg-[#e6f9f0] text-[#2ecc71]' : 'text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            <i className="fas fa-chart-pie w-5 h-5 mr-3"></i>
            <span>Budgets</span>
          </div>
          
          <div className="border-t border-neutral-200 my-2 pt-2">
            <button 
              onClick={() => {}} 
              className="w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg text-neutral-700 hover:bg-neutral-100"
            >
              <i className="fas fa-cog w-5 h-5 mr-3"></i>
              <span>Settings</span>
            </button>
            <button 
              onClick={handleLogout} 
              className="w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg text-neutral-700 hover:bg-neutral-100"
            >
              <i className="fas fa-sign-out-alt w-5 h-5 mr-3"></i>
              <span>Logout</span>
            </button>
          </div>
        </nav>
        

      </div>
    </div>
  );
}
