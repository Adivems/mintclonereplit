import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Transactions from "@/pages/transactions";
import Accounts from "@/pages/accounts";
import Budgets from "@/pages/budgets";
import AuthPage from "@/pages/auth-page";
import { AuthProvider } from "@/hooks/use-auth";
import {
  useQuery,
} from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { getQueryFn } from "./lib/queryClient";
import { User } from "@shared/schema";

function App() {
  const [location, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  // Check authentication status
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  useEffect(() => {
    if (!isLoading) {
      setIsAuthenticated(!!user);
      
      // Redirect based on auth status
      if (user && location === "/auth") {
        setLocation("/");
      } else if (!user && location !== "/auth" && isAuthenticated === false) {
        setLocation("/auth");
      }
    }
  }, [user, isLoading, location, setLocation, isAuthenticated]);

  // Show loading indicator while checking auth
  if (isLoading || isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthProvider>
      <Switch>
        {isAuthenticated ? (
          <>
            <Route path="/" component={Dashboard} />
            <Route path="/transactions" component={Transactions} />
            <Route path="/accounts" component={Accounts} />
            <Route path="/budgets" component={Budgets} />
          </>
        ) : (
          <>
            <Route path="/auth" component={AuthPage} />
            <Route path="/" component={() => {
              setLocation("/auth");
              return null;
            }} />
          </>
        )}
        <Route component={NotFound} />
      </Switch>
      <Toaster />
    </AuthProvider>
  );
}

export default App;
