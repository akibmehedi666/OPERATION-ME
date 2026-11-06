"use client";

import React, { useState, useEffect } from "react";
import { X, FolderGit2, Globe, Sparkles, Terminal } from "lucide-react";
import { SideProject } from "@/types/database";
import { Button } from "@/components/ui/Button";

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Partial<SideProject>) => void;
  editingProject?: SideProject | null;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingProject,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"active" | "paused" | "completed">("active");
  const [nextStep, setNextStep] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [liveUrl, setLiveUrl] = useState("");

  useEffect(() => {
    if (editingProject) {
      setName(editingProject.name || "");
      setDescription(editingProject.description || "");
      setStatus(editingProject.status || "active");
      setNextStep(editingProject.next_step || "");
      setRepoUrl(editingProject.repo_url || "");
      setLiveUrl(editingProject.live_url || "");
    } else {
      setName("");
      setDescription("");
      setStatus("active");
      setNextStep("");
      setRepoUrl("");
      setLiveUrl("");
    }
  }, [editingProject, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      ...(editingProject ? { id: editingProject.id } : {}),
      name: name.trim(),
      description: description.trim(),
      status,
      next_step: nextStep.trim(),
      repo_url: repoUrl.trim() || undefined,
      live_url: liveUrl.trim() || undefined,
      last_worked_at: editingProject?.last_worked_at || new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]">
      <div className="relative w-full max-w-lg clean-card bg-spy-surface border-spy-border shadow-2xl p-5 sm:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-spy-border pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-[4px] bg-[#dcf3e4] border border-[#a4dab3] text-[#14663a] dark:bg-spy-surface2 dark:border-spy-border dark:text-spy-green">
              <FolderGit2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-mono font-bold tracking-wider text-spy-text uppercase">
                {editingProject ? "EDIT SIDE PROJECT DOSSIER" : "REGISTER NEW SIDE PROJECT"}
              </h2>
              <p className="text-[11px] font-sans text-spy-muted">
                Track architectural engineering, deployment links, and momentum
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-spy-muted hover:text-spy-text hover:bg-spy-surface2 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
          {/* Project Name */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-spy-muted uppercase">
              Project Codename / Name <span className="text-spy-red">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. OPERATION: ME or Distributed Raft KV"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-spy-surface2 border border-spy-border rounded-[3px] px-3 py-2 text-spy-text focus:outline-none focus:border-spy-green font-mono"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-spy-muted uppercase">
              Mission Directive / Scope
            </label>
            <textarea
              rows={2}
              placeholder="Brief summary of engineering purpose and architecture..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-spy-surface2 border border-spy-border rounded-[3px] px-3 py-2 text-spy-text focus:outline-none focus:border-spy-green resize-none"
            />
          </div>

          {/* Next Step / Tactical Directive */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-spy-amber flex items-center gap-1.5 uppercase font-bold">
              <Terminal className="w-3.5 h-3.5" />
              <span>Next Immediate Tactical Step</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Implement copy-on-write page fault handler in xv6"
              value={nextStep}
              onChange={(e) => setNextStep(e.target.value)}
              className="w-full bg-spy-surface2 border border-spy-amber/60 rounded-[3px] px-3 py-2 text-spy-text focus:outline-none focus:border-spy-amber font-mono"
            />
            <p className="text-[10px] text-spy-muted">
              Always keep a specific, executable step ready so you can resume flow without hesitation.
            </p>
          </div>

          {/* Status Selection */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-spy-muted uppercase">
              Operational Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: "active", label: "Active Momentum", color: "text-[#14663a] dark:text-spy-green" },
                  { id: "paused", label: "Tactical Pause", color: "text-[#9a5b00] dark:text-spy-amber" },
                  { id: "completed", label: "Mission Deployed", color: "text-[#6b2fa0] dark:text-purple-400" },
                ] as const
              ).map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => setStatus(s.id)}
                  className={`py-2 px-2 text-center rounded-[3px] border font-mono text-[11px] transition-colors ${
                    status === s.id
                      ? "bg-spy-surface2 border-spy-text font-bold " + s.color
                      : "border-spy-border text-spy-muted hover:text-spy-text bg-spy-surface"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Repo & Live URLs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-spy-muted flex items-center gap-1 uppercase">
                <FolderGit2 className="w-3 h-3 text-spy-dim" />
                <span>Repository URL</span>
              </label>
              <input
                type="url"
                placeholder="https://github.com/..."
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="w-full bg-spy-surface2 border border-spy-border rounded-[3px] px-2.5 py-1.5 text-spy-text focus:outline-none focus:border-spy-green font-mono text-[11px]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono text-spy-muted flex items-center gap-1 uppercase">
                <Globe className="w-3 h-3 text-spy-dim" />
                <span>Live Demo / App URL</span>
              </label>
              <input
                type="url"
                placeholder="https://myapp.vercel.app"
                value={liveUrl}
                onChange={(e) => setLiveUrl(e.target.value)}
                className="w-full bg-spy-surface2 border border-spy-border rounded-[3px] px-2.5 py-1.5 text-spy-text focus:outline-none focus:border-spy-green font-mono text-[11px]"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-spy-border">
            <Button variant="stealth" size="sm" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{editingProject ? "Update Project" : "Initialize Project"}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
