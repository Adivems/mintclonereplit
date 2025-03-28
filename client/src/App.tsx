import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Transactions from "@/pages/transactions";
import Accounts from "@/pages/accounts";
import Budgets from "@/pages/budgets";
import AuthPage from "@/pages/auth-page";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { ProtectedRoute } from "@/lib/protected-route";

// This component handles routing based on auth state
function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/transactions" component={Transactions} />
      <ProtectedRoute path="/accounts" component={Accounts} />
      <ProtectedRoute path="/budgets" component={Budgets} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router />
      <Toaster />
    </AuthProvider>
  );
}

export default App;
