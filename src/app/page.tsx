"use client";

import React, { useState } from "react";
import { ArrowRight, Plus } from "lucide-react";
import { useAgencyState } from "@/lib/useAgencyState";
import { LoginPage } from "@/components/auth/LoginPage";
import { AgentHeader } from "@/components/dashboard/AgentHeader";
import { StatCardsRow } from "@/components/dashboard/StatCardsRow";
import { TodayBriefing } from "@/components/dashboard/TodayBriefing";
import { TodayPlanTimeline } from "@/components/dashboard/TodayPlanTimeline";
import { MissionCard } from "@/components/ui/MissionCard";
import { MissionQueue } from "@/components/missions/MissionQueue";
import { HistoryView } from "@/components/history/HistoryView";
import { MissionModal } from "@/components/missions/MissionModal";
import { MissionCelebration } from "@/components/missions/MissionCelebration";
import { Button } from "@/components/ui/Button";
import { Mission } from "@/types/database";
import { soundFX } from "@/lib/sound";

export default function Home() {
  const {
    isAuthenticated,
    loading,
    missions,
    categories,
    schedule,
    totalXp,
    streak,
    isSupabaseConnected,
    login,
    guestBypass,
    logout,
    addMission,
    editMission,
    deleteMission,
    setActiveMission,
    completeMission,
  } = useAgencyState();

  const [activeTab, setActiveTab] = useState<"dashboard" | "missions" | "history">("dashboard");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMission, setEditingMission] = useState<Mission | null>(null);

  const [celebrationData, setCelebrationData] = useState<{
    completed: Mission | null;
    next: Mission | null;
    isOpen: boolean;
  }>({
    completed: null,
    next: null,
    isOpen: false,
  });

  const handleComplete = async (mission: Mission) => {
    soundFX.playBlip();
    const result = await completeMission(mission);
    setCelebrationData({
      completed: result.completedMission,
      next: result.nextMission,
      isOpen: true,
    });
  };

  const handleOpenAdd = () => {
    soundFX.playBlip();
    setEditingMission(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (mission: Mission) => {
    soundFX.playBlip();
    setEditingMission(mission);
    setIsModalOpen(true);
  };

  const handleDelete = (mission: Mission) => {
    soundFX.playWarning();
    const confirmed = window.confirm(`Delete mission: "${mission.title}"?`);
    if (confirmed) {
      deleteMission(mission.id);
    }
  };

  const handleSaveMission = (data: Partial<Mission>) => {
    if (editingMission) {
      editMission(data);
    } else {
      addMission(data);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0f0d] font-mono text-slate-400 text-xs">
        INITIALIZING SECURE SESSION...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginPage
        onLogin={login}
        onGuestBypass={guestBypass}
        isSupabaseConnected={isSupabaseConnected}
      />
    );
  }

  // 1. Primary Active Mission for Hero card
  const activeMissions = missions.filter((m) => m.status === "active");
  const heroMission = activeMissions.length > 0 ? activeMissions[0] : null;
  const heroCategory = heroMission
    ? categories.find((c) => c.id === heroMission.category_id)
    : undefined;

  // 2. Identify missions shown in Today's Plan to avoid ANY duplicates on screen
  const now = new Date();
  const missionsInTodayPlanIds = new Set<string>();
  if (heroMission) {
    missionsInTodayPlanIds.add(heroMission.id);
  }

  missions.forEach((m) => {
    if (m.status === "completed") return;
    if (!m.deadline) return;
    const d = new Date(m.deadline);
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();
    const isOverdue = d < now;
    if (isToday || isOverdue) {
      missionsInTodayPlanIds.add(m.id);
    }
  });

  // 3. "Up Next" = exactly 3 missions, strictly NO DUPLICATES of anything already shown above!
  const upNextMissions = missions
    .filter((m) => m.status !== "completed" && !missionsInTodayPlanIds.has(m.id))
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-[#0b0f0d] text-slate-200 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-7">
        {/* A. Header (Agent name, rank + XP bar, streak, New Mission button, logout) */}
        <AgentHeader
          agentName="Agent Akib"
          totalXp={totalXp}
          streak={streak}
          onQuickAdd={handleOpenAdd}
          onLogout={logout}
        />

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mb-6 border-b border-spy-border pb-1">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-4 py-2 text-xs font-mono font-medium uppercase tracking-wider transition-colors border-b-2 -mb-[5px] ${
              activeTab === "dashboard"
                ? "text-spy-green border-spy-green font-bold"
                : "text-slate-400 border-transparent hover:text-slate-200"
            }`}
          >
            Dashboard
          </button>

          <button
            onClick={() => setActiveTab("missions")}
            className={`px-4 py-2 text-xs font-mono font-medium uppercase tracking-wider transition-colors border-b-2 -mb-[5px] flex items-center gap-1.5 ${
              activeTab === "missions"
                ? "text-spy-green border-spy-green font-bold"
                : "text-slate-400 border-transparent hover:text-slate-200"
            }`}
          >
            <span>Missions</span>
            <span className="text-[11px] bg-[#141d18] border border-spy-border px-1.5 py-0.2 rounded-[2px] text-slate-400">
              {missions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 text-xs font-mono font-medium uppercase tracking-wider transition-colors border-b-2 -mb-[5px] flex items-center gap-1.5 ${
              activeTab === "history"
                ? "text-spy-green border-spy-green font-bold"
                : "text-slate-400 border-transparent hover:text-slate-200"
            }`}
          >
            <span>History</span>
            <span className="text-[11px] bg-[#141d18] border border-spy-border px-1.5 py-0.2 rounded-[2px] text-slate-400">
              {missions.filter((m) => m.status === "completed").length}
            </span>
          </button>
        </div>

        {/* ================= DASHBOARD TAB ================= */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* B. Row of 3 small stat cards */}
            <StatCardsRow missions={missions} streak={streak} />

            {/* C. Two Columns: Left (Hero + Today's Plan) & Right (Today's Briefing) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* Left Column: Active Mission (hero), then Today's Plan */}
              <div className="space-y-6">
                {/* Hero Active Mission Card */}
                <div>
                  {heroMission ? (
                    <MissionCard
                      mission={heroMission}
                      category={heroCategory}
                      isHero={true}
                      onComplete={handleComplete}
                      onEdit={handleOpenEdit}
                      onDelete={handleDelete}
                      onSetActive={setActiveMission}
                    />
                  ) : (
                    <div className="clean-card p-8 text-center">
                      <h3 className="text-sm font-medium text-slate-200 mb-1">
                        No active mission
                      </h3>
                      <p className="text-xs text-slate-400 mb-4 font-sans">
                        All primary directives accomplished. Assign a queued target or create a new mission.
                      </p>
                      <Button variant="primary" size="sm" onClick={handleOpenAdd}>
                        <Plus className="w-3.5 h-3.5" />
                        <span>New Mission</span>
                      </Button>
                    </div>
                  )}
                </div>

                {/* D. Today's Plan (ONE merged chronological timeline of classes, tuition & missions) */}
                <TodayPlanTimeline
                  schedule={schedule}
                  missions={missions}
                  categories={categories}
                  activeMissionId={heroMission?.id}
                  onCompleteMission={handleComplete}
                />
              </div>

              {/* Right Column: Today's Briefing (classes + tuition timetable) */}
              <div>
                <TodayBriefing schedule={schedule} />
              </div>
            </div>

            {/* E. "Up Next" = exactly 3 missions, no duplicates of anything above + "View all" */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-spy-border">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-mono font-medium uppercase tracking-wider text-slate-300">
                    UP NEXT ({upNextMissions.length})
                  </h3>
                </div>
                <button
                  onClick={() => setActiveTab("missions")}
                  className="text-xs font-mono text-spy-green hover:underline flex items-center gap-1"
                >
                  <span>View all</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {upNextMissions.length === 0 ? (
                <div className="clean-card p-6 text-center text-xs text-slate-500 font-sans">
                  No other upcoming missions queued.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {upNextMissions.map((mission) => {
                    const category = categories.find((c) => c.id === mission.category_id);
                    return (
                      <MissionCard
                        key={mission.id}
                        mission={mission}
                        category={category}
                        onComplete={handleComplete}
                        onEdit={handleOpenEdit}
                        onDelete={handleDelete}
                        onSetActive={setActiveMission}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= MISSIONS TAB ================= */}
        {activeTab === "missions" && (
          <div>
            <MissionQueue
              missions={missions}
              categories={categories}
              onComplete={handleComplete}
              onEdit={handleOpenEdit}
              onDelete={handleDelete}
              onSetActive={setActiveMission}
            />
          </div>
        )}

        {/* ================= HISTORY TAB ================= */}
        {activeTab === "history" && (
          <div>
            <HistoryView
              missions={missions}
              categories={categories}
              streak={streak}
            />
          </div>
        )}
      </div>

      {/* Modals & Overlays */}
      <MissionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveMission}
        categories={categories}
        editingMission={editingMission}
      />

      <MissionCelebration
        isOpen={celebrationData.isOpen}
        completedMission={celebrationData.completed}
        nextMission={celebrationData.next}
        onClose={() =>
          setCelebrationData({ completed: null, next: null, isOpen: false })
        }
      />
    </div>
  );
}
