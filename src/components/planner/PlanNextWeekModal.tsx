"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  TimeBlock, 
  AcademicEvent, 
  Mission, 
  Category, 
  ResolvedTimeBlock 
} from "@/types/database";
import { 
  getDaysOfWeek, 
  resolveDaySchedule 
} from "@/lib/scheduleResolver";
import { 
  mapMissionToBlockType, 
  calculateBlockMinutes,
  calculateBlockFill 
} from "@/lib/plannerScheduler";
import { formatDate, formatTime12 } from "@/lib/formatters";
import { 
  X, 
  Sparkles, 
  Check, 
  AlertTriangle, 
  ArrowRight
} from "lucide-react";
import { soundFX } from "@/lib/sound";

interface ProposedAssignment {
  missionId: string;
  missionTitle: string;
  categoryName: string;
  categoryColor: string;
  priority: string;
  targetBlockId: string;
  targetBlockLabel: string;
  targetDateStr: string;
  weekday: string;
  startTime: string;
  endTime: string;
  selected: boolean;
}

interface PlanNextWeekModalProps {
  isOpen: boolean;
  currentWeekStartDate: Date;
  timeBlocks: TimeBlock[];
  academicEvents: AcademicEvent[];
  missions: Mission[];
  categories: Category[];
  onClose: () => void;
  onApplyPlan: (
    assignments: Array<{
      missionId: string;
      blockId: string;
      startTime: string;
      endTime: string;
    }>
  ) => Promise<void> | void;
}

