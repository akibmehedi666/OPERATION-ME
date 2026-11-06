"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  FolderGit2,
  ExternalLink,
  Plus,
  Search,
  Clock,
  Edit3,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Terminal,
  Play,
} from "lucide-react";
import { SideProject } from "@/types/database";
import { Button } from "@/components/ui/Button";
import { ProjectModal } from "./ProjectModal";

interface SideProjectsViewProps {
  projects: SideProject[];
  onAddProject: (project: Omit<SideProject, "id">) => void;
  onUpdateProject: (project: SideProject) => void;
  onDeleteProject: (id: string) => void;
  onAddStepMission?: (project: SideProject) => void;
}

export const SideProjectsView: React.FC<SideProjectsViewProps> = ({
  projects,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  onAddStepMission,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "paused" | "completed">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<SideProject | null>(null);

  // Quick edit next step inline modal/state
  const [quickLogProjectId, setQuickLogProjectId] = useState<string | null>(null);
  const [quickNextStepText, setQuickNextStepText] = useState("");

  // Helpers for inactivity math
  const getDaysInactive = useCallback((lastWorkedAt?: string | null): number => {
    if (!lastWorkedAt) return 999;
    const diffMs = Date.now() - new Date(lastWorkedAt).getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }, []);

  const isInactive7Days = useCallback((project: SideProject): boolean => {
    if (project.status === "completed") return false;
    return getDaysInactive(project.last_worked_at) >= 7;
  }, [getDaysInactive]);

  const formatLastWorked = (lastWorkedAt?: string | null): string => {
    if (!lastWorkedAt) return "No activity recorded";
    const days = getDaysInactive(lastWorkedAt);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  };

  // Metrics
  const activeCount = useMemo(() => projects.filter((p) => p.status === "active").length, [projects]);
  const completedCount = useMemo(() => projects.filter((p) => p.status === "completed").length, [projects]);
  const inactiveAlertCount = useMemo(
    () => projects.filter((p) => isInactive7Days(p)).length,
    [projects, isInactive7Days]
  );

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects
      .filter((p) => {
        if (statusFilter !== "all" && p.status !== statusFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = p.name.toLowerCase().includes(q);
          const matchDesc = (p.description || "").toLowerCase().includes(q);
          const matchStep = (p.next_step || "").toLowerCase().includes(q);
          if (!matchName && !matchDesc && !matchStep) return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Priority: Active inactive >= 7 days first (needs attention!), then active, then paused, then completed
        const aInactive = isInactive7Days(a);
        const bInactive = isInactive7Days(b);
        if (aInactive && !bInactive) return -1;
        if (!aInactive && bInactive) return 1;

        if (a.status === "active" && b.status !== "active") return -1;
        if (b.status === "active" && a.status !== "active") return 1;

        const dateA = a.last_worked_at ? new Date(a.last_worked_at).getTime() : 0;
        const dateB = b.last_worked_at ? new Date(b.last_worked_at).getTime() : 0;
        return dateB - dateA;
      });
  }, [projects, statusFilter, searchQuery, isInactive7Days]);

  const handleOpenAdd = () => {
    setEditingProject(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (project: SideProject) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };

  const handleQuickLogSave = (project: SideProject) => {
    onUpdateProject({
      ...project,
      last_worked_at: new Date().toISOString(),
      next_step: quickNextStepText.trim() ? quickNextStepText.trim() : project.next_step,
    });
    setQuickLogProjectId(null);
    setQuickNextStepText("");
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP METRICS ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Projects */}
        <div className="clean-card p-3.5 sm:p-4 bg-spy-surface border-spy-border flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs font-mono uppercase tracking-wider text-spy-muted">
              Total R&D
            </div>
            <div className="text-lg sm:text-xl font-mono font-bold text-spy-text">
              {projects.length} <span className="text-xs font-sans font-normal text-spy-dim">projects</span>
            </div>
          </div>
          <div className="p-2 rounded-[4px] bg-spy-surface2 border border-spy-border text-spy-dim">
            <FolderGit2 className="w-5 h-5" />
          </div>
        </div>

        {/* Active Projects */}
        <div className="clean-card p-3.5 sm:p-4 bg-[#dcf3e4] border-[#b2e5c3] dark:bg-spy-surface dark:border-spy-border flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs font-mono uppercase tracking-wider text-[#14663a] dark:text-spy-muted">
              Active Build
            </div>
            <div className="text-lg sm:text-xl font-mono font-bold text-[#14663a] dark:text-spy-green">
              {activeCount} <span className="text-xs font-sans font-normal opacity-80">building</span>
            </div>
          </div>
          <div className="p-2 rounded-[4px] bg-[#c5e9d0] border border-[#a4dab3] text-[#14663a] dark:bg-spy-surface2 dark:border-spy-border dark:text-spy-green">
            <Play className="w-5 h-5" />
          </div>
        </div>

        {/* Momentum Alerts (>= 7 days inactive) */}
        <div className={`clean-card p-3.5 sm:p-4 flex items-center justify-between ${
          inactiveAlertCount > 0
            ? "bg-[#fbefd5] border-[#f4dcaa] dark:bg-spy-surface dark:border-spy-amber/60"
            : "bg-spy-surface border-spy-border"
        }`}>
          <div className="space-y-1">
            <div className="text-xs font-mono uppercase tracking-wider text-[#9a5b00] dark:text-spy-amber">
              Momentum Risk
            </div>
            <div className="text-lg sm:text-xl font-mono font-bold text-[#9a5b00] dark:text-spy-amber">
              {inactiveAlertCount} <span className="text-xs font-sans font-normal opacity-80">stalled</span>
            </div>
          </div>
          <div className="p-2 rounded-[4px] bg-[#f8e3ba] border border-[#f1cd85] text-[#9a5b00] dark:bg-spy-surface2 dark:border-spy-amber dark:text-spy-amber">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Completed Deployments */}
        <div className="clean-card p-3.5 sm:p-4 bg-[#f0e6fa] border-[#ded0f7] dark:bg-spy-surface dark:border-spy-border flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs font-mono uppercase tracking-wider text-[#6b2fa0] dark:text-spy-muted">
              Shipped
            </div>
            <div className="text-lg sm:text-xl font-mono font-bold text-[#6b2fa0] dark:text-purple-400">
              {completedCount} <span className="text-xs font-sans font-normal opacity-80">deployed</span>
            </div>
          </div>
          <div className="p-2 rounded-[4px] bg-[#e3d1f8] border border-[#cbb0f2] text-[#6b2fa0] dark:bg-spy-surface2 dark:border-spy-border dark:text-purple-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. MOMENTUM WARNING BANNER (If any active/paused project is inactive >= 7 days) */}
      {inactiveAlertCount > 0 && (
        <div className="p-3.5 sm:p-4 rounded-[4px] border border-spy-amber/60 bg-[#fbefd5] text-[#9a5b00] dark:bg-spy-amber/10 dark:text-spy-amber flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="text-xs font-mono font-bold tracking-wider uppercase">
              MOMENTUM ALERT: {inactiveAlertCount} PROJECT{inactiveAlertCount > 1 ? "S" : ""} INACTIVE FOR 7+ DAYS
            </div>
            <p className="text-xs font-sans text-spy-muted leading-relaxed">
              Long pauses erode cognitive context. Pick the top stalled project below, click{" "}
              <span className="font-mono font-bold">+ Step Mission</span>, and execute a 15-minute micro-step to resume velocity!
            </p>
          </div>
        </div>
      )}

      {/* 3. FILTERS & SEARCH BAR */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 flex-wrap sm:flex-nowrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-spy-dim" />
              <input
                type="text"
                placeholder="Search projects by name, scope, or next step..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-spy-surface2 border border-spy-border rounded-[3px] pl-8 pr-3 py-1.5 text-xs text-spy-text focus:outline-none focus:border-spy-green"
              />
            </div>
            <div className="flex items-center border border-spy-border rounded-[3px] overflow-hidden text-xs font-mono bg-spy-surface2 shrink-0">
              {(["all", "active", "paused", "completed"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 uppercase tracking-wider transition-colors ${
                    statusFilter === st
                      ? "bg-spy-surface text-spy-text font-bold border-b-2 border-spy-green"
                      : "text-spy-muted hover:text-spy-text"
                  }`}
                >
                  {st === "all" ? "All" : st === "active" ? "Active" : st === "paused" ? "Paused" : "Shipped"}
                </button>
              ))}
            </div>
          </div>

          <Button variant="primary" size="sm" onClick={handleOpenAdd}>
            <Plus className="w-3.5 h-3.5" />
            <span>New Project</span>
          </Button>
        </div>
      </div>

      {/* 4. PROJECTS LIST */}
      <div className="space-y-4">
        {filteredProjects.length === 0 ? (
          <div className="clean-card p-12 text-center bg-spy-surface border-spy-border space-y-3">
            <div className="inline-flex p-3 rounded-full bg-spy-surface2 border border-spy-border text-spy-dim">
              <FolderGit2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-mono font-medium text-spy-text">
                No side projects located matching current directive
              </p>
              <p className="text-xs text-spy-muted font-sans">
                Initialize an engineering repo, create an xv6 kernel experiment, or track an architectural build.
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={handleOpenAdd}>
              <Plus className="w-3.5 h-3.5" />
              <span>Register First Project</span>
            </Button>
          </div>
        ) : (
          filteredProjects.map((project) => {
            const inactive = isInactive7Days(project);
            const isQuickLogging = quickLogProjectId === project.id;

            return (
              <div
                key={project.id}
                className={`clean-card p-4 sm:p-5 bg-spy-surface border-spy-border transition-all space-y-3.5 relative overflow-hidden ${
                  inactive ? "border-l-4 border-l-spy-amber" : "border-l-4 border-l-spy-green"
                }`}
              >
                {/* Header: Status, Title, Inactivity warning pill */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span
                      className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-[2px] border ${
                        project.status === "active"
                          ? "bg-[#dcf3e4] text-[#14663a] border-[#b2e5c3] dark:bg-spy-green/10 dark:text-spy-green dark:border-spy-green/30"
                          : project.status === "paused"
                          ? "bg-[#fbefd5] text-[#9a5b00] border-[#f4dcaa] dark:bg-spy-amber/10 dark:text-spy-amber dark:border-spy-amber/30"
                          : "bg-[#f0e6fa] text-[#6b2fa0] border-[#ded0f7] dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800"
                      }`}
                    >
                      {project.status === "active" ? "Active Momentum" : project.status === "paused" ? "Paused" : "Completed / Deployed"}
                    </span>

                    <h3 className="text-sm sm:text-base font-mono font-bold text-spy-text tracking-wide">
                      {project.name}
                    </h3>

                    {/* 7+ days inactive badge */}
                    {inactive && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-[2px] bg-[#fbefd5] text-[#9a5b00] border border-[#f1cd85] dark:bg-spy-amber/20 dark:text-spy-amber dark:border-spy-amber/40 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>7+ DAYS INACTIVE — REQUIRES MOMENTUM</span>
                      </span>
                    )}
                  </div>

                  {/* Actions & Repos */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                    {project.repo_url && (
                      <a
                        href={project.repo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-[3px] text-spy-muted hover:text-spy-text bg-spy-surface2 border border-spy-border transition-colors"
                        title="Open Repository"
                      >
                        <FolderGit2 className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {project.live_url && (
                      <a
                        href={project.live_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-[3px] text-spy-muted hover:text-spy-text bg-spy-surface2 border border-spy-border transition-colors"
                        title="Open Live Deployment"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => handleOpenEdit(project)}
                      className="p-1.5 rounded-[3px] text-spy-muted hover:text-spy-text bg-spy-surface2 border border-spy-border transition-colors"
                      title="Edit project"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete project "${project.name}"?`)) {
                          onDeleteProject(project.id);
                        }
                      }}
                      className="p-1.5 rounded-[3px] text-spy-muted hover:text-spy-red bg-spy-surface2 border border-spy-border transition-colors"
                      title="Delete project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Description */}
                {project.description && (
                  <p className="text-xs text-spy-muted font-sans leading-relaxed">
                    {project.description}
                  </p>
                )}

                {/* Next Tactical Step Card */}
                {project.next_step && (
                  <div className="p-3 rounded-[4px] bg-[#fbefd5]/60 border border-[#f4dcaa] dark:bg-spy-surface2 dark:border-spy-border space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#9a5b00] dark:text-spy-amber font-bold uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5" />
                        <span>Next Tactical Directive</span>
                      </span>
                      <span className="text-[10px] font-normal text-spy-muted lowercase">
                        last worked {formatLastWorked(project.last_worked_at)}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-spy-text font-medium pl-5 border-l-2 border-spy-amber/60">
                      {project.next_step}
                    </div>
                  </div>
                )}

                {/* Quick Log Inline Form */}
                {isQuickLogging && (
                  <div className="p-3 rounded-[3px] bg-spy-surface2 border border-spy-green/50 space-y-2">
                    <div className="text-[11px] font-mono text-spy-green font-bold uppercase">
                      Log Work Session & Update Next Step
                    </div>
                    <input
                      type="text"
                      placeholder="What is your immediate next step now?"
                      defaultValue={project.next_step || ""}
                      onChange={(e) => setQuickNextStepText(e.target.value)}
                      className="w-full bg-spy-surface border border-spy-border rounded-[3px] px-2.5 py-1.5 text-xs text-spy-text font-mono focus:outline-none focus:border-spy-green"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="stealth"
                        size="sm"
                        onClick={() => {
                          setQuickLogProjectId(null);
                          setQuickNextStepText("");
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleQuickLogSave(project)}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Save & Record Momentum</span>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Footer Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-spy-border text-[11px] font-mono text-spy-muted">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-spy-dim" />
                    <span>Last session: {formatLastWorked(project.last_worked_at)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Log Work Session Button */}
                    <button
                      onClick={() => {
                        setQuickLogProjectId(isQuickLogging ? null : project.id);
                        setQuickNextStepText(project.next_step || "");
                      }}
                      className="px-2.5 py-1 rounded-[3px] bg-spy-surface2 border border-spy-border text-spy-text hover:border-spy-green transition-colors flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3 h-3 text-spy-green" />
                      <span>Log Session</span>
                    </button>

                    {/* Step Mission Action */}
                    {onAddStepMission && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onAddStepMission(project)}
                      >
                        <Terminal className="w-3 h-3 text-spy-amber" />
                        <span>+ Step Mission</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Project Modal */}
      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={(projData) => {
          if (editingProject) {
            onUpdateProject({ ...editingProject, ...projData } as SideProject);
          } else {
            onAddProject(projData as Omit<SideProject, "id">);
          }
        }}
        editingProject={editingProject}
      />
    </div>
  );
};
