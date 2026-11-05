"use client";

import React, { useState } from "react";
import { 
  Crosshair, 
  Filter, 
  Search, 
  AlertTriangle, 
  Layers 
} from "lucide-react";
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

  // Helper to test if a mission is overdue/failing
  const isMissionFailing = (m: Mission) => {
    if (m.status === "completed") return false;
    if (!m.deadline) return false;
    return new Date(m.deadline) < now;
  };

  // Filter missions
  const filteredMissions = missions.filter((m) => {
    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = m.title.toLowerCase().includes(q);
      const matchCodename = m.codename?.toLowerCase().includes(q);
      const matchNotes = m.notes?.toLowerCase().includes(q);
      if (!matchTitle && !matchCodename && !matchNotes) return false;
    }

    // Category filter
    if (categoryFilter !== "all" && m.category_id !== categoryFilter) {
      return false;
    }

    // Status filter
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
    <div className="space-y-4 font-mono">
      {/* Tactical Queue Header with Stats Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-spy-surface border border-spy-border tactical-card">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-spy-dim">
            <Layers className="w-4 h-4 text-spy-green" />
            <span>MISSION DOSSIER // TACTICAL QUEUE</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white mt-1">
            TARGET QUEUE ({missions.length} DIRECTIVES)
          </h2>
        </div>

        {/* Status quick counts */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-2.5 py-1 border transition-colors ${
              statusFilter === "all"
                ? "bg-slate-800 text-white border-slate-600 font-bold"
                : "bg-black/40 text-slate-400 border-slate-800 hover:border-slate-700"
            }`}
          >
            ALL ({missions.length})
          </button>

          <button
            onClick={() => setStatusFilter("active")}
            className={`px-2.5 py-1 border transition-colors ${
              statusFilter === "active"
                ? "bg-spy-green/20 text-spy-green border-spy-green font-bold shadow-spy-green"
                : "bg-black/40 text-spy-green/70 border-slate-800 hover:border-spy-green/40"
            }`}
          >
            ACTIVE ({activeCount})
          </button>

          <button
            onClick={() => setStatusFilter("locked")}
            className={`px-2.5 py-1 border transition-colors ${
              statusFilter === "locked"
                ? "bg-slate-800 text-slate-300 border-slate-600 font-bold"
                : "bg-black/40 text-slate-400 border-slate-800 hover:border-slate-700"
            }`}
          >
            QUEUED ({lockedCount})
          </button>

          {failingCount > 0 && (
            <button
              onClick={() => setStatusFilter("failing")}
              className={`px-2.5 py-1 border transition-colors flex items-center gap-1 ${
                statusFilter === "failing"
                  ? "bg-spy-red text-black border-spy-red font-black shadow-spy-red"
                  : "bg-spy-red/20 text-spy-red border-spy-red/60 animate-pulse font-bold"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              FAILING ({failingCount})
            </button>
          )}

          <button
            onClick={() => setStatusFilter("completed")}
            className={`px-2.5 py-1 border transition-colors ${
              statusFilter === "completed"
                ? "bg-emerald-950/60 text-emerald-400 border-emerald-500 font-bold"
                : "bg-black/40 text-slate-500 border-slate-800 hover:border-slate-700"
            }`}
          >
            COMPLETED ({completedCount})
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search Input */}
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search directives by codename, objective, or notes..."
            className="w-full bg-black/60 border border-spy-border pl-9 pr-3 py-2 text-xs text-spy-text focus:outline-none focus:border-spy-green"
          />
        </div>

        {/* Category Filter */}
        <div className="relative">
          <Filter className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-black/60 border border-spy-border pl-9 pr-3 py-2 text-xs text-spy-text focus:outline-none focus:border-spy-green appearance-none cursor-pointer"
          >
            <option value="all">ALL DEPARTMENTS</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Missions */}
      {filteredMissions.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-500 border border-dashed border-slate-800 bg-spy-surface/40">
          <Crosshair className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          NO DIRECTIVES FOUND MATCHING GIVEN PARAMETERS.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

