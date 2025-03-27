import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Menu, Bell, PlusCircle, Settings, HelpCircle, LogOut, User, Search } from "lucide-react";
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

interface TopNavProps {
  onToggleSidebar: () => void;
}

export default function TopNav({ onToggleSidebar }: TopNavProps) {
  const { user, logoutMutation } = useAuth();
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  return (
    <div className="bg-[#2ecc71] text-white shadow-sm sticky top-0 z-10">
      <div className="px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between">
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
          {/* Removed duplicate FinanceTrak text */}
        </div>
        
        <div className="flex-1 flex justify-center max-w-md mx-auto">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-[#2ecc71]/70" />
            </div>
            <Input 
              type="text" 
              className="pl-10 pr-4 py-2 h-10 bg-white text-gray-800 border-white border placeholder-gray-500 rounded-lg focus:ring-1 focus:ring-white focus:border-white w-full" 
              placeholder="Search transactions..." 
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2 md:w-48 justify-end">
          <Button variant="ghost" size="icon" className="text-white hover:bg-[#27ae60] p-1 hidden sm:flex">
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-white hover:bg-[#27ae60] p-1 hidden sm:flex">
            <PlusCircle className="h-5 w-5" />
          </Button>
          
          {/* User Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 bg-white text-gray-800 border-white hover:bg-white hover:border-white py-1 px-2 rounded-lg">
                <Avatar className="h-7 w-7 border border-[#27ae60]">
                  <AvatarFallback className="bg-[#e6f9f0] text-[#2ecc71] text-xs">
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
