"use client";

import React, { useState } from "react";
import { NotificationSettings } from "@/types/database";

interface RemindersSettingsProps {
  settings: NotificationSettings;
  onUpdateSettings: (settings: NotificationSettings) => void;
}

export const RemindersSettings: React.FC<RemindersSettingsProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "default"
  );
  const [testSent, setTestSent] = useState(false);

  const requestPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const perm = await Notification.requestPermission();
        setPermissionStatus(perm);
      } catch (e) {
        console.error("Notification permission error:", e);
      }
    }
  };

  const sendTestNotification = () => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      new Notification("OPERATION: ME // TACTICAL ALERT", {
        body: "Operative Akib: Reminder test broadcast successful. Systems operational.",
        icon: "/favicon.ico",
      });
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    }
  };

  const toggle = (key: keyof NotificationSettings) => {
    onUpdateSettings({
      ...settings,
      [key]: !settings[key],
    });
  };

  return (
    <div className="space-y-4 text-xs font-sans">
      {/* Top Banner */}
      <div className="flex items-center justify-between pb-2 border-b border-spy-border">
        <div>
          <div className="text-spy-text font-bold text-xs font-mono">INTELLIGENCE REMINDERS</div>
          <div className="text-[10px] text-spy-dim font-sans mt-0.5">
            Browser push & in-app alerts for schedules, deadlines, and streak defense.
          </div>
        </div>
        {permissionStatus !== "granted" ? (
          <button
            type="button"
            onClick={requestPermission}
            className="px-2.5 py-1 text-[10px] font-mono font-bold rounded-[3px] bg-spy-green text-black hover:bg-spy-green/90 transition-colors"
          >
            Enable Push
          </button>
        ) : (
          <button
            type="button"
            onClick={sendTestNotification}
            className="px-2 py-0.5 text-[10px] font-mono rounded-[3px] border border-spy-border hover:border-spy-green text-spy-green transition-colors"
          >
            {testSent ? "Alert Sent!" : "Test Alert"}
          </button>
        )}
      </div>

      {/* Reminder Toggles */}
      <div className="space-y-2">
        {/* Next Class: 15 min before */}
        <div className="flex items-center justify-between py-2 border-b border-spy-border">
          <div>
            <div className="font-medium text-spy-text">Next University Class</div>
            <div className="text-[10px] text-spy-dim font-mono">15 minutes before scheduled start</div>
          </div>
          <button
            type="button"
            onClick={() => toggle("class_reminder")}
            className={`px-2.5 py-0.5 font-mono text-[10px] font-bold rounded-[3px] border transition-colors ${
              settings.class_reminder
                ? "bg-spy-green/20 text-spy-green border-spy-green/50"
                : "bg-spy-surface2 text-spy-dim border-spy-border"
            }`}
          >
            {settings.class_reminder ? "ON" : "OFF"}
          </button>
        </div>

        {/* Tuition: 1 hour before */}
        <div className="flex items-center justify-between py-2 border-b border-spy-border">
          <div>
            <div className="font-medium text-spy-text">Tuition Session Alert</div>
            <div className="text-[10px] text-spy-dim font-mono">1 hour before slot (travel & prep buffer)</div>
          </div>
          <button
            type="button"
            onClick={() => toggle("tuition_reminder")}
            className={`px-2.5 py-0.5 font-mono text-[10px] font-bold rounded-[3px] border transition-colors ${
              settings.tuition_reminder
                ? "bg-spy-green/20 text-spy-green border-spy-green/50"
                : "bg-spy-surface2 text-spy-dim border-spy-border"
            }`}
          >
            {settings.tuition_reminder ? "ON" : "OFF"}
          </button>
        </div>

        {/* Morning Digest */}
        <div className="py-2 border-b border-spy-border space-y-1.5">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-spy-text">Daily Morning Digest</div>
              <div className="text-[10px] text-spy-dim font-mono">Briefing of all targets due today</div>
            </div>
            <button
              type="button"
              onClick={() => toggle("morning_digest")}
              className={`px-2.5 py-0.5 font-mono text-[10px] font-bold rounded-[3px] border transition-colors ${
                settings.morning_digest
                  ? "bg-spy-green/20 text-spy-green border-spy-green/50"
                  : "bg-spy-surface2 text-spy-dim border-spy-border"
              }`}
            >
              {settings.morning_digest ? "ON" : "OFF"}
            </button>
          </div>

          {settings.morning_digest && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] font-mono text-spy-dim uppercase">Digest Time</span>
              <input
                type="time"
                value={settings.morning_digest_time}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    morning_digest_time: e.target.value,
                  })
                }
                className="bg-spy-surface border border-spy-border px-2 py-0.5 text-xs font-mono text-spy-text rounded-[2px]"
              />
            </div>
          )}
        </div>

        {/* Streak Defense: 8:00 PM */}
        <div className="flex items-center justify-between py-2 border-b border-spy-border">
          <div>
            <div className="font-medium text-spy-text">Streak Defense Warning</div>
            <div className="text-[10px] text-spy-dim font-mono">8:00 PM if no mission completed today</div>
          </div>
          <button
            type="button"
            onClick={() => toggle("streak_reminder")}
            className={`px-2.5 py-0.5 font-mono text-[10px] font-bold rounded-[3px] border transition-colors ${
              settings.streak_reminder
                ? "bg-spy-green/20 text-spy-green border-spy-green/50"
                : "bg-spy-surface2 text-spy-dim border-spy-border"
            }`}
          >
            {settings.streak_reminder ? "ON" : "OFF"}
          </button>
        </div>

        {/* Exams & Payments Notice: 3 days & 1 day before */}
        <div className="flex items-center justify-between py-2 border-b border-spy-border">
          <div>
            <div className="font-medium text-spy-text">Exams & Payments Directives</div>
            <div className="text-[10px] text-spy-dim font-mono">3 days and 1 day prior warning</div>
          </div>
          <button
            type="button"
            onClick={() => toggle("exam_reminder")}
            className={`px-2.5 py-0.5 font-mono text-[10px] font-bold rounded-[3px] border transition-colors ${
              settings.exam_reminder
                ? "bg-spy-green/20 text-spy-green border-spy-green/50"
                : "bg-spy-surface2 text-spy-dim border-spy-border"
            }`}
          >
            {settings.exam_reminder ? "ON" : "OFF"}
          </button>
        </div>

        {/* Quiet Hours */}
        <div className="py-2 space-y-1.5">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-spy-text">Quiet Hours (Mute Alerts)</div>
              <div className="text-[10px] text-spy-dim font-mono">Suppress non-critical notification sounds</div>
            </div>
            <button
              type="button"
              onClick={() => toggle("quiet_hours_enabled")}
              className={`px-2.5 py-0.5 font-mono text-[10px] font-bold rounded-[3px] border transition-colors ${
                settings.quiet_hours_enabled
                  ? "bg-spy-green/20 text-spy-green border-spy-green/50"
                  : "bg-spy-surface2 text-spy-dim border-spy-border"
              }`}
            >
              {settings.quiet_hours_enabled ? "ON" : "OFF"}
            </button>
          </div>

          {settings.quiet_hours_enabled && (
            <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
              <div>
                <span className="block text-[10px] text-spy-dim uppercase mb-0.5">Start</span>
                <input
                  type="time"
                  value={settings.quiet_hours_start}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      quiet_hours_start: e.target.value,
                    })
                  }
                  className="w-full bg-spy-surface border border-spy-border px-2 py-0.5 rounded-[2px] text-spy-text"
                />
              </div>
              <div>
                <span className="block text-[10px] text-spy-dim uppercase mb-0.5">End</span>
                <input
                  type="time"
                  value={settings.quiet_hours_end}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      quiet_hours_end: e.target.value,
                    })
                  }
                  className="w-full bg-spy-surface border border-spy-border px-2 py-0.5 rounded-[2px] text-spy-text"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

