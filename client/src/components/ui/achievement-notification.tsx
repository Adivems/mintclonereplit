import React, { useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AchievementBadge } from "@/components/ui/achievement-badge";
import { X, Award } from "lucide-react";
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { type Achievement } from "@shared/schema";
import { motion, AnimatePresence } from 'framer-motion';

interface AchievementNotificationProps {
  achievement: Achievement;
  onDismiss: () => void;
  open?: boolean;
}

export function AchievementNotification({
  achievement,
  onDismiss,
  open = true
}: AchievementNotificationProps) {
  useEffect(() => {
    // Auto-dismiss after 10 seconds
    if (open) {
      const timer = setTimeout(() => {
        onDismiss();
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [open, onDismiss]);

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onDismiss()}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <div className="flex justify-between items-start">
            <AlertDialogTitle className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-primary" />
              <span>Achievement Unlocked!</span>
            </AlertDialogTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6" 
              onClick={onDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <AlertDialogDescription>
            You've earned a new achievement for your financial progress!
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="flex flex-col items-center justify-center py-6">
          <div className="mb-4">
            <AchievementBadge achievement={achievement} earned size="lg" />
          </div>
          <h3 className="text-lg font-bold text-center">{achievement.name}</h3>
          <p className="text-sm text-muted-foreground text-center mt-1">
            {achievement.description}
          </p>
        </div>
        
        <AlertDialogFooter>
          <AlertDialogAction onClick={onDismiss} className="w-full">
            Awesome!
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function AchievementToast({
  achievement,
  onDismiss,
  open = true
}: AchievementNotificationProps) {
  useEffect(() => {
    // Auto-dismiss after 5 seconds
    if (open) {
      const timer = setTimeout(() => {
        onDismiss();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [open, onDismiss]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-4 right-4 z-50"
        >
          <Card className="w-[300px] overflow-hidden border-2" style={{ borderColor: achievement.backgroundColor }}>
            <CardHeader className="p-4 pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base flex items-center">
                  <Award className="h-4 w-4 mr-2 text-primary" />
                  Achievement Unlocked!
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 -mt-1 -mr-1" 
                  onClick={onDismiss}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex items-center space-x-3">
                <AchievementBadge achievement={achievement} earned size="sm" />
                <div>
                  <p className="font-semibold text-sm">{achievement.name}</p>
                  <p className="text-xs text-muted-foreground">{achievement.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}