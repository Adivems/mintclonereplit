import React from "react";
import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { type Achievement } from "@shared/schema";

type LucideIcon = keyof typeof Icons;

interface AchievementBadgeProps {
  achievement: Achievement;
  earned?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
}

export function AchievementBadge({
  achievement,
  earned = false,
  size = "md",
  className,
  onClick
}: AchievementBadgeProps) {
  // Get the icon component dynamically
  let IconComponent: React.ElementType = Icons.Award; // Default to Award icon
  if (achievement.icon in Icons) {
    IconComponent = Icons[achievement.icon as keyof typeof Icons];
  }
  
  // Determine sizes based on the size prop
  const sizeClasses = {
    sm: {
      container: "h-8 w-8",
      icon: "h-4 w-4",
    },
    md: {
      container: "h-12 w-12",
      icon: "h-6 w-6",
    },
    lg: {
      container: "h-16 w-16",
      icon: "h-8 w-8",
    },
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              "flex items-center justify-center rounded-full p-0 cursor-pointer transition-all",
              sizeClasses[size].container,
              earned 
                ? `bg-${achievement.backgroundColor} hover:opacity-90`
                : "bg-gray-200 dark:bg-gray-700 opacity-40 grayscale",
              className
            )}
            style={{
              backgroundColor: earned ? achievement.backgroundColor : undefined,
              color: earned ? achievement.textColor : undefined
            }}
            onClick={onClick}
          >
            <IconComponent className={cn(sizeClasses[size].icon)} />
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-semibold text-sm">{achievement.name}</p>
            <p className="text-xs text-muted-foreground">{achievement.description}</p>
            {!earned && <p className="text-xs italic">Not yet earned</p>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}