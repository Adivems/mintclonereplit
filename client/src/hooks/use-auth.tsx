
import { createContext, ReactNode, useContext } from "react";
import { useQuery, useMutation, UseMutationResult } from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type LoginData = Pick<InsertUser, "username" | "password">;

// Define proper types for the auth context
interface AuthContextType {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData, unknown>;
  logoutMutation: UseMutationResult<boolean, Error, void, unknown>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser, unknown>;
}

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
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      // Instead of apiRequest, use fetch directly with better error handling
      console.log("Attempting login with credentials:", { ...credentials, password: "******" });
      
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
        credentials: "include",
      });
      
      console.log("Login response status:", res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage;
        
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || "Login failed";
        } catch (e) {
          errorMessage = errorText || "Login failed";
        }
        
        console.error("Login error:", errorMessage);
        throw new Error(errorMessage);
      }
      
      const data = await res.json();
      console.log("Login successful, received user data");
      return data;
    },
    onSuccess: (data: SelectUser) => {
      console.log("Setting user data in cache", data);
      queryClient.setQueryData(["/api/user"], data);
      
      toast({
        title: "Welcome back!",
        description: `Logged in as ${data.username}`,
      });
      
      navigate("/");
    },
    onError: (error: Error) => {
      console.error("Login mutation error:", error);
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      // Instead of apiRequest, use fetch directly with better error handling
      console.log("Attempting registration with credentials:", { ...credentials, password: "******" });
      
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
        credentials: "include",
      });
      
      console.log("Registration response status:", res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage;
        
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || "Registration failed";
        } catch (e) {
          errorMessage = errorText || "Registration failed";
        }
        
        console.error("Registration error:", errorMessage);
        throw new Error(errorMessage);
      }
      
      const data = await res.json();
      console.log("Registration successful, received user data");
      return data;
    },
    onSuccess: (data: SelectUser) => {
      console.log("Setting user data in cache after registration", data);
      queryClient.setQueryData(["/api/user"], data);
      
      toast({
        title: "Account created!",
        description: "Your account has been created successfully.",
      });
      
      navigate("/");
    },
    onError: (error: Error) => {
      console.error("Registration mutation error:", error);
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Instead of apiRequest, use fetch directly with better error handling
      console.log("Attempting logout");
      
      const res = await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
      
      console.log("Logout response status:", res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage;
        
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || "Logout failed";
        } catch (e) {
          errorMessage = errorText || "Logout failed";
        }
        
        console.error("Logout error:", errorMessage);
        throw new Error(errorMessage);
      }
      
      return true;
    },
    onSuccess: () => {
      console.log("Logout successful, clearing cache");
      queryClient.clear();
      queryClient.setQueryData(["/api/user"], null);
      
      toast({
        title: "Goodbye!",
        description: "Logged out successfully",
      });
      
      navigate("/auth");
    },
    onError: (error: Error) => {
      console.error("Logout mutation error:", error);
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user as SelectUser | null, // Fix type casting
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
