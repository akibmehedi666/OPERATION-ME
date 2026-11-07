"use client";

import React from "react";
import { AlertTriangle, X } from "lucide-react";

export interface ErrorToastItem {
  id: string;
  title: string;
  message: string;
  timestamp: number;
}

interface ErrorToastContainerProps {
  toasts: ErrorToastItem[];
  onDismiss: (id: string) => void;
}

export const ErrorToastContainer: React.FC<ErrorToastContainerProps> = ({
  toasts,
  onDismiss,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="alert"
          className="pointer-events-auto p-3.5 rounded-[4px] border border-spy-red bg-[#200e0a] text-spy-red shadow-2xl flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-spy-red" />
          <div className="flex-1 min-w-0 space-y-0.5">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-spy-red">
              {toast.title}
            </div>
            <p className="text-xs font-sans text-[#fca5a5] leading-relaxed break-words">
              {toast.message}
            </p>
          </div>
          <button
            onClick={() => onDismiss(toast.id)}
            className="p-1 text-spy-muted hover:text-spy-red transition-colors rounded-[3px]"
            title="Dismiss error"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};

