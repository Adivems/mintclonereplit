
import { createContext, ReactNode, useContext } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type LoginData = Pick<InsertUser, "username" | "password">;

// Add confirmPassword to the type for registration
type RegisterData = InsertUser & { confirmPassword?: string };

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: any;
  logoutMutation: any;
  registerMutation: any;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [_, navigate] = useLocation();

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: 0,
    staleTime: 30000, // 30 seconds
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.message || "Login failed");
        } catch (e) {
          throw new Error(errorText || "Login failed");
        }
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Directly update the cache instead of invalidating
      queryClient.setQueryData(["/api/user"], data);
      
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
      
      navigate("/");
    },
    onError: (error) => {
      console.error("Login error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Login failed",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.message || "Logout failed");
        } catch (e) {
          throw new Error(errorText || "Logout failed");
        }
      }
      
      return true;
    },
    onSuccess: () => {
      // Just set the user data to null, don't invalidate all queries
      queryClient.setQueryData(["/api/user"], null);
      
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
      
      navigate("/auth");
    },
    onError: (error) => {
      console.error("Logout error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Logout failed",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.message || "Registration failed");
        } catch (e) {
          throw new Error(errorText || "Registration failed");
        }
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Directly update the cache instead of invalidating
      queryClient.setQueryData(["/api/user"], data);
      
      toast({
        title: "Success",
        description: "Registered successfully",
      });
      
      navigate("/");
    },
    onError: (error) => {
      console.error("Registration error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Registration failed",
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user as SelectUser | null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
