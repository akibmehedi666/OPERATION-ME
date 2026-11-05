"use client";

import React, { useState } from "react";
import { Search, AlertCircle } from "lucide-react";
import { Mission, Category } from "@/types/database";
import { MissionCard } from "@/components/ui/MissionCard";

interface MissionQueueProps {
  missions: Mission[];
  categories: Category[];
  onComplete: (mission: Mission) => void;
  onEdit: (mission: Mission) => void;
  onDelete: (mission: Mission) => void;
  onSetActive: (mission: Mission) => void;
}

type FilterStatus = "all" | "active" | "locked" | "failing" | "completed";

export const MissionQueue: React.FC<MissionQueueProps> = ({
  missions,
  categories,
  onComplete,
  onEdit,
  onDelete,
  onSetActive,
}) => {
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const now = new Date();

  const isMissionFailing = (m: Mission) => {
    if (m.status === "completed") return false;
    if (!m.deadline) return false;
    return new Date(m.deadline) < now;
  };

  const filteredMissions = missions.filter((m) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = m.title.toLowerCase().includes(q);
      const matchCodename = m.codename?.toLowerCase().includes(q);
      const matchNotes = m.notes?.toLowerCase().includes(q);
      if (!matchTitle && !matchCodename && !matchNotes) return false;
    }

    if (categoryFilter !== "all" && m.category_id !== categoryFilter) {
      return false;
    }

    if (statusFilter === "all") return true;
    if (statusFilter === "failing") return isMissionFailing(m);
    if (statusFilter === "completed") return m.status === "completed";
    if (statusFilter === "active") return m.status === "active";
    if (statusFilter === "locked") return m.status === "locked";
    return true;
  });

  const failingCount = missions.filter(isMissionFailing).length;
  const activeCount = missions.filter((m) => m.status === "active").length;
  const lockedCount = missions.filter((m) => m.status === "locked").length;
  const completedCount = missions.filter((m) => m.status === "completed").length;

  return (
    <div className="space-y-4">
      {/* Filter and Search Bar */}
      <div className="clean-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status filter tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs font-mono">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-[3px] transition-colors border ${
              statusFilter === "all"
                ? "bg-slate-800 text-white border-slate-700 font-semibold"
                : "bg-transparent text-slate-400 border-transparent hover:text-slate-200"
            }`}
          >
            All ({missions.length})
          </button>

          <button
            onClick={() => setStatusFilter("active")}
            className={`px-3 py-1.5 rounded-[3px] transition-colors border ${
              statusFilter === "active"
                ? "bg-spy-green/10 text-spy-green border-spy-green/40 font-semibold"
                : "bg-transparent text-slate-400 border-transparent hover:text-slate-200"
            }`}
          >
            Active ({activeCount})
          </button>

          <button
            onClick={() => setStatusFilter("locked")}
            className={`px-3 py-1.5 rounded-[3px] transition-colors border ${
              statusFilter === "locked"
                ? "bg-slate-800 text-slate-300 border-slate-700 font-semibold"
                : "bg-transparent text-slate-400 border-transparent hover:text-slate-200"
            }`}
          >
            Queued ({lockedCount})
          </button>

          {failingCount > 0 && (
            <button
              onClick={() => setStatusFilter("failing")}
              className={`px-3 py-1.5 rounded-[3px] transition-colors border flex items-center gap-1 ${
                statusFilter === "failing"
                  ? "bg-red-950/40 text-spy-red border-spy-red/60 font-semibold"
                  : "bg-transparent text-spy-red/80 border-transparent hover:text-spy-red"
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Overdue ({failingCount})</span>
            </button>
          )}

          <button
            onClick={() => setStatusFilter("completed")}
            className={`px-3 py-1.5 rounded-[3px] transition-colors border ${
              statusFilter === "completed"
                ? "bg-slate-800 text-slate-300 border-slate-700 font-semibold"
                : "bg-transparent text-slate-400 border-transparent hover:text-slate-200"
            }`}
          >
            Completed ({completedCount})
          </button>
        </div>

        {/* Search & Category Inputs */}
        <div className="flex items-center gap-2 flex-1 md:max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search missions..."
              className="w-full bg-[#141d18] border border-spy-border pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-spy-borderLight rounded-[3px]"
            />
          </div>

          <div className="relative shrink-0">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-[#141d18] border border-spy-border px-3 py-1.5 text-xs text-slate-300 focus:outline-none rounded-[3px] cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#111714]">
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Missions */}
      {filteredMissions.length === 0 ? (
        <div className="clean-card p-12 text-center text-xs text-slate-500">
          No directives found matching the selected filters.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMissions.map((mission) => {
            const category = categories.find((c) => c.id === mission.category_id);
            return (
              <MissionCard
                key={mission.id}
                mission={mission}
                category={category}
                onComplete={onComplete}
                onEdit={onEdit}
                onDelete={onDelete}
                onSetActive={onSetActive}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
