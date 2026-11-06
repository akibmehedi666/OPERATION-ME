"use client";

import React, { useState } from "react";
import { CloudUpload, CheckCircle, Trash2, ShieldCheck, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  LocalDataSummary,
  MigrationResult,
  migrateLocalDataToSupabase,
  clearMigratedLocalData,
} from "@/lib/cloudMigration";
import { createClient } from "@/lib/supabase/client";

interface CloudMigrationBannerProps {
  summary: LocalDataSummary;
  userId: string;
  onMigrationComplete: () => Promise<void>;
  onDismiss: () => void;
}

export const CloudMigrationBanner: React.FC<CloudMigrationBannerProps> = ({
  summary,
  userId,
  onMigrationComplete,
  onDismiss,
}) => {
  const [status, setStatus] = useState<"prompt" | "migrating" | "done">("prompt");
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [localDataCleared, setLocalDataCleared] = useState(false);

  const handleStartMigration = async () => {
    setStatus("migrating");
    const supabase = createClient();
    if (!supabase) {
      setStatus("prompt");
      return;
    }

    const res = await migrateLocalDataToSupabase(supabase, userId);
    setResult(res);
    setStatus("done");
    await onMigrationComplete();
  };

  const handleClearLocalData = () => {
    clearMigratedLocalData(userId);
    setLocalDataCleared(true);
  };

  if (!summary.hasData) return null;

  return (
    <div className="mb-6 p-4 rounded-[6px] border border-spy-green/40 bg-gradient-to-r from-spy-surface to-spy-surface2 shadow-md font-mono text-xs text-spy-text relative">
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 text-spy-muted hover:text-spy-text"
        title="Dismiss migration notice"
      >
        <X className="w-4 h-4" />
      </button>

      {status === "prompt" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-[4px] bg-spy-green/15 text-spy-green border border-spy-green/30">
              <CloudUpload className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold uppercase tracking-wider text-spy-green block">
                Local Device Data Detected
              </span>
              <span className="text-[11px] text-spy-muted font-sans block">
                You are authenticated with Supabase. We found {summary.totalItems} records ({summary.missionCount} missions, {summary.courseCount} courses, {summary.projectCount} projects) saved locally on this browser.
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button
              variant="primary"
              size="sm"
              onClick={handleStartMigration}
              className="flex items-center gap-1.5"
            >
              <CloudUpload className="w-3.5 h-3.5" />
              <span>Import local data to cloud</span>
            </Button>
            <Button
              variant="stealth"
              size="sm"
              onClick={onDismiss}
            >
              Keep local only / Dismiss
            </Button>
          </div>
        </div>
      )}

      {status === "migrating" && (
        <div className="flex items-center gap-3 py-2 text-spy-green">
          <div className="w-4 h-4 border-2 border-spy-green border-t-transparent rounded-full animate-spin" />
          <span>Syncing local operational data to Supabase cloud account...</span>
        </div>
      )}

      {status === "done" && (
        <div className="space-y-3">
          <div className="flex items-start gap-2.5">
            <CheckCircle className="w-5 h-5 text-spy-green shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-spy-green">
                Cloud Migration Complete
              </div>
              <p className="text-[11px] text-spy-text font-sans mt-0.5">
                Successfully uploaded {result?.importedCount || 0} records to your cloud database.
                {result?.skippedCount ? ` (${result.skippedCount} duplicate items were safely skipped).` : ""}
              </p>
            </div>
          </div>

          {!localDataCleared ? (
            <div className="p-3 rounded-[4px] bg-spy-surface border border-spy-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="font-bold text-spy-text block">Local Data Cleanup</span>
                <span className="text-[10px] text-spy-muted font-sans block">
                  Data is safely stored in Supabase. Would you like to clear this browser&apos;s localStorage copy?
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleClearLocalData}
                  className="flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete local data</span>
                </Button>
                <Button
                  variant="stealth"
                  size="sm"
                  onClick={onDismiss}
                >
                  Keep local backup
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between text-spy-green text-[11px] pt-1">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Local storage cleaned. Operating fully from Supabase Cloud.</span>
              </span>
              <Button variant="stealth" size="sm" onClick={onDismiss}>
                <span>Done</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

