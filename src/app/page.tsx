"use client";

import React, { useState, useEffect } from "react";
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
import { CompletionNoteModal } from "@/components/missions/CompletionNoteModal";
import { Button } from "@/components/ui/Button";
import { Mission } from "@/types/database";
import { soundFX } from "@/lib/sound";
import { ThemePreference, ActiveTheme, resolveTheme, applyThemeClass } from "@/lib/theme";

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
    defaultTheme,
    updateDefaultTheme,
    login,
    guestBypass,
    logout,
    addMission,
    editMission,
    deleteMission,
    setActiveMission,
    completeMission,
    updateMissionNote,
  } = useAgencyState();

  const [activeTab, setActiveTab] = useState<"dashboard" | "missions" | "history">("dashboard");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMission, setEditingMission] = useState<Mission | null>(null);

  // Active theme state ("dark" | "light")
  const [currentTheme, setCurrentTheme] = useState<ActiveTheme>("dark");

  useEffect(() => {
    const resolved = resolveTheme(defaultTheme);
    setCurrentTheme(resolved);
    applyThemeClass(resolved);
  }, [defaultTheme]);

  useEffect(() => {
    if (defaultTheme !== "system") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      const next: ActiveTheme = e.matches ? "dark" : "light";
      setCurrentTheme(next);
      applyThemeClass(next);
    };
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [defaultTheme]);

  const handleToggleTheme = () => {
    const next: ActiveTheme = currentTheme === "dark" ? "light" : "dark";
    setCurrentTheme(next);
    applyThemeClass(next);
  };

  const handleUpdateDefaultTheme = (pref: ThemePreference) => {
    updateDefaultTheme(pref);
    const resolved = resolveTheme(pref);
    setCurrentTheme(resolved);
    applyThemeClass(resolved);
  };

  // Completion note & debrief modal state
  const [completionModal, setCompletionModal] = useState<{
    isOpen: boolean;
    mission: Mission | null;
    isEditingOnly: boolean;
  }>({
    isOpen: false,
    mission: null,
    isEditingOnly: false,
  });

  const [celebrationData, setCelebrationData] = useState<{
    completed: Mission | null;
    next: Mission | null;
    isOpen: boolean;
  }>({
    completed: null,
    next: null,
    isOpen: false,
  });

  // When user clicks Accomplish anywhere, open fast completion modal
  const handleInitiateAccomplish = (mission: Mission) => {
    soundFX.playBlip();
    setCompletionModal({
      isOpen: true,
      mission,
      isEditingOnly: false,
    });
  };

  // When user saves or skips in the completion modal
  const handleExecuteAccomplish = async (
    mission: Mission,
    note?: string,
    timeSpent?: number
  ) => {
    const result = await completeMission(mission, note, timeSpent);
    setCelebrationData({
      completed: result.completedMission,
      next: result.nextMission,
      isOpen: true,
    });
  };

  // Edit debrief note on an already completed mission
  const handleOpenEditNote = (mission: Mission) => {
    soundFX.playBlip();
    setCompletionModal({
      isOpen: true,
      mission,
      isEditingOnly: true,
    });
  };

  const handleSaveEditNote = async (
    missionId: string,
    note?: string,
    timeSpent?: number
  ) => {
    await updateMissionNote(missionId, note, timeSpent);
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
      <div className="min-h-screen flex items-center justify-center bg-spy-bg font-mono text-spy-muted text-xs">
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
    <div className="min-h-screen bg-spy-bg text-spy-text pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-7">
        {/* A. Header (Agent name, rank + XP bar, streak, New Mission button, logout) */}
        <AgentHeader
          agentName="Agent Akib"
          totalXp={totalXp}
          streak={streak}
          currentTheme={currentTheme}
          defaultTheme={defaultTheme}
          onToggleTheme={handleToggleTheme}
          onUpdateDefaultTheme={handleUpdateDefaultTheme}
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
                : "text-spy-muted border-transparent hover:text-spy-text"
            }`}
          >
            Dashboard
          </button>

          <button
            onClick={() => setActiveTab("missions")}
            className={`px-4 py-2 text-xs font-mono font-medium uppercase tracking-wider transition-colors border-b-2 -mb-[5px] flex items-center gap-1.5 ${
              activeTab === "missions"
                ? "text-spy-green border-spy-green font-bold"
                : "text-spy-muted border-transparent hover:text-spy-text"
            }`}
          >
            <span>Missions</span>
            <span className="text-[11px] bg-spy-surface2 border border-spy-border px-1.5 py-0.5 rounded-[2px] text-spy-muted">
              {missions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 text-xs font-mono font-medium uppercase tracking-wider transition-colors border-b-2 -mb-[5px] flex items-center gap-1.5 ${
              activeTab === "history"
                ? "text-spy-green border-spy-green font-bold"
                : "text-spy-muted border-transparent hover:text-spy-text"
            }`}
          >
            <span>History</span>
            <span className="text-[11px] bg-spy-surface2 border border-spy-border px-1.5 py-0.5 rounded-[2px] text-spy-muted">
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
                      onComplete={handleInitiateAccomplish}
                      onEdit={handleOpenEdit}
                      onDelete={handleDelete}
                      onSetActive={setActiveMission}
                      onEditNote={handleOpenEditNote}
                    />
                  ) : (
                    <div className="clean-card p-8 text-center">
                      <h3 className="text-sm font-medium text-spy-text mb-1">
                        No active mission
                      </h3>
                      <p className="text-xs text-spy-muted mb-4 font-sans">
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
                  onCompleteMission={handleInitiateAccomplish}
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
                  <h3 className="text-xs font-mono font-medium uppercase tracking-wider text-spy-text">
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
                <div className="clean-card p-6 text-center text-xs text-spy-muted font-sans">
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
                        onComplete={handleInitiateAccomplish}
                        onEdit={handleOpenEdit}
                        onDelete={handleDelete}
                        onSetActive={setActiveMission}
                        onEditNote={handleOpenEditNote}
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
              onComplete={handleInitiateAccomplish}
              onEdit={handleOpenEdit}
              onDelete={handleDelete}
              onSetActive={setActiveMission}
              onEditNote={handleOpenEditNote}
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
              onEditNote={handleOpenEditNote}
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

      <CompletionNoteModal
        isOpen={completionModal.isOpen}
        mission={completionModal.mission}
        isEditingOnly={completionModal.isEditingOnly}
        onComplete={handleExecuteAccomplish}
        onSaveEdit={handleSaveEditNote}
        onClose={() =>
          setCompletionModal({ isOpen: false, mission: null, isEditingOnly: false })
        }
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
