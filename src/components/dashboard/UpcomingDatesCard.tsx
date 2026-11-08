"use client";

import React from "react";
import { AcademicEvent } from "@/types/database";
import { getUpcomingAcademicEvents } from "@/lib/scheduleResolver";
import { formatDate } from "@/lib/formatters";
import { Calendar, AlertCircle, CreditCard, BookOpen, Clock, ArrowRight } from "lucide-react";

interface UpcomingDatesCardProps {
  events: AcademicEvent[];
  onOpenCalendar?: () => void;
}

export const UpcomingDatesCard: React.FC<UpcomingDatesCardProps> = ({ events, onOpenCalendar }) => {
  const upcoming = getUpcomingAcademicEvents(events, new Date(), 3);

  const getEventBadge = (type: string) => {
    switch (type) {
      case "exam":
        return {
          icon: <AlertCircle className="w-3.5 h-3.5 text-spy-red" />,
          pill: "bg-[#fce8e0] text-[#b23a12] border-[#facfb7] dark:bg-spy-red/20 dark:text-spy-red dark:border-spy-red/30",
          name: "EXAM",
        };
      case "payment":
        return {
          icon: <CreditCard className="w-3.5 h-3.5 text-spy-amber" />,
          pill: "bg-[#fbefd5] text-[#9a5b00] border-[#f4dcaa] dark:bg-spy-amber/20 dark:text-spy-amber dark:border-spy-amber/30",
          name: "PAYMENT",
        };
      case "deadline":
        return {
          icon: <Clock className="w-3.5 h-3.5 text-[#e06c1b]" />,
          pill: "bg-[#fdeadb] text-[#a8500f] border-[#fad0b2] dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800/40",
          name: "DEADLINE",
        };
      case "class_override":
        return {
          icon: <BookOpen className="w-3.5 h-3.5 text-[#1d4f9f]" />,
          pill: "bg-[#e4eefc] text-[#1d4f9f] border-[#c6ddf9] dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/40",
          name: "ONLINE CLASS",
        };
      default:
        return {
          icon: <Calendar className="w-3.5 h-3.5 text-spy-muted" />,
          pill: "bg-spy-surface2 text-spy-muted border-spy-border",
          name: "EVENT",
        };
    }
  };

  return (
    <div className="clean-card p-5">
      <div className="flex items-center justify-between pb-3 border-b border-spy-border mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-spy-green" />
          <h3 className="text-xs font-mono font-medium uppercase tracking-wider text-spy-text">
            UPCOMING KEY DATES
          </h3>
        </div>
        {onOpenCalendar && (
          <button
            onClick={onOpenCalendar}
            className="text-[11px] font-mono text-spy-muted hover:text-spy-green flex items-center gap-1 transition-colors"
          >
            <span>Academic Calendar</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {upcoming.length === 0 ? (
        <div className="text-center py-6 text-xs text-spy-muted font-mono">
          NO UPCOMING ACADEMIC EVENTS RECORDED
        </div>
      ) : (
        <div className="space-y-3">
          {upcoming.map(({ event, countdownText, isToday }) => {
            const style = getEventBadge(event.type);
            return (
              <div
                key={event.id}
                className="p-3 rounded-[4px] bg-spy-surface2 border border-spy-border flex items-center justify-between gap-3 transition-colors hover:border-spy-borderLight"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-[3px] bg-spy-surface border border-spy-border shrink-0">
                    {style.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-spy-text line-clamp-2 break-words">
                        {event.title}
                      </span>
                      <span
                        className={`text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.2 rounded-[2px] border font-bold ${style.pill}`}
                      >
                        {style.name}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-spy-muted mt-0.5">
                      {formatDate(event.date)}
                      {event.end_date && ` - ${formatDate(event.end_date)}`}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`inline-block font-mono font-bold text-xs px-2 py-0.5 rounded-[3px] border ${
                      isToday
                        ? "bg-spy-red/20 text-spy-red border-spy-red/40 animate-pulse"
                        : "bg-spy-surface border-spy-border text-spy-text"
                    }`}
                  >
                    {countdownText}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

