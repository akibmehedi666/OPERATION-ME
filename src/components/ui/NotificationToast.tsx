"use client";

import React, { useState } from "react";
import {
  Bell,
  X,
  AlertTriangle,
  Flame,
  BookOpen,
} from "lucide-react";
import { NotificationAlert } from "@/lib/notificationScheduler";

interface NotificationToastProps {
  alerts: NotificationAlert[];
  onDismiss?: (alertId: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  alerts,
  onDismiss,
}) => {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const activeAlerts = alerts.filter((a) => !dismissedIds.has(a.id));

  if (activeAlerts.length === 0) return null;

  const currentAlert = activeAlerts[0];

  const handleDismiss = () => {
    setDismissedIds((prev) => new Set(prev).add(currentAlert.id));
    onDismiss?.(currentAlert.id);
  };

  const getAlertStyle = (type: NotificationAlert["type"]) => {
    switch (type) {
      case "streak_defense":
        return {
          icon: <Flame className="w-4 h-4 text-spy-amber" />,
          pill: "bg-[#fbefd5] border-[#f4dcaa] text-[#9a5b00] dark:bg-spy-surface dark:border-spy-amber/60 dark:text-spy-amber",
        };
      case "class":
        return {
          icon: <BookOpen className="w-4 h-4 text-spy-green" />,
          pill: "bg-[#dcf3e4] border-[#b2e5c3] text-[#14663a] dark:bg-spy-surface dark:border-spy-green/60 dark:text-spy-green",
        };
      case "tuition":
        return {
          icon: <AlertTriangle className="w-4 h-4 text-spy-amber" />,
          pill: "bg-[#fbefd5] border-[#f4dcaa] text-[#9a5b00] dark:bg-spy-surface dark:border-spy-amber/60 dark:text-spy-amber",
        };
      case "exam_warning":
        return {
          icon: <AlertTriangle className="w-4 h-4 text-spy-red" />,
          pill: "bg-[#fce8e0] border-[#facfb7] text-[#b23a12] dark:bg-spy-surface dark:border-spy-red/60 dark:text-spy-red",
        };
      default:
        return {
          icon: <Bell className="w-4 h-4 text-blue-500" />,
          pill: "bg-[#e4eefc] border-[#c6ddf9] text-[#1d4f9f] dark:bg-spy-surface dark:border-blue-500/60 dark:text-blue-400",
        };
    }
  };

  const style = getAlertStyle(currentAlert.type);

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full transition-all animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div className={`p-4 rounded-[4px] border shadow-2xl flex items-start gap-3 ${style.pill}`}>
        <div className="p-1.5 rounded-[3px] bg-black/5 dark:bg-white/10 shrink-0 mt-0.5">
          {style.icon}
        </div>
        <div className="space-y-1 flex-1 min-w-0">
          <div className="text-xs font-mono font-bold uppercase tracking-wider">
            {currentAlert.title}
          </div>
          <p className="text-xs font-sans text-spy-muted leading-relaxed">
            {currentAlert.message}
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 rounded text-spy-muted hover:text-spy-text hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0"
          title="Acknowledge alert"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
