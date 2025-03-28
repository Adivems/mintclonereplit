import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Menu, Settings, HelpCircle, LogOut, User, Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

interface TopNavProps {
  onToggleSidebar: () => void;
}

export default function TopNav({ onToggleSidebar }: TopNavProps) {
  const { user, logoutMutation } = useAuth();
  const [_, navigate] = useLocation();
  
  const handleLogout = () => {
    logoutMutation.mutate();
    // The navigation is handled by logoutMutation.onSuccess
  };
  
  return (
    <div className="bg-[#2ecc71] text-white shadow-sm sticky top-0 z-10">
      <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center md:w-48">
          <div className="flex items-center md:hidden mr-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onToggleSidebar}
              className="text-white hover:bg-[#27ae60] hover:text-white p-1"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
          {/* FinanceTrak logo only shown on sidebar */}
        </div>
        
        <div className="flex-1 flex justify-center max-w-md mx-auto">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-[#2ecc71]" />
            </div>
            <Input 
              type="text" 
              className="pl-10 pr-4 py-3 h-10 bg-white text-gray-800 border-2 border-[#e6f9f0] shadow-sm placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-[#2ecc71] focus:border-[#2ecc71] w-full" 
              placeholder="Search transactions..." 
            />
          </div>
        </div>
        
        <div className="flex items-center md:w-48 justify-end">
          {/* Removed notification icon as requested */}
          
          {/* User Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 py-1.5 px-3 rounded-lg ml-1 text-white hover:bg-[#27ae60]">
                <Avatar className="h-8 w-8 border border-white">
                  <AvatarFallback className="bg-[#27ae60] text-white text-sm">
                    {user?.fullName?.substring(0, 2) || user?.username?.substring(0, 2) || "Ad"}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-sm">{user?.fullName || user?.username}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{user?.fullName}</span>
                  <span className="text-xs text-muted-foreground">{user?.email || user?.username}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Account</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>Help</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