export const PlanNextWeekModal: React.FC<PlanNextWeekModalProps> = ({
  isOpen,
  currentWeekStartDate,
  timeBlocks,
  academicEvents,
  missions,
  categories,
  onClose,
  onApplyPlan,
}) => {
  const [proposed, setProposed] = useState<ProposedAssignment[]>([]);
  const [unresolvedMissions, setUnresolvedMissions] = useState<Mission[]>([]);
  const [isApplying, setIsApplying] = useState(false);

  // Compute next week's date range (7 days ahead)
  const nextWeekStart = useMemo(() => {
    const d = new Date(currentWeekStartDate);
    d.setDate(d.getDate() + 7);
    return d;
  }, [currentWeekStartDate]);

  const nextWeekEnd = useMemo(() => {
    const d = new Date(nextWeekStart);
    d.setDate(d.getDate() + 6);
    return d;
  }, [nextWeekStart]);

  const nextWeekDays = useMemo(() => {
    return getDaysOfWeek(nextWeekStart);
  }, [nextWeekStart]);

  // Resolve next week's schedule
  const resolvedNextWeekDays = useMemo(() => {
    return nextWeekDays.map((d) => resolveDaySchedule(d, timeBlocks, academicEvents, missions));
  }, [nextWeekDays, timeBlocks, academicEvents, missions]);

  // Next week's available routine windows
  const routineWindows = useMemo(() => {
    const list: Array<{
      dateStr: string;
      weekday: string;
      block: ResolvedTimeBlock;
      capacityMin: number;
      usedMin: number;
      freeMin: number;
    }> = [];

    for (const day of resolvedNextWeekDays) {
      for (const b of day.blocks) {
        if (b.type === "study" || b.type === "project" || b.type === "cp") {
          const cap = calculateBlockMinutes(b.start_time, b.end_time);
          const fill = calculateBlockFill(b, day.dateStr, missions);
          const free = Math.max(0, cap - fill.totalPlannedMinutes);
          list.push({
            dateStr: day.dateStr,
            weekday: day.weekday,
            block: b,
            capacityMin: cap,
            usedMin: fill.totalPlannedMinutes,
            freeMin: free,
          });
        }
      }
    }
    return list;
  }, [resolvedNextWeekDays, missions]);

  // Unscheduled active missions eligible to plan
  const unscheduledMissions = useMemo(() => {
    return missions.filter(
      (m) => m.status === "active" && !m.scheduled_block_id && !m.scheduled_start
    );
  }, [missions]);

  // Auto-schedule generator function
  const runAutoSchedule = () => {
    soundFX.playBlip();
    const suggestions: ProposedAssignment[] = [];
    const unplaced: Mission[] = [];

    // Track remaining capacity per routine window
    const windowCapMap = new Map<string, number>();
    for (const w of routineWindows) {
      windowCapMap.set(`${w.dateStr}_${w.block.id}`, w.freeMin);
    }

    // Sort missions by priority
    const priorityWeight: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
    const sortedMissions = [...unscheduledMissions].sort((a, b) => {
      const pDiff = (priorityWeight[b.priority] || 1) - (priorityWeight[a.priority] || 1);
      if (pDiff !== 0) return pDiff;
      if (a.deadline && b.deadline) {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      return 0;
    });

    for (const m of sortedMissions) {
      const targetType = mapMissionToBlockType(m, categories);
      const cat = categories.find((c) => c.id === m.category_id);
      const missionMin = m.time_spent_minutes || 45;

      // Find eligible routine windows matching targetType with capacity
      const candidates = routineWindows.filter((w) => {
        if (w.block.type !== targetType) return false;
        const remaining = windowCapMap.get(`${w.dateStr}_${w.block.id}`) ?? 0;
        return remaining >= 30; // at least 30 mins available
      });

      if (candidates.length === 0) {
        unplaced.push(m);
        continue;
      }

      // Pick the earliest available window
      const chosen = candidates[0];
      const key = `${chosen.dateStr}_${chosen.block.id}`;
      const currentRemaining = windowCapMap.get(key) ?? chosen.freeMin;
      windowCapMap.set(key, Math.max(0, currentRemaining - missionMin));

      const startTimeStr = `${chosen.dateStr}T${chosen.block.start_time}:00`;
      const endTimeStr = `${chosen.dateStr}T${chosen.block.end_time}:00`;

      suggestions.push({
        missionId: m.id,
        missionTitle: m.title,
        categoryName: cat?.name || "General",
        categoryColor: cat?.color || "#10b981",
        priority: m.priority,
        targetBlockId: chosen.block.id,
        targetBlockLabel: chosen.block.label,
        targetDateStr: chosen.dateStr,
        weekday: chosen.weekday,
        startTime: startTimeStr,
        endTime: endTimeStr,
        selected: true,
      });
    }

    setProposed(suggestions);
    setUnresolvedMissions(unplaced);
  };

  // Run on mount
  useEffect(() => {
    if (isOpen) {
      runAutoSchedule();
    } else {
      setProposed([]);
      setUnresolvedMissions([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleSelect = (missionId: string) => {
    setProposed((prev) =>
      prev.map((item) =>
        item.missionId === missionId ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setProposed((prev) => prev.map((item) => ({ ...item, selected: checked })));
  };

  const handleApply = async () => {
    const selected = proposed.filter((p) => p.selected);
    if (selected.length === 0) return;

    setIsApplying(true);
    try {
      await onApplyPlan(
        selected.map((s) => ({
          missionId: s.missionId,
          blockId: s.targetBlockId,
          startTime: s.startTime,
          endTime: s.endTime,
        }))
      );
      soundFX.playTargetAcquired();
      onClose();
    } finally {
      setIsApplying(false);
    }
  };

  const selectedCount = proposed.filter((p) => p.selected).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs font-mono">
      <div className="relative w-full max-w-2xl bg-spy-surface border border-spy-border rounded-[6px] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-spy-border bg-spy-surface2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-spy-green" />
            <div>
              <h3 className="text-sm font-bold text-spy-text uppercase tracking-wider">
                Plan Next Week // Helper
              </h3>
              <div className="text-[10px] text-spy-dim font-sans">
                {formatDate(nextWeekStart)} – {formatDate(nextWeekEnd)} • Assign unscheduled missions to routine focus windows
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-spy-muted hover:text-spy-text transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Overview Stats Bar */}
        <div className="grid grid-cols-3 divide-x divide-spy-border border-b border-spy-border bg-spy-surface text-center py-2.5 text-xs">
          <div>
            <div className="text-[10px] text-spy-muted uppercase">Unscheduled</div>
            <div className="font-bold text-spy-text mt-0.5">{unscheduledMissions.length} missions</div>
          </div>
          <div>
            <div className="text-[10px] text-spy-muted uppercase">Next Week Windows</div>
            <div className="font-bold text-spy-green mt-0.5">{routineWindows.length} routine slots</div>
          </div>
          <div>
            <div className="text-[10px] text-spy-muted uppercase">Proposed Placements</div>
            <div className="font-bold text-blue-400 mt-0.5">{proposed.length} suggestions</div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {proposed.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-spy-text">
                  Suggested Placements ({selectedCount}/{proposed.length} selected)
                </span>
                <div className="flex items-center gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => handleSelectAll(true)}
                    className="text-spy-green hover:underline"
                  >
                    Select All
                  </button>
                  <span className="text-spy-border">|</span>
                  <button
                    type="button"
                    onClick={() => handleSelectAll(false)}
                    className="text-spy-muted hover:underline"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {proposed.map((item) => (
                  <label
                    key={item.missionId}
                    className={`p-3 rounded-[4px] border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                      item.selected
                        ? "bg-spy-surface2 border-spy-green/50 shadow-xs"
                        : "bg-spy-surface border-spy-border opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={() => toggleSelect(item.missionId)}
                        className="rounded accent-emerald-500 w-4 h-4 cursor-pointer shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-[10px] mb-0.5">
                          <span
                            className="px-1.5 py-0.2 rounded-[2px] font-bold border truncate"
                            style={{
                              backgroundColor: `${item.categoryColor}15`,
                              borderColor: `${item.categoryColor}40`,
                              color: item.categoryColor,
                            }}
                          >
                            {item.categoryName}
                          </span>
                          <span className="uppercase text-spy-dim">
                            {item.priority}
                          </span>
                        </div>
                        <div className="text-xs font-sans font-bold text-spy-text truncate">
                          {item.missionTitle}
                        </div>
                      </div>
                    </div>

                    <ArrowRight className="w-3.5 h-3.5 text-spy-muted shrink-0" />

                    {/* Target Routine Window */}
                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-spy-green">
                        {item.weekday} • {item.targetBlockLabel}
                      </div>
                      <div className="text-[10px] text-spy-dim font-mono">
                        {formatTime12(item.startTime.split("T")[1]?.slice(0, 5))} – {formatTime12(item.endTime.split("T")[1]?.slice(0, 5))}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Unresolved / Overflow Missions Alert */}
          {unresolvedMissions.length > 0 && (
            <div className="p-3 rounded-[4px] bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  {unresolvedMissions.length} Unscheduled Mission{unresolvedMissions.length > 1 ? "s" : ""} Could Not Be Auto-Placed
                </span>
              </div>
              <p className="text-[11px] font-sans text-spy-dim">
                Next week has insufficient matching routine focus windows for:
              </p>
              <ul className="list-disc list-inside text-[11px] font-sans space-y-0.5 pl-1">
                {unresolvedMissions.map((m) => (
                  <li key={m.id} className="truncate">
                    {m.title}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {proposed.length === 0 && unresolvedMissions.length === 0 && (
            <div className="py-8 text-center text-spy-muted text-xs font-sans">
              No unscheduled missions available to plan. All active directives are already assigned to time blocks!
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-spy-border bg-spy-surface2 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-[3px] border border-spy-border text-spy-muted hover:text-spy-text text-xs"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={runAutoSchedule}
              className="px-3 py-1.5 rounded-[3px] border border-spy-border bg-spy-surface hover:bg-spy-surface2 text-spy-text text-xs flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-spy-green" />
              <span>Regenerate Suggestions</span>
            </button>

            <button
              type="button"
              onClick={handleApply}
              disabled={selectedCount === 0 || isApplying}
              className={`px-4 py-1.5 rounded-[3px] bg-spy-green text-black font-bold text-xs flex items-center gap-1.5 shadow-xs transition-opacity ${
                selectedCount === 0 || isApplying ? "opacity-50 cursor-not-allowed" : "hover:bg-spy-green/90"
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isApplying ? "Applying..." : `Apply Selected (${selectedCount})`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
