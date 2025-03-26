import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Menu, Bell, PlusCircle } from "lucide-react";

interface TopNavProps {
  onToggleSidebar: () => void;
}

export default function TopNav({ onToggleSidebar }: TopNavProps) {
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
        </div>
      </div>
    </div>
  );
}
