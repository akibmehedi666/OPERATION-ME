"use client";

import React, { useState } from "react";
import { AcademicEvent } from "@/types/database";
import { getUrgentAcademicNotice } from "@/lib/scheduleResolver";
import { AlertTriangle, X, ArrowRight, BellRing } from "lucide-react";

interface DashboardBannerProps {
  events: AcademicEvent[];
  onOpenPlanner?: () => void;
}

export const DashboardBanner: React.FC<DashboardBannerProps> = ({ events, onOpenPlanner }) => {
  const [dismissed, setDismissed] = useState(false);
  const notice = getUrgentAcademicNotice(events, new Date());

  if (!notice || dismissed) return null;

  const isCritical = notice.urgency === "critical";

  return (
    <div
      className={`mb-6 p-3.5 sm:p-4 rounded-[4px] border flex items-center justify-between gap-3 transition-all ${
        isCritical
          ? "bg-[#fce8e0] border-[#facfb7] text-[#90290a] dark:bg-spy-redMuted dark:border-spy-red/40 dark:text-spy-red"
          : "bg-[#fbefd5] border-[#f4dcaa] text-[#8a5200] dark:bg-spy-amberMuted dark:border-spy-amber/40 dark:text-spy-amber"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`p-2 rounded-[3px] shrink-0 border ${
            isCritical
              ? "bg-[#fcd0c2] border-[#f8ad97] text-[#90290a] dark:bg-spy-surface dark:border-spy-red/40 dark:text-spy-red animate-pulse"
              : "bg-[#fbe3ba] border-[#f6cb87] text-[#8a5200] dark:bg-spy-surface dark:border-spy-amber/40 dark:text-spy-amber"
          }`}
        >
          {isCritical ? <AlertTriangle className="w-4 h-4" /> : <BellRing className="w-4 h-4" />}
        </div>
        <div className="min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-wider font-bold opacity-80">
            STRATEGIC DIRECTIVE // {isCritical ? "HIGH PRIORITY NOTICE" : "UPCOMING SCHEDULE NOTICE"}
          </div>
          <div className="text-xs sm:text-sm font-medium font-sans truncate">
            {notice.message}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {onOpenPlanner && (
          <button
            onClick={onOpenPlanner}
            className="px-2.5 py-1 text-xs font-mono font-bold rounded-[3px] bg-white/60 dark:bg-spy-surface border border-current hover:opacity-80 flex items-center gap-1 transition-opacity"
          >
            <span>Planner</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded-[3px] hover:bg-black/10 dark:hover:bg-white/10 transition-colors opacity-70 hover:opacity-100"
          title="Dismiss Notice"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
