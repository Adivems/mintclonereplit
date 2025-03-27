import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, getQueryFn, apiRequest } from "@/lib/queryClient";
import { type Achievement, type UserAchievement } from "@shared/schema";

// Type for an enriched user achievement with the achievement details
export type UserAchievementWithDetails = UserAchievement & {
  achievement: Achievement;
};

export function useAchievements() {
  const { toast } = useToast();
  
  // Get all available achievements
  const {
    data: achievements = [],
    isLoading: isLoadingAchievements,
    error: achievementsError
  } = useQuery<Achievement[]>({
    queryKey: ["/api/achievements"],
    queryFn: getQueryFn({ on401: "returnNull" })
  });
  
  // Get user's achievements
  const {
    data: userAchievements = [],
    isLoading: isLoadingUserAchievements,
    error: userAchievementsError
  } = useQuery<UserAchievementWithDetails[]>({
    queryKey: ["/api/user/achievements"],
    queryFn: getQueryFn({ on401: "returnNull" })
  });
  
  // Award an achievement to the user
  const awardAchievementMutation = useMutation({
    mutationFn: async (achievementId: number) => {
      const res = await apiRequest("POST", `/api/user/achievements/${achievementId}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/achievements"] });
      toast({
        title: "Achievement Awarded!",
        description: "You've earned a new achievement!",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to award achievement",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mark an achievement as viewed
  const markAchievementViewedMutation = useMutation({
    mutationFn: async (userAchievementId: number) => {
      const res = await apiRequest("PUT", `/api/user/achievements/${userAchievementId}/viewed`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/achievements"] });
    },
    onError: (error: Error) => {
      console.error("Failed to mark achievement as viewed:", error);
    },
  });
  
  // Get unviewed achievements (for notifications)
  const unviewedAchievements = userAchievements.filter(ua => !ua.viewed);
  
  return {
    achievements,
    userAchievements,
    unviewedAchievements,
    isLoadingAchievements,
    isLoadingUserAchievements,
    achievementsError,
    userAchievementsError,
    awardAchievementMutation,
    markAchievementViewedMutation
  };
}