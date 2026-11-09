"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { ArrowRight, Plus, AlertCircle, RefreshCw } from "lucide-react";
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
import { Mission, DayOfWeek, TimeBlock, FeatureFlags } from "@/types/database";
import { soundFX } from "@/lib/sound";
import { useTheme } from "@/lib/themeContext";
import { PlannerView } from "@/components/planner/PlannerView";
import { TuitionScheduleModal } from "@/components/planner/TuitionScheduleModal";
import { TuitionActionModal } from "@/components/planner/TuitionActionModal";
import { UpcomingDatesCard } from "@/components/dashboard/UpcomingDatesCard";
import { DashboardBanner } from "@/components/dashboard/DashboardBanner";
import { CourseHQView } from "@/components/courses/CourseHQView";
import { CodeforcesView } from "@/components/cf/CodeforcesView";
import { CodeforcesLogModal } from "@/components/cf/CodeforcesLogModal";
import {
  fetchCodeforcesSubmissions,
  parseSubmissionsToProblems,
  deduplicateAndFormatNewLogs,
  computeUniqueSolvedCount,
} from "@/lib/codeforcesApi";
import { CyberRoadmapView } from "@/components/cyber/CyberRoadmapView";
import { ResearchPapersView } from "@/components/papers/ResearchPapersView";
import { PaperSummaryModal } from "@/components/papers/PaperSummaryModal";
import { SideProjectsView } from "@/components/projects/SideProjectsView";
import { ProgressReviewView } from "@/components/review/ProgressReviewView";
import { InsightsCard } from "@/components/dashboard/InsightsCard";
import { NotificationToast } from "@/components/ui/NotificationToast";
import { ErrorToastContainer } from "@/components/ui/ErrorToastContainer";
import { getDueNotifications } from "@/lib/notificationScheduler";

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
    timeBlocks,
    academicEvents,
    recurringRules,
    courses,
    lectureLogs,
    cyberTopics,
    researchPapers,
    sideProjects,
    cfLogs,
    weeklyReviews,
    notificationSettings,
    totalXp,
    streak,
    login,
    resetPassword,
    logout,
    addMission,
    editMission,
    deleteMission,
    setActiveMission,
    completeMission,
    updateMissionNote,
    addTimeBlock,
    updateTimeBlock,
    deleteTimeBlock,
    addAcademicEvent,
    updateAcademicEvent,
    deleteAcademicEvent,
    scheduleMissionToBlock,
    confirmAutoScheduledMission,
    runAutoScheduler,
    toggleRecurringRule,
    updateRecurringRule,
    addRecurringRule,
    deleteRecurringRule,
    runAutoMissionsGenerator,
    addLectureLog,
    updateLectureLog,
    deleteLectureLog,
    toggleLectureStudied,
    addCourseResource,
    deleteCourseResource,
    updateCourse,
    updateTuitionSchedule,
    tuitionExceptions,
    moveTuitionSession,
    cancelTuitionSession,
    undoTuitionException,
    addCfLog,
    updateCfLog,
    deleteCfLog,
    importCfLogs,
    deduplicateCfLogs,
    cfHandle,
    updateCfHandle,
    updateCyberTopicStatus,
    addCyberTopic,
    addResearchPaper,
    updateResearchPaper,
    deleteResearchPaper,
    addSideProject,
    updateSideProject,
    deleteSideProject,
    saveWeeklyReview,
    updateNotificationSettings,
    updateDefaultTheme,
    updateUserSettings,
    features,
    updateFeatures,
    resetAllProgress,
    errorToasts,
    dismissErrorToast,
    structureLoadingError,
    dataLoadingError,
    supabaseConfigError,
    retryLoadData,
    retryLoadStructure,
  } = useAgencyState();

  const {
    defaultTheme,
    activeTheme,
    setDefaultTheme,
    toggleActiveTheme,
  } = useTheme();

  const [activeTab, setActiveTab] = useState<
    | "dashboard"
    | "missions"
    | "planner"
    | "courses"
    | "codeforces"
    | "cyber"
    | "papers"
    | "projects"
    | "review"
    | "history"
  >("dashboard");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("course-os");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCpMissionLogOpen, setIsCpMissionLogOpen] = useState(false);
  const [isPaperMissionModalOpen, setIsPaperMissionModalOpen] = useState(false);
  const [editingMission, setEditingMission] = useState<Mission | null>(null);
  const [tuitionModal, setTuitionModal] = useState<{
    isOpen: boolean;
    day?: DayOfWeek;
    startTime?: string;
    endTime?: string;
    targetDate?: string;
  }>({
    isOpen: false,
  });

  const [tuitionActionModal, setTuitionActionModal] = useState<{
    isOpen: boolean;
    dateStr: string;
    startTime: string;
    endTime: string;
    slotId?: string;
  }>({
    isOpen: false,
    dateStr: "",
    startTime: "18:00",
    endTime: "19:30",
  });

  // Real-time notification alerts evaluated from schedule, deadlines, and quiet hours
  const dueNotifications = React.useMemo(() => {
    if (typeof window === "undefined" || !features.notifications) return [];
    return getDueNotifications(new Date(), {
      schedule,
      events: academicEvents,
      missions,
      settings: notificationSettings,
      tuitionExceptions,
    });
  }, [schedule, academicEvents, missions, notificationSettings, features.notifications, tuitionExceptions]);

  // Track initial mount so that page-load stagger does not replay on subsequent re-renders
  const isFirstMount = React.useRef(true);
  useEffect(() => {
    isFirstMount.current = false;
  }, []);

  // Redirect to dashboard if the active tab is disabled via feature toggles
  useEffect(() => {
    const tabFeatureMap: Record<typeof activeTab, keyof FeatureFlags> = {
      dashboard: "dashboard",
      missions: "missions",
      planner: "planner",
      courses: "courses",
      codeforces: "codeforces",
      cyber: "cyber",
      papers: "research",
      projects: "projects",
      review: "review",
      history: "history",
    };
    const featureKey = tabFeatureMap[activeTab];
    if (featureKey && !features[featureKey]) {
      setActiveTab("dashboard");
    }
  }, [features, activeTab]);

  // Dynamic document title reflecting the active view / tab
  useEffect(() => {
    if (typeof document === "undefined") return;
    const tabTitles: Record<typeof activeTab, string> = {
      dashboard: "Dashboard | Operation ME",
      missions: "Missions | Operation ME",
      planner: "Planner | Operation ME",
      courses: "Course HQ | Operation ME",
      codeforces: "Codeforces | Operation ME",
      cyber: "Cybersecurity | Operation ME",
      papers: "Research Papers | Operation ME",
      projects: "Side Projects | Operation ME",
      review: "Progress Review | Operation ME",
      history: "History | Operation ME",
    };
    document.title = tabTitles[activeTab] || "Operation ME";
  }, [activeTab]);

  // PWA Shortcuts & URL Action Deep Linking
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const action = params.get("action");
    const tab = params.get("tab");

    if (action === "new-mission") {
      handleOpenAdd();
      window.history.replaceState({}, "", "/");
    } else if (tab === "planner") {
      setActiveTab("planner");
      window.history.replaceState({}, "", "/");
    }
  }, []);

  // Codeforces auto-sync on app open (throttled: at most once per hour)
  const lastCfSyncRef = useRef<number>(0);
  useEffect(() => {
    if (!isAuthenticated || loading || !features.codeforces) return;
    const handleToSync = cfHandle?.trim();
    if (!handleToSync) return;

    const ONE_HOUR = 60 * 60 * 1000;
    if (!lastCfSyncRef.current || Date.now() - lastCfSyncRef.current > ONE_HOUR) {
      (async () => {
        try {
          const subs = await fetchCodeforcesSubmissions(handleToSync);
          const parsed = parseSubmissionsToProblems(subs);
          const { newLogs } = deduplicateAndFormatNewLogs(parsed, cfLogs, handleToSync);
          if (newLogs.length > 0) {
            await importCfLogs(newLogs);
          }
          lastCfSyncRef.current = Date.now();
        } catch (err) {
          console.warn("Background Codeforces auto-sync skipped:", err);
        }
      })();
    }
  }, [isAuthenticated, loading, cfHandle, cfLogs, importCfLogs, features.codeforces]);

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

    // 7. If CP mission and Codeforces feature is enabled, trigger quick Codeforces log modal
    const isCpMission =
      mission.category_id === "cat-10" ||
      mission.recurring_rule_id === "rule-cp-daily" ||
      mission.title.toLowerCase().includes("codeforces");
    if (isCpMission && features.codeforces) {
      setTimeout(() => {
        setIsCpMissionLogOpen(true);
      }, 700);
    }

    // 8. If Research Paper mission and Research feature is enabled, trigger quick Paper summary modal
    const isPaperMission =
      mission.category_id === "cat-9" ||
      mission.recurring_rule_id === "rule-paper-weekly" ||
      mission.title.toLowerCase().includes("paper");
    if (isPaperMission && features.research) {
      setTimeout(() => {
        setIsPaperMissionModalOpen(true);
      }, 700);
    }
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

  const handleAssignNewMission = ({
    block,
    dateStr,
    startTime,
    endTime,
    defaultCategoryId,
  }: {
    block?: TimeBlock | null;
    dateStr: string;
    startTime: string;
    endTime: string;
    defaultCategoryId?: string;
  }) => {
    soundFX.playBlip();
    const cleanTime = (t: string) => {
      if (!t) return "14:00";
      const parts = t.split(":");
      return `${(parts[0] || "14").padStart(2, "0")}:${(parts[1] || "00").slice(0, 2).padStart(2, "0")}`;
    };
    const cleanStart = cleanTime(startTime);
    const cleanEnd = cleanTime(endTime);
    const scheduledStart = `${dateStr}T${cleanStart}:00`;
    const scheduledEnd = `${dateStr}T${cleanEnd}:00`;

    let targetCatId = defaultCategoryId || block?.default_category || null;
    if (targetCatId && !categories.some((c) => c.id === targetCatId)) {
      const match = categories.find(
        (c) =>
          c.name.toLowerCase() === targetCatId?.toLowerCase() ||
          (c.codename && c.codename.toLowerCase() === targetCatId?.toLowerCase()) ||
          c.id === targetCatId
      );
      if (match) targetCatId = match.id;
    }
    if (!targetCatId && categories.length > 0) {
      targetCatId = categories[0].id;
    }

    setEditingMission({
      id: "",
      title: "",
      codename: "",
      category_id: targetCatId,
      priority: "medium",
      status: "active",
      xp: 50,
      scheduled_block_id: block?.id || null,
      scheduled_start: scheduledStart,
      scheduled_end: scheduledEnd,
      deadline: scheduledEnd,
      created_at: new Date().toISOString(),
    });
    setIsModalOpen(true);
  };

  const handleSaveMission = async (data: Partial<Mission>) => {
    if (editingMission && editingMission.id && editingMission.id.trim() !== "") {
      return await editMission(data);
    } else {
      return await addMission(data);
    }
  };

  // 1. Supabase environment configuration error screen
  if (supabaseConfigError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-spy-bg font-mono text-spy-text p-6 text-center select-none">
        <div className="w-full max-w-md bg-spy-surface border border-spy-red/40 rounded-[6px] p-6 space-y-4">
          <div className="w-10 h-10 mx-auto rounded-full bg-spy-danger-surface text-spy-red flex items-center justify-center border border-spy-red/30">
            <AlertCircle className="w-5 h-5 text-spy-red" />
          </div>
          <h1 className="text-base font-bold text-spy-red tracking-wider uppercase">
            Supabase is not configured
          </h1>
          <p className="text-xs text-spy-muted leading-relaxed">
            {supabaseConfigError}
          </p>
          <div className="text-[11px] bg-spy-surface2 border border-spy-border p-3 rounded text-left text-spy-dim font-mono space-y-1">
            <div>NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co</div>
            <div>NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...</div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Loading screen while authenticating and loading tables
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-spy-bg font-mono text-spy-muted text-xs gap-3 p-4 select-none">
        <div className="flex items-center gap-2 text-spy-green">
          <span className="w-2 h-2 rounded-full bg-spy-green animate-ping" />
          <span className="tracking-widest font-bold">INITIALIZING SECURE SESSION...</span>
        </div>
        <p className="text-[10px] text-spy-dim">Connecting to Supabase Cloud</p>
      </div>
    );
  }

  // 3. Login page for unauthenticated users
  if (!isAuthenticated) {
    return (
      <LoginPage
        onLogin={login}
        onResetPassword={resetPassword}
      />
    );
  }

  // 4. Data loading error screen with Retry button
  if (dataLoadingError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-spy-bg font-mono text-spy-text p-6 text-center select-none">
        <div className="w-full max-w-md bg-spy-surface border border-spy-red/40 rounded-[6px] p-6 space-y-4">
          <div className="w-10 h-10 mx-auto rounded-full bg-spy-danger-surface text-spy-red flex items-center justify-center border border-spy-red/30">
            <AlertCircle className="w-5 h-5 text-spy-red" />
          </div>
          <h1 className="text-base font-bold text-spy-red tracking-wider uppercase">
            Data Synchronization Failed
          </h1>
          <p className="text-xs text-spy-muted leading-relaxed">
            {dataLoadingError}
          </p>
          <Button
            variant="primary"
            size="md"
            onClick={retryLoadData}
            className="w-full mt-2 flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Connection</span>
          </Button>
        </div>
      </div>
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
            currentTheme={activeTheme}
            defaultTheme={defaultTheme}
            onToggleTheme={toggleActiveTheme}
            onUpdateDefaultTheme={(pref) => {
              setDefaultTheme(pref);
              updateDefaultTheme(pref);
            }}
            onQuickAdd={handleOpenAdd}
            onLogout={logout}
            recurringRules={recurringRules}
            categories={categories}
            notificationSettings={notificationSettings}
            onToggleRecurringRule={toggleRecurringRule}
            onUpdateRecurringRule={updateRecurringRule}
            onAddRecurringRule={addRecurringRule}
            onDeleteRecurringRule={deleteRecurringRule}
            onRunAutoMissionsGenerator={runAutoMissionsGenerator}
            onUpdateNotificationSettings={updateNotificationSettings}
            onUpdateUserSettings={updateUserSettings}
            features={features}
            onUpdateFeatures={updateFeatures}
            onResetAllProgress={resetAllProgress}
            onOpenTuitionModal={() => setTuitionModal({ isOpen: true })}
          />

          {/* Navigation Tabs (Smooth layoutId sliding indicator, scrollable on mobile) */}
          <div className="flex items-center gap-1 sm:gap-2 mb-6 border-b border-spy-border pb-1 relative overflow-x-auto scrollbar-none whitespace-nowrap">
            {([
              { id: "dashboard", label: "Dashboard", feature: "dashboard" as const },
              { id: "missions", label: "Missions", feature: "missions" as const },
              { id: "planner", label: "Planner", feature: "planner" as const },
              { id: "courses", label: "Courses", feature: "courses" as const },
              { id: "codeforces", label: "Codeforces", feature: "codeforces" as const },
              { id: "cyber", label: "Cyber", feature: "cyber" as const },
              { id: "papers", label: "Research", feature: "research" as const },
              { id: "projects", label: "Projects", feature: "projects" as const },
              { id: "review", label: "Review", feature: "review" as const },
              { id: "history", label: "History", feature: "history" as const },
            ] as const)
              .filter((tabItem) => features[tabItem.feature])
              .map(({ id: tab, label }) => {
                const isActive = activeTab === tab;
                const count =
                  tab === "missions"
                    ? missions.length
                    : tab === "courses"
                    ? courses.length
                    : tab === "codeforces"
                    ? computeUniqueSolvedCount(cfLogs)
                    : tab === "cyber"
                    ? `${cyberTopics.filter((t) => t.status === "done").length}/${cyberTopics.length}`
                    : tab === "papers"
                    ? `${researchPapers.filter((p) => p.status === "done").length}/${researchPapers.length}`
                    : tab === "projects"
                    ? `${sideProjects.filter((p) => p.status === "active").length}`
                    : tab === "history"
                    ? missions.filter((m) => m.status === "completed").length
                    : null;

                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`relative px-3 sm:px-4 py-2 text-xs font-mono font-medium uppercase tracking-wider transition-colors rounded-t-[4px] flex items-center gap-1.5 shrink-0 ${
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
                  initial={isFirstMount.current ? "hidden" : false}
                  animate="visible"
                  className="space-y-6"
                >
                  {/* Strategic Directive Alert Banner (7-day alert before exams/payments) */}
                  {features.planner && (
                    <DashboardBanner events={academicEvents} onOpenPlanner={() => setActiveTab("planner")} />
                  )}

                  {/* B. Row of 3 small stat cards */}
                  <motion.div variants={dashboardCardVariants}>
                    <StatCardsRow missions={missions} streak={streak} />
                  </motion.div>

                  {/* C. Two Columns: Left (Hero + Today's Plan) & Right (Today's Briefing + Upcoming Dates) */}
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
                              {!features.auto_missions
                                ? "Daily auto-missions are turned off. Turn them on to automatically schedule routine study, tuition prep, and review targets."
                                : "All primary directives accomplished. Assign a queued target or create a new mission."}
                            </p>
                            {!features.auto_missions ? (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={async () => {
                                  await updateFeatures({ auto_missions: true });
                                  runAutoMissionsGenerator();
                                }}
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                <span>Turn on daily auto-missions</span>
                              </Button>
                            ) : (
                              <Button variant="primary" size="sm" onClick={handleOpenAdd}>
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add a mission</span>
                              </Button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* D. Today's Plan (ONE merged chronological timeline of classes, tuition & missions) */}
                      <TodayPlanTimeline
                        schedule={schedule}
                        timeBlocks={timeBlocks}
                        academicEvents={academicEvents}
                        missions={missions}
                        categories={categories}
                        activeMissionId={heroMission?.id}
                        accomplishingMissionId={accomplishingMissionId}
                        onCompleteMission={handleInitiateAccomplish}
                        onOpenTuitionModal={() => setTuitionModal({ isOpen: true })}
                        tuitionExceptions={tuitionExceptions}
                        onUndoTuitionException={undoTuitionException}
                        onOpenTuitionActionModal={(slot) =>
                          setTuitionActionModal({
                            isOpen: true,
                            dateStr: slot?.dateStr || new Date().toISOString().split("T")[0],
                            startTime: slot?.startTime || "18:00",
                            endTime: slot?.endTime || "19:30",
                          })
                        }
                      />
                    </motion.div>

                    {/* Right Column: Today's Briefing & Upcoming Key Dates */}
                    <motion.div variants={dashboardCardVariants} className="space-y-6">
                      <TodayBriefing
                        schedule={schedule}
                        timeBlocks={timeBlocks}
                        academicEvents={academicEvents}
                        missions={missions}
                        onOpenTuitionModal={(slot) =>
                          setTuitionModal({
                            isOpen: true,
                            day: slot?.day,
                            startTime: slot?.startTime,
                            endTime: slot?.endTime,
                          })
                        }
                        tuitionExceptions={tuitionExceptions}
                        onUndoTuitionException={undoTuitionException}
                        onOpenTuitionActionModal={(slot) =>
                          setTuitionActionModal({
                            isOpen: true,
                            dateStr: slot?.dateStr || new Date().toISOString().split("T")[0],
                            startTime: slot?.startTime || "18:00",
                            endTime: slot?.endTime || "19:30",
                          })
                        }
                      />
                      {features.planner && (
                        <UpcomingDatesCard events={academicEvents} onOpenCalendar={() => setActiveTab("planner")} />
                      )}
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

                  {/* Tactical Intelligence Insights Card (at bottom) */}
                  <motion.div variants={dashboardCardVariants}>
                    <InsightsCard
                      missions={missions}
                      lectureLogs={lectureLogs}
                      sideProjects={sideProjects}
                      streak={streak}
                      cfLogs={cfLogs}
                      features={features}
                      onNavigate={(tab) => setActiveTab(tab as typeof activeTab)}
                    />
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
                  features={features}
                  accomplishingMissionId={accomplishingMissionId}
                  onComplete={handleInitiateAccomplish}
                  onEdit={handleOpenEdit}
                  onDelete={handleDelete}
                  onSetActive={setActiveMission}
                  onEditNote={handleOpenEditNote}
                />
              </motion.div>
            )}

            {activeTab === "planner" && (
              <motion.div
                key="planner"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {/* ================= PLANNER TAB ================= */}
                <PlannerView
                  timeBlocks={timeBlocks}
                  academicEvents={academicEvents}
                  missions={missions}
                  categories={categories}
                  courses={courses}
                  structureLoadingError={structureLoadingError}
                  onRetryLoad={retryLoadStructure}
                  onAddTimeBlock={addTimeBlock}
                  onUpdateTimeBlock={updateTimeBlock}
                  onDeleteTimeBlock={deleteTimeBlock}
                  onAddAcademicEvent={addAcademicEvent}
                  onUpdateAcademicEvent={updateAcademicEvent}
                  onDeleteAcademicEvent={deleteAcademicEvent}
                  onScheduleMission={scheduleMissionToBlock}
                  onConfirmAutoSchedule={confirmAutoScheduledMission}
                  onRunAutoSchedule={runAutoScheduler}
                  onCompleteMission={handleInitiateAccomplish}
                  onOpenCourseHQ={(courseId) => {
                    setSelectedCourseId(courseId);
                    setActiveTab("courses");
                  }}
                  onEditMission={handleOpenEdit}
                  onAssignNewMission={handleAssignNewMission}
                  onUpdateTuitionSchedule={updateTuitionSchedule}
                  tuitionExceptions={tuitionExceptions}
                  onUndoTuitionException={undoTuitionException}
                  onEditTuitionSlot={(slot) =>
                    setTuitionActionModal({
                      isOpen: true,
                      dateStr: slot.targetDate || new Date().toISOString().split("T")[0],
                      startTime: slot.startTime,
                      endTime: slot.endTime,
                    })
                  }
                />
              </motion.div>
            )}

            {activeTab === "courses" && (
              <motion.div
                key="courses"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {/* ================= COURSES TAB ================= */}
                <CourseHQView
                  courses={courses}
                  selectedCourseId={selectedCourseId}
                  missions={missions}
                  categories={categories}
                  lectureLogs={lectureLogs}
                  timeBlocks={timeBlocks}
                  academicEvents={academicEvents}
                  onSelectCourse={setSelectedCourseId}
                  onAddLectureLog={addLectureLog}
                  onUpdateLectureLog={updateLectureLog}
                  onDeleteLectureLog={deleteLectureLog}
                  onToggleLectureStudied={toggleLectureStudied}
                  onAddCourseResource={addCourseResource}
                  onDeleteCourseResource={deleteCourseResource}
                  onCompleteMission={handleInitiateAccomplish}
                  onUpdateCourse={updateCourse}
                  onAddMissionForCourse={(course) => {
                    setEditingMission({
                      id: "",
                      title: "",
                      codename: "",
                      category_id: course.category_id || null,
                      course_id: course.id,
                      priority: "medium",
                      status: "active",
                      xp: 50,
                      created_at: new Date().toISOString(),
                    });
                    setIsModalOpen(true);
                  }}
                />
              </motion.div>
            )}

            {activeTab === "codeforces" && (
              <motion.div
                key="codeforces"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {/* ================= CODEFORCES TRACKER TAB ================= */}
                <CodeforcesView
                  logs={cfLogs}
                  onAddLog={addCfLog}
                  onUpdateLog={updateCfLog}
                  onDeleteLog={deleteCfLog}
                  onImportLogs={importCfLogs}
                  onDeduplicateLogs={deduplicateCfLogs}
                  handle={cfHandle}
                  onUpdateHandle={updateCfHandle}
                />
              </motion.div>
            )}

            {activeTab === "cyber" && (
              <motion.div
                key="cyber"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {/* ================= CYBERSECURITY ROADMAP TAB ================= */}
                <CyberRoadmapView
                  topics={cyberTopics}
                  onUpdateTopicStatus={updateCyberTopicStatus}
                  onAddTopic={addCyberTopic}
                />
              </motion.div>
            )}

            {activeTab === "papers" && (
              <motion.div
                key="papers"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {/* ================= RESEARCH PAPERS TAB ================= */}
                <ResearchPapersView
                  papers={researchPapers}
                  onAddPaper={addResearchPaper}
                  onUpdatePaper={updateResearchPaper}
                  onDeletePaper={deleteResearchPaper}
                />
              </motion.div>
            )}

            {activeTab === "projects" && (
              <motion.div
                key="projects"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {/* ================= SIDE PROJECTS TAB ================= */}
                <SideProjectsView
                  projects={sideProjects}
                  onAddProject={addSideProject}
                  onUpdateProject={updateSideProject}
                  onDeleteProject={deleteSideProject}
                  onAddStepMission={(proj) => {
                    setEditingMission({
                      id: "",
                      title: `Side project: ${proj.name} - ${proj.next_step || "Continue next step"}`,
                      codename: `PROJ-${proj.name.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, "X")}`,
                      category_id: "cat-8",
                      priority: "high",
                      status: "active",
                      xp: 60,
                      created_at: new Date().toISOString(),
                    });
                    setIsModalOpen(true);
                  }}
                />
              </motion.div>
            )}

            {activeTab === "review" && (
              <motion.div
                key="review"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {/* ================= PROGRESS & WEEKLY REVIEW TAB ================= */}
                <ProgressReviewView
                  missions={missions}
                  categories={categories}
                  totalXp={totalXp}
                  streak={streak}
                  lectureLogs={lectureLogs}
                  cfLogs={cfLogs}
                  researchPapers={researchPapers}
                  sideProjects={sideProjects}
                  weeklyReviews={weeklyReviews}
                  onSaveWeeklyReview={saveWeeklyReview}
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
                  academicEvents={academicEvents}
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
          features={features}
          editingMission={editingMission}
          timeBlocks={timeBlocks}
          academicEvents={academicEvents}
          existingMissions={missions}
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

        {/* Codeforces quick-log prompt after CP mission accomplishment */}
        <CodeforcesLogModal
          isOpen={isCpMissionLogOpen}
          onClose={() => setIsCpMissionLogOpen(false)}
          onSave={addCfLog}
          isTriggeredByMission={true}
        />

        {/* Research Paper quick-log prompt after paper mission accomplishment */}
        <PaperSummaryModal
          isOpen={isPaperMissionModalOpen}
          onClose={() => setIsPaperMissionModalOpen(false)}
          onSave={addResearchPaper}
          isTriggeredByMission={true}
        />

        {/* Per-session Tuition Action Menu (Move session, Cancel session, Edit weekly schedule) */}
        <TuitionActionModal
          isOpen={tuitionActionModal.isOpen}
          dateStr={tuitionActionModal.dateStr}
          startTime={tuitionActionModal.startTime}
          endTime={tuitionActionModal.endTime}
          slotId={tuitionActionModal.slotId}
          onMoveSession={moveTuitionSession}
          onCancelSession={cancelTuitionSession}
          onOpenWeeklySchedule={() => {
            setTuitionActionModal((prev) => ({ ...prev, isOpen: false }));
            setTuitionModal({
              isOpen: true,
              startTime: tuitionActionModal.startTime,
              endTime: tuitionActionModal.endTime,
            });
          }}
          onClose={() => setTuitionActionModal((prev) => ({ ...prev, isOpen: false }))}
        />

        {/* Global Tuition Teaching Routine Configuration Modal */}
        <TuitionScheduleModal
          isOpen={tuitionModal.isOpen}
          initialDays={tuitionModal.day ? [tuitionModal.day] : ["MON", "THU", "FRI"]}
          initialStartTime={tuitionModal.startTime || "18:00"}
          initialEndTime={tuitionModal.endTime || "19:30"}
          targetDate={tuitionModal.targetDate}
          targetDay={tuitionModal.day}
          onSave={updateTuitionSchedule}
          onClose={() => setTuitionModal({ isOpen: false })}
        />

        {/* Global In-App Notifications Toast */}
        <NotificationToast alerts={dueNotifications} />

        {/* Global Error Alert Toasts */}
        <ErrorToastContainer toasts={errorToasts} onDismiss={dismissErrorToast} />
      </div>
  );
}
