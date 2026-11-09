"use client";

import React, { useState } from "react";
import { Mission, TimeBlock, Category } from "@/types/database";
import { formatTime12, formatDate } from "@/lib/formatters";
import { getCategoryTheme } from "@/lib/categoryTheme";
import { X, Target, Clock, Plus, Search } from "lucide-react";

interface AssignMissionModalProps {
  isOpen: boolean;
  block: TimeBlock | null;
  blockDateStr: string;
  missions: Mission[];
  categories: Category[];
  onAssign: (missionId: string, blockId: string, startTime: string, endTime: string) => void;
  onCreateNew?: () => void;
  onClose: () => void;
}

export const AssignMissionModal: React.FC<AssignMissionModalProps> = ({
  isOpen,
  block,
  blockDateStr,
  missions,
  categories,
  onAssign,
  onCreateNew,
  onClose,
}) => {
  const [search, setSearch] = useState("");

  if (!isOpen || !block) return null;

  // Unscheduled active missions
  const unassignedMissions = missions.filter(
    (m) => m.status === "active" && !m.scheduled_block_id
  );

  const filteredMissions = unassignedMissions.filter((m) =>
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    m.codename.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (missionId: string) => {
    const startTime = `${blockDateStr}T${block.start_time}:00`;
    const endTime = `${blockDateStr}T${block.end_time}:00`;
    onAssign(missionId, block.id, startTime, endTime);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md p-6 bg-spy-surface border border-spy-border rounded-[6px] shadow-2xl text-spy-text max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-spy-border mb-3 shrink-0">
          <div>
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-spy-text flex items-center gap-2">
              <Target className="w-4 h-4 text-spy-green" />
              <span>ASSIGN MISSION TO BLOCK</span>
            </h3>
            <div className="text-xs font-mono text-spy-muted mt-0.5">
              {block.label} ({formatTime12(block.start_time)} - {formatTime12(block.end_time)})
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-spy-muted hover:text-spy-text rounded-[3px] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action: Create New Mission */}
        {onCreateNew && (
          <button
            type="button"
            onClick={() => {
              onClose();
              onCreateNew();
            }}
            className="w-full mb-3 py-2 px-3 rounded-[4px] bg-[#14663a] text-white hover:bg-[#0f4d2c] dark:bg-spy-green dark:text-black dark:hover:bg-spy-green/90 font-mono font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>CREATE NEW MISSION FOR THIS BLOCK</span>
          </button>
        )}

        {/* Search */}
        <div className="relative mb-3 shrink-0">
          <Search className="w-3.5 h-3.5 text-spy-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search unassigned targets..."
            className="w-full bg-spy-surface2 border border-spy-border pl-8 pr-3 py-1.5 text-xs text-spy-text rounded-[3px] focus:outline-none focus:border-spy-green font-mono"
          />
        </div>

        {/* Missions List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {filteredMissions.length === 0 ? (
            <div className="text-center py-8 text-xs font-mono text-spy-muted">
              {unassignedMissions.length === 0
                ? "NO UNASSIGNED ACTIVE MISSIONS AVAILABLE"
                : "NO MISSIONS MATCH SEARCH"}
            </div>
          ) : (
            filteredMissions.map((mission) => {
              const cat = categories.find((c) => c.id === mission.category_id);
              const catTheme = getCategoryTheme(cat?.name || mission.title);

              return (
                <div
                  key={mission.id}
                  onClick={() => handleSelect(mission.id)}
                  className="p-2.5 rounded-[4px] bg-spy-surface2 border border-spy-border hover:border-spy-green cursor-pointer transition-colors flex items-center justify-between gap-2 group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-[2px] border ${catTheme.chipClass}`}>
                        {cat?.name || "General"}
                      </span>
                      <span className="text-[10px] font-mono text-spy-muted">
                        [{mission.codename}]
                      </span>
                      {(mission.deadline || mission.scheduled_end) && (
                        <span className="text-[10px] font-mono text-spy-muted flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          <span>Due {formatDate(mission.deadline || mission.scheduled_end!)}</span>
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-medium text-spy-text truncate">
                      {mission.title}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="p-1.5 rounded-[3px] bg-spy-surface border border-spy-border group-hover:border-spy-green group-hover:text-spy-green transition-colors text-spy-muted shrink-0"
                    title="Assign to this block"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-spy-border mt-3 text-right shrink-0">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-mono text-spy-muted hover:text-spy-text border border-spy-border rounded-[3px]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

