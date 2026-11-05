"use client";

import React, { useState } from "react";
import { 
  Crosshair, 
  Plus, 
  Radio, 
  Zap
} from "lucide-react";
import { useAgencyState } from "@/lib/useAgencyState";
import { LoginPage } from "@/components/auth/LoginPage";
import { AgentHeader } from "@/components/dashboard/AgentHeader";
import { TodayBriefing } from "@/components/dashboard/TodayBriefing";
import { TodayChecklist } from "@/components/dashboard/TodayChecklist";
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

  // Handle Mission Completion with Flow Animation
  const handleComplete = async (mission: Mission) => {
    soundFX.playBlip();
    const result = await completeMission(mission);
    setCelebrationData({
      completed: result.completedMission,
      next: result.nextMission,
      isOpen: true,
    });
  };

  // Open Add modal
  const handleOpenAdd = () => {
    soundFX.playBlip();
    setEditingMission(null);
    setIsModalOpen(true);
  };

  // Open Edit modal
  const handleOpenEdit = (mission: Mission) => {
    soundFX.playBlip();
    setEditingMission(mission);
    setIsModalOpen(true);
  };

  // Handle Delete with confirmation
  const handleDelete = (mission: Mission) => {
    soundFX.playWarning();
    const confirmed = window.confirm(
      `ABORT MISSION: [${mission.codename}] "${mission.title}"?\nThis directive will be expunged from agency records.`
    );
    if (confirmed) {
      deleteMission(mission.id);
    }
  };

  // Handle Save
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
      <div className="min-h-screen flex items-center justify-center bg-spy-bg font-mono text-spy-green">
        <div className="flex flex-col items-center gap-3">
          <Radio className="w-8 h-8 animate-spin" />
          <div className="text-xs tracking-widest uppercase">INITIALIZING CLASSIFIED LINK...</div>
        </div>
      </div>
    );
  }

  // If not authenticated, show themed spy login
  if (!isAuthenticated) {
    return (
      <LoginPage
        onLogin={login}
        onGuestBypass={guestBypass}
        isSupabaseConnected={isSupabaseConnected}
      />
    );
  }

  // Find the primary active mission for the big hero card
  // Sort active missions by priority (urgent > high > medium > low)
  const activeMissions = missions.filter((m) => m.status === "active");
  const heroMission = activeMissions.length > 0 ? activeMissions[0] : null;
  const heroCategory = heroMission
    ? categories.find((c) => c.id === heroMission.category_id)
    : undefined;

  return (
    <div className="min-h-screen bg-spy-bg text-spy-text font-mono tactical-grid pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        {/* Global Agent Akib Header */}
        <AgentHeader
          agentName="Agent Akib"
          totalXp={totalXp}
          streak={streak}
          onQuickAdd={handleOpenAdd}
          onLogout={logout}
        />

        {/* Dashboard Main Grid: Active Target & Daily Recon Briefing */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* Left Column: ACTIVE MISSION Hero Card & Quick Checklist */}
          <div className="lg:col-span-7 space-y-6">
            {/* The Active Mission Card */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-spy-green">
                  <Crosshair className="w-4 h-4 text-spy-green animate-spin" />
                  <span>PRIMARY DIRECTIVE // ACTIVE TARGET</span>
                </div>
                {activeMissions.length > 1 && (
                  <span className="text-[10px] text-spy-dim bg-slate-900 border border-slate-800 px-2 py-0.5">
                    +{activeMissions.length - 1} OTHER ACTIVE TARGETS
                  </span>
                )}
              </div>

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
                <div className="p-8 sm:p-12 text-center bg-spy-surface border-2 border-dashed border-spy-border tactical-card">
                  <Zap className="w-10 h-10 text-spy-green mx-auto mb-3 opacity-60" />
                  <h3 className="text-base font-bold text-white uppercase tracking-wider mb-1">
                    NO ACTIVE TARGET ACQUIRED
                  </h3>
                  <p className="text-xs text-spy-dim max-w-sm mx-auto mb-4">
                    All primary directives executed. Select a mission from the queue or authorize a new directive.
                  </p>
                  <Button variant="primary" size="sm" onClick={handleOpenAdd}>
                    <Plus className="w-4 h-4" />
                    <span>AUTHORIZE NEW MISSION</span>
                  </Button>
                </div>
              )}
            </div>

            {/* Today's Checklist */}
            <TodayChecklist
              missions={missions}
              categories={categories}
              onToggleComplete={(m) => {
                if (m.status === "completed") {
                  // Mark back to active
                  setActiveMission(m);
                } else {
                  handleComplete(m);
                }
              }}
            />
          </div>

          {/* Right Column: Today's Briefing (Classes + Tuition + Countdown) */}
          <div className="lg:col-span-5">
            <TodayBriefing schedule={schedule} />
          </div>
        </div>

        {/* Full Tactical Mission Queue Dossier */}
        <section className="mt-10">
          <MissionQueue
            missions={missions}
            categories={categories}
            onComplete={handleComplete}
            onEdit={handleOpenEdit}
            onDelete={handleDelete}
            onSetActive={setActiveMission}
          />
        </section>
      </div>

      {/* Floating Quick-Add Action Button (Always Accessible on Mobile + Desktop) */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-3 bg-spy-green text-black font-mono font-bold text-xs sm:text-sm tracking-wider uppercase border-2 border-spy-green shadow-[0_0_20px_rgba(0,255,102,0.5)] hover:bg-[#00e65c] hover:scale-105 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>NEW MISSION</span>
        </button>
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
