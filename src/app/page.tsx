"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
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
import { PromotionOverlay } from "@/components/missions/PromotionOverlay";
import { CompletionNoteModal } from "@/components/missions/CompletionNoteModal";
import { Button } from "@/components/ui/Button";
import { Mission } from "@/types/database";
import { soundFX } from "@/lib/sound";
import { ThemePreference, ActiveTheme, resolveTheme, applyThemeClass } from "@/lib/theme";
import { AnimationProvider } from "@/lib/animationContext";

// Dashboard stagger variants: cards fade + slide up 12px with 60ms stagger on load
const dashboardContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const dashboardCardVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: "easeOut",
    },
  },
};

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

  // Mission accomplishment animation state
  const [accomplishingMissionId, setAccomplishingMissionId] = useState<string | null>(null);

  // Rank promotion modal state
  const [promotionData, setPromotionData] = useState<{
    isOpen: boolean;
    newRank: string;
  }>({
    isOpen: false,
    newRank: "",
  });

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
    isFirstToday?: boolean;
    isRankUp?: boolean;
  }>({
    completed: null,
    next: null,
    isOpen: false,
    isFirstToday: false,
    isRankUp: false,
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
    // 1. Close debrief modal first so operative sees the card animation
    setCompletionModal({ isOpen: false, mission: null, isEditingOnly: false });

    // 2. Trigger on-card accomplishment animation (green flash, drawing check, stamp thump, floating XP)
    setAccomplishingMissionId(mission.id);

    // 3. Wait 380ms for card stamp thump and +XP float animation
    await new Promise((resolve) => setTimeout(resolve, 380));

    // 4. Complete mission in state
    const result = await completeMission(mission, note, timeSpent);
    setAccomplishingMissionId(null);

    // 5. If rank up occurred, trigger the full-screen promotion overlay
    if (result.isRankUp) {
      setPromotionData({
        isOpen: true,
        newRank: result.newRank,
      });
    }

    // 6. Trigger celebration modal with confetti burst for first-today or rank-up
    setCelebrationData({
      completed: result.completedMission,
      next: result.nextMission,
      isOpen: true,
      isFirstToday: result.isFirstToday,
      isRankUp: result.isRankUp,
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
    <AnimationProvider>
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

          {/* Navigation Tabs (Smooth layoutId sliding indicator) */}
          <div className="flex items-center gap-2 mb-6 border-b border-spy-border pb-1 relative">
            {(["dashboard", "missions", "history"] as const).map((tab) => {
              const isActive = activeTab === tab;
              const label =
                tab === "dashboard"
                  ? "Dashboard"
                  : tab === "missions"
                  ? "Missions"
                  : "History";
              const count =
                tab === "missions"
                  ? missions.length
                  : tab === "history"
                  ? missions.filter((m) => m.status === "completed").length
                  : null;

              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative px-4 py-2 text-xs font-mono font-medium uppercase tracking-wider transition-colors rounded-t-[4px] flex items-center gap-1.5 ${
                    isActive
                      ? "text-[#14663a] dark:text-spy-green font-bold"
                      : "text-spy-muted hover:text-spy-text hover:bg-spy-surface2"
                  }`}
                >
                  {/* Sliding active pill indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      transition={{ type: "spring", stiffness: 450, damping: 32 }}
                      className="absolute inset-0 bg-[#dcf3e4] dark:bg-spy-surface2 rounded-t-[4px] border-b-2 border-[#1f7a4d] dark:border-spy-green -mb-[1px]"
                    />
                  )}
                  <span className="relative z-10">{label}</span>
                  {count !== null && (
                    <span
                      className={`relative z-10 text-[11px] px-1.5 py-0.5 rounded-[2px] border ${
                        isActive
                          ? "bg-[#c5e9d0] text-[#14663a] border-[#a4dab3] dark:bg-spy-surface dark:text-spy-green dark:border-spy-border"
                          : "bg-spy-surface2 border-spy-border text-spy-muted"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content Cross-Fade + Slight Slide */}
          <AnimatePresence mode="wait">
            {activeTab === "dashboard" && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {/* ================= DASHBOARD TAB WITH STAGGER ================= */}
                <motion.div
                  variants={dashboardContainerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-6"
                >
                  {/* B. Row of 3 small stat cards */}
                  <motion.div variants={dashboardCardVariants}>
                    <StatCardsRow missions={missions} streak={streak} />
                  </motion.div>

                  {/* C. Two Columns: Left (Hero + Today's Plan) & Right (Today's Briefing) */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    {/* Left Column: Active Mission (hero), then Today's Plan */}
                    <motion.div variants={dashboardCardVariants} className="space-y-6">
                      {/* Hero Active Mission Card */}
                      <div>
                        {heroMission ? (
                          <MissionCard
                            mission={heroMission}
                            category={heroCategory}
                            isHero={true}
                            isAccomplishing={heroMission.id === accomplishingMissionId}
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
                        accomplishingMissionId={accomplishingMissionId}
                        onCompleteMission={handleInitiateAccomplish}
                      />
                    </motion.div>

                    {/* Right Column: Today's Briefing (classes + tuition timetable) */}
                    <motion.div variants={dashboardCardVariants}>
                      <TodayBriefing schedule={schedule} />
                    </motion.div>
                  </div>

                  {/* E. "Up Next" = exactly 3 missions, no duplicates of anything above + "View all" */}
                  <motion.div variants={dashboardCardVariants} className="pt-2">
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
                              isAccomplishing={mission.id === accomplishingMissionId}
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
                  </motion.div>
                </motion.div>
              </motion.div>
            )}

            {activeTab === "missions" && (
              <motion.div
                key="missions"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {/* ================= MISSIONS TAB ================= */}
                <MissionQueue
                  missions={missions}
                  categories={categories}
                  accomplishingMissionId={accomplishingMissionId}
                  onComplete={handleInitiateAccomplish}
                  onEdit={handleOpenEdit}
                  onDelete={handleDelete}
                  onSetActive={setActiveMission}
                  onEditNote={handleOpenEditNote}
                />
              </motion.div>
            )}

            {activeTab === "history" && (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {/* ================= HISTORY TAB ================= */}
                <HistoryView
                  missions={missions}
                  categories={categories}
                  streak={streak}
                  onEditNote={handleOpenEditNote}
                />
              </motion.div>
            )}
          </AnimatePresence>
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
          isFirstToday={celebrationData.isFirstToday}
          isRankUp={celebrationData.isRankUp}
          onClose={() =>
            setCelebrationData({
              completed: null,
              next: null,
              isOpen: false,
              isFirstToday: false,
              isRankUp: false,
            })
          }
        />

        {/* Full-screen Promotion Overlay on rank advancement */}
        <PromotionOverlay
          isOpen={promotionData.isOpen}
          newRank={promotionData.newRank}
          onClose={() => setPromotionData({ isOpen: false, newRank: "" })}
        />
      </div>
    </AnimationProvider>
  );
}
