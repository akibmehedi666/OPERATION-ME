"use client";

import React from "react";
import { usePwa } from "@/lib/pwaContext";
import { RefreshCw, X, Sparkles, WifiOff } from "lucide-react";

export const PwaUpdateToast: React.FC = () => {
  const { updateAvailable, reloadApp, dismissUpdate, isOnline } = usePwa();

  return (
    <>
      {!isOnline && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-0 inset-x-0 z-50 py-1.5 px-3 bg-amber-500/90 text-black text-center font-mono text-[11px] font-bold flex items-center justify-center gap-2 shadow-md backdrop-blur-xs"
          style={{ paddingTop: "max(0.375rem, env(safe-area-inset-top, 0px))" }}
        >
          <WifiOff className="w-3.5 h-3.5" />
          <span>TACTICAL LINK SEVERED • Offline mode active (writes blocked)</span>
        </div>
      )}

      {updateAvailable && (
        <div
          role="alert"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md p-3.5 rounded-[4px] bg-spy-surface border border-spy-green/60 text-spy-text shadow-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200"
          style={{
            bottom: "max(1.5rem, calc(env(safe-area-inset-bottom, 0px) + 1rem))",
          }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-[3px] bg-spy-green/15 text-spy-green shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-mono font-bold text-spy-text flex items-center gap-1.5">
                <span>UPDATE AVAILABLE</span>
                <span className="w-1.5 h-1.5 rounded-full bg-spy-green animate-pulse" />
              </div>
              <div className="text-[11px] text-spy-muted font-sans truncate">
                New tactical deployment is ready.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={reloadApp}
              className="px-3 py-1.5 rounded-[3px] bg-spy-green text-black hover:bg-spy-green/90 font-mono font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reload</span>
            </button>
            <button
              type="button"
              onClick={dismissUpdate}
              className="p-1 text-spy-muted hover:text-spy-text transition-colors rounded-[2px] cursor-pointer"
              title="Dismiss update notice"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
