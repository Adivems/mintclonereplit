import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Menu, Bell, PlusCircle, Settings, HelpCircle, LogOut, User } from "lucide-react";
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
    <div className="bg-white shadow-sm border-b border-neutral-200 sticky top-0 z-10">
      <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center md:hidden">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onToggleSidebar}
            className="text-neutral-500 hover:text-neutral-700"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="md:flex-1 md:flex md:justify-start">
          <div className="relative max-w-md w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="fas fa-search text-neutral-400"></i>
            </div>
            <Input 
              type="text" 
              className="pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
              placeholder="Search transactions, accounts..." 
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="text-neutral-500 hover:text-neutral-700 relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full"></span>
          </Button>
          <Button variant="ghost" size="icon" className="text-neutral-500 hover:text-neutral-700">
            <PlusCircle className="h-5 w-5" />
          </Button>
          
          {/* User Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 hover:bg-neutral-100">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary-100 text-primary-700">
                    {user?.fullName?.substring(0, 2) || user?.username?.substring(0, 2) || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:inline font-medium text-sm">{user?.fullName || user?.username}</span>
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
