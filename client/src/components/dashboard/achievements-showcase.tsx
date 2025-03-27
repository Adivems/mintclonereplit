import React, { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AchievementBadge } from "@/components/ui/achievement-badge";
import { useAchievements } from "@/hooks/use-achievements";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Award, ChevronDown, ChevronUp } from "lucide-react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function AchievementsShowcase() {
  const [showAll, setShowAll] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"earned" | "all">("earned");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<number | null>(null);
  
  const { 
    achievements, 
    userAchievements,
    unviewedAchievements,
    isLoadingAchievements,
    isLoadingUserAchievements,
    markAchievementViewedMutation 
  } = useAchievements();
  
  // Get a list of achievement IDs that the user has earned
  const earnedAchievementIds = new Set(userAchievements.map(ua => ua.achievementId));
  
  // Mark all unviewed achievements as viewed when the component mounts or when a new one is received
  React.useEffect(() => {
    unviewedAchievements.forEach(ua => {
      markAchievementViewedMutation.mutate(ua.id);
    });
  }, [unviewedAchievements, markAchievementViewedMutation]);
  
  const handleAchievementClick = (achievementId: number) => {
    setSelectedAchievement(achievementId);
    setDialogOpen(true);
  };
  
  if (isLoadingAchievements || isLoadingUserAchievements) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="mr-2 h-5 w-5 text-primary" />
            Achievements
          </CardTitle>
          <CardDescription>Your financial milestones and accomplishments</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }
  
  const selectedAchievementDetails = selectedAchievement
    ? achievements.find(a => a.id === selectedAchievement)
    : null;
    
  const isAchievementEarned = selectedAchievement
    ? earnedAchievementIds.has(selectedAchievement)
    : false;
  
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Award className="mr-2 h-5 w-5 text-primary" />
            Achievements
            {unviewedAchievements.length > 0 && (
              <span className="ml-2 bg-primary text-white rounded-full text-xs px-2 py-0.5">
                {unviewedAchievements.length} new
              </span>
            )}
          </div>
        </CardTitle>
        <CardDescription>Your financial milestones and accomplishments</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as "earned" | "all")}>
          <TabsList className="mb-4">
            <TabsTrigger value="earned">
              Earned ({userAchievements.length})
            </TabsTrigger>
            <TabsTrigger value="all">
              All Achievements ({achievements.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="earned">
            {userAchievements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Award className="mx-auto h-12 w-12 mb-3 opacity-30" />
                <p>You haven't earned any achievements yet.</p>
                <p className="text-sm mt-1">
                  Use the app to track your finances and unlock achievements!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
                  {userAchievements
                    .sort((a, b) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime())
                    .slice(0, showAll ? undefined : 8)
                    .map((ua) => (
                      <div key={ua.id} className="flex flex-col items-center">
                        <AchievementBadge 
                          achievement={ua.achievement} 
                          earned={true}
                          onClick={() => handleAchievementClick(ua.achievementId)}
                        />
                        <span className="text-xs text-center mt-1 line-clamp-1">
                          {ua.achievement.name}
                        </span>
                      </div>
                    ))}
                </div>
                {userAchievements.length > 8 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => setShowAll(!showAll)}
                  >
                    {showAll ? (
                      <><ChevronUp className="mr-1 h-4 w-4" /> Show Less</>
                    ) : (
                      <><ChevronDown className="mr-1 h-4 w-4" /> Show All ({userAchievements.length})</>
                    )}
                  </Button>
                )}
              </div>
            )}
          </TabsContent>
          <TabsContent value="all">
            <ScrollArea className="h-[200px] pr-4">
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {achievements.map((achievement) => (
                  <div key={achievement.id} className="flex flex-col items-center">
                    <AchievementBadge 
                      achievement={achievement} 
                      earned={earnedAchievementIds.has(achievement.id)}
                      onClick={() => handleAchievementClick(achievement.id)}
                    />
                    <span className="text-xs text-center mt-1 line-clamp-1">
                      {achievement.name}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                Achievement Details
              </DialogTitle>
              <DialogDescription>
                Learn more about this achievement
              </DialogDescription>
            </DialogHeader>
            
            {selectedAchievementDetails && (
              <div className="flex flex-col items-center mt-2">
                <AchievementBadge 
                  achievement={selectedAchievementDetails}
                  earned={isAchievementEarned}
                  size="lg"
                />
                <h3 className="text-lg font-medium mt-4">
                  {selectedAchievementDetails.name}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 text-center">
                  {selectedAchievementDetails.description}
                </p>
                <div className="w-full mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Category</span>
                    <span className="text-sm capitalize">
                      {selectedAchievementDetails.category}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-medium">Status</span>
                    <span className={`text-sm ${isAchievementEarned ? 'text-green-500' : 'text-amber-500'}`}>
                      {isAchievementEarned ? 'Earned' : 'Locked'}
                    </span>
                  </div>
                  {isAchievementEarned && (
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-medium">Earned on</span>
                      <span className="text-sm">
                        {new Date(userAchievements.find(ua => ua.achievementId === selectedAchievement)?.earnedAt || '').toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}