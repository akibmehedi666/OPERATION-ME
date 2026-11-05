"use client";

import React, { useState } from "react";
import { 
  ArrowRight,
  Plus
} from "lucide-react";
import { useAgencyState } from "@/lib/useAgencyState";
import { LoginPage } from "@/components/auth/LoginPage";
import { AgentHeader } from "@/components/dashboard/AgentHeader";
import { TodayBriefing } from "@/components/dashboard/TodayBriefing";
import { DueTodayList } from "@/components/dashboard/DueTodayList";
import { MissionCard } from "@/components/ui/MissionCard";
import { MissionQueue } from "@/components/missions/MissionQueue";
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

  // Tab State: "dashboard" or "missions"
  const [activeTab, setActiveTab] = useState<"dashboard" | "missions">("dashboard");

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMission, setEditingMission] = useState<Mission | null>(null);

  // Celebration state
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
    const confirmed = window.confirm(
      `Delete mission: "${mission.title}"?`
    );
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

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0f0d] font-mono text-slate-400 text-xs">
        INITIALIZING SECURE SESSION...
      </div>
    );
  }

  // If not authenticated, show calm login
  if (!isAuthenticated) {
    return (
      <LoginPage
        onLogin={login}
        onGuestBypass={guestBypass}
        isSupabaseConnected={isSupabaseConnected}
      />
    );
  }

  // Find the primary active mission for hero card
  const activeMissions = missions.filter((m) => m.status === "active");
  const heroMission = activeMissions.length > 0 ? activeMissions[0] : null;
  const heroCategory = heroMission
    ? categories.find((c) => c.id === heroMission.category_id)
    : undefined;

  // Next 3 queued missions (excluding the hero mission, non-completed)
  const nextQueuedMissions = missions
    .filter((m) => m.status !== "completed" && m.id !== heroMission?.id)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-[#0b0f0d] text-slate-200 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-7">
        {/* Header: Agent name, rank + XP bar, streak, New Mission button, logout */}
        <AgentHeader
          agentName="Agent Akib"
          totalXp={totalXp}
          streak={streak}
          onQuickAdd={handleOpenAdd}
          onLogout={logout}
        />

        {/* Navigation Tabs ("Dashboard" / "Missions") */}
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
        </div>

        {/* Tab 1: Dashboard View */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* Active Mission + Today's Briefing Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* Left Column: Active Mission Hero + Remaining Due Today */}
              <div className="space-y-6">
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

                {/* Remaining missions due today (simple compact list, excluding active one) */}
                <DueTodayList
                  missions={missions}
                  categories={categories}
                  activeMissionId={heroMission?.id}
                  onComplete={handleComplete}
                />
              </div>

              {/* Right Column: Today's Briefing (Classes + Tuition side by side) */}
              <div>
                <TodayBriefing schedule={schedule} />
              </div>
            </div>

            {/* Next 3 Queued Missions with "View all" link */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-spy-border">
                <h3 className="text-xs font-mono font-medium uppercase tracking-wider text-slate-300">
                  Next in Queue
                </h3>
                <button
                  onClick={() => setActiveTab("missions")}
                  className="text-xs font-mono text-spy-green hover:underline flex items-center gap-1"
                >
                  <span>View all missions</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {nextQueuedMissions.length === 0 ? (
                <div className="clean-card p-6 text-center text-xs text-slate-500 font-sans">
                  No other missions currently queued.
                </div>
              ) : (
                <div className="space-y-3">
                  {nextQueuedMissions.map((mission) => {
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

        {/* Tab 2: Full Missions Queue */}
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
