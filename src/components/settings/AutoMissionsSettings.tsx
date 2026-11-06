"use client";

import React, { useState } from "react";
import { RecurringRule, Category } from "@/types/database";
import { Button } from "@/components/ui/Button";
import { formatTime12 } from "@/lib/formatters";
import {
  RefreshCw,
  Plus,
  Trash2,
  Clock,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface AutoMissionsSettingsProps {
  rules: RecurringRule[];
  categories: Category[];
  onToggleRule: (ruleId: string, isActive: boolean) => void;
  onUpdateRule: (rule: RecurringRule) => void;
  onAddRule: (rule: Omit<RecurringRule, "id">) => void;
  onDeleteRule?: (ruleId: string) => void;
  onRunGenerator: () => { createdCount: number; message: string };
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const AutoMissionsSettings: React.FC<AutoMissionsSettingsProps> = ({
  rules,
  categories,
  onToggleRule,
  onUpdateRule,
  onAddRule,
  onDeleteRule,
  onRunGenerator,
}) => {
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // New custom rule state
  const [newTitle, setNewTitle] = useState("");
  const [newCategoryId, setNewCategoryId] = useState(categories[0]?.id || "cat-1");
  const [newFrequency, setNewFrequency] = useState<"daily" | "weekly" | "custom_n_days">("daily");
  const [newInterval, setNewInterval] = useState(1);
  const [newDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [newTime, setNewTime] = useState("20:00");
  const [newXp, setNewXp] = useState(40);

  const handleTriggerGenerator = () => {
    const result = onRunGenerator();
    setStatusMessage(result.message);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddRule({
      title: newTitle.trim(),
      rule_type: "custom",
      category_id: newCategoryId,
      priority: "medium",
      frequency: newFrequency,
      interval: newInterval,
      days_of_week: newFrequency === "weekly" ? newDays : undefined,
      time_of_day: newTime,
      xp: newXp,
      is_active: true,
    });

    setNewTitle("");
    setShowAddForm(false);
    setStatusMessage("New recurring directive activated.");
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const toggleDaySelection = (rule: RecurringRule, dayIdx: number) => {
    const currentDays = rule.days_of_week ? [...rule.days_of_week] : [];
    const exists = currentDays.includes(dayIdx);
    const updated = exists ? currentDays.filter((d) => d !== dayIdx) : [...currentDays, dayIdx];
    onUpdateRule({
      ...rule,
      days_of_week: updated.sort(),
    });
  };

  return (
    <div className="space-y-4">
      {/* Top Banner with Generator Trigger */}
      <div className="flex items-center justify-between pb-2 border-b border-spy-border">
        <div>
          <div className="text-spy-text font-bold text-xs">AUTO-MISSIONS ENGINE</div>
          <div className="text-[10px] text-spy-dim font-sans mt-0.5">
            Idempotent generation, capped at 5 active daily missions.
          </div>
        </div>
        <button
          type="button"
          onClick={handleTriggerGenerator}
          className="px-2.5 py-1 text-[11px] font-mono font-medium rounded-[3px] border border-spy-border hover:border-spy-green bg-spy-surface2 hover:bg-spy-green/10 text-spy-green flex items-center gap-1.5 transition-colors"
          title="Run generator now"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Generate Now</span>
        </button>
      </div>

      {statusMessage && (
        <div className="p-2 rounded-[3px] bg-spy-green/10 border border-spy-green/30 text-spy-green text-[11px] font-mono flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Rules List */}
      <div className="space-y-2.5">
        {rules.map((rule) => {
          const isExpanded = editingRuleId === rule.id;
          const category = categories.find((c) => c.id === rule.category_id);

          return (
            <div
              key={rule.id}
              className={`p-2.5 rounded-[4px] border transition-all ${
                rule.is_active
                  ? "bg-spy-surface2/60 border-spy-border"
                  : "bg-black/10 dark:bg-white/5 border-spy-border/50 opacity-60"
              }`}
            >
              {/* Header row: Title + Badges + Toggle Button */}
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-spy-text text-xs truncate">
                      {rule.title}
                    </span>
                    {category && (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-[2px] bg-spy-surface border border-spy-border text-spy-dim">
                        {category.name}
                      </span>
                    )}
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-[2px] text-spy-amber bg-spy-amber/10 border border-spy-amber/20">
                      +{rule.xp} XP
                    </span>
                  </div>
                  <div className="text-[10px] text-spy-muted font-mono mt-0.5 flex items-center gap-2">
                    <span className="capitalize">{rule.frequency}</span>
                    {rule.time_of_day && (
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {formatTime12(rule.time_of_day)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onToggleRule(rule.id, !rule.is_active)}
                    className={`px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-[3px] border transition-colors ${
                      rule.is_active
                        ? "bg-spy-green/20 text-spy-green border-spy-green/50"
                        : "bg-spy-surface border-spy-border text-spy-dim"
                    }`}
                  >
                    {rule.is_active ? "ON" : "OFF"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingRuleId(isExpanded ? null : rule.id)}
                    className="p-1 rounded-[3px] text-spy-muted hover:text-spy-text"
                    title={isExpanded ? "Collapse" : "Configure"}
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded Configuration Form */}
              {isExpanded && (
                <div className="mt-2.5 pt-2 border-t border-spy-border space-y-2 text-xs font-sans">
                  {/* Days of week selector */}
                  <div>
                    <label className="block text-[10px] font-mono text-spy-dim uppercase mb-1">
                      Scheduled Days
                    </label>
                    <div className="flex items-center gap-1">
                      {DAY_LABELS.map((dayLabel, idx) => {
                        const isDayActive =
                          rule.days_of_week && rule.days_of_week.includes(idx);
                        return (
                          <button
                            key={dayLabel}
                            type="button"
                            onClick={() => toggleDaySelection(rule, idx)}
                            className={`flex-1 py-1 text-[10px] font-mono rounded-[2px] border text-center transition-colors ${
                              isDayActive
                                ? "bg-spy-green text-black dark:text-black font-bold border-spy-green"
                                : "bg-spy-surface border-spy-border text-spy-dim hover:text-spy-text"
                            }`}
                          >
                            {dayLabel}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Time of Day & XP inputs */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-mono text-spy-dim uppercase mb-0.5">
                        Due Time
                      </label>
                      <input
                        type="time"
                        value={rule.time_of_day || "21:00"}
                        onChange={(e) =>
                          onUpdateRule({
                            ...rule,
                            time_of_day: e.target.value,
                          })
                        }
                        className="w-full bg-spy-surface border border-spy-border px-2 py-1 text-xs rounded-[2px] font-mono text-spy-text focus:outline-none focus:border-spy-green"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-spy-dim uppercase mb-0.5">
                        XP Reward
                      </label>
                      <input
                        type="number"
                        min="10"
                        max="200"
                        step="5"
                        value={rule.xp}
                        onChange={(e) =>
                          onUpdateRule({
                            ...rule,
                            xp: Math.max(10, parseInt(e.target.value, 10) || 10),
                          })
                        }
                        className="w-full bg-spy-surface border border-spy-border px-2 py-1 text-xs rounded-[2px] font-mono text-spy-text focus:outline-none focus:border-spy-green"
                      />
                    </div>
                  </div>

                  {rule.rule_type === "custom" && onDeleteRule && (
                    <div className="pt-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => onDeleteRule(rule.id)}
                        className="text-[10px] font-mono text-spy-red hover:underline flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete Rule
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Custom Recurring Rule Button / Form */}
      {!showAddForm ? (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="w-full py-2 border border-dashed border-spy-border hover:border-spy-green text-spy-muted hover:text-spy-green rounded-[4px] text-xs font-mono flex items-center justify-center gap-1.5 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Custom Recurring Rule</span>
        </button>
      ) : (
        <form
          onSubmit={handleCreateCustom}
          className="p-3 bg-spy-surface2 border border-spy-green/40 rounded-[4px] space-y-2.5 text-xs font-sans"
        >
          <div className="font-mono text-xs font-semibold text-spy-green uppercase">
            New Recurring Directive
          </div>

          <div>
            <label className="block text-[10px] font-mono text-spy-dim uppercase mb-0.5">
              Mission Title
            </label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Daily LeetCode SQL Practice"
              className="w-full bg-spy-surface border border-spy-border px-2.5 py-1 text-xs rounded-[3px] text-spy-text focus:outline-none focus:border-spy-green"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-mono text-spy-dim uppercase mb-0.5">
                Category
              </label>
              <select
                value={newCategoryId}
                onChange={(e) => setNewCategoryId(e.target.value)}
                className="w-full bg-spy-surface border border-spy-border px-2 py-1 text-xs rounded-[3px] text-spy-text focus:outline-none focus:border-spy-green"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-mono text-spy-dim uppercase mb-0.5">
                Frequency
              </label>
              <select
                value={newFrequency}
                onChange={(e) =>
                  setNewFrequency(e.target.value as "daily" | "weekly" | "custom_n_days")
                }
                className="w-full bg-spy-surface border border-spy-border px-2 py-1 text-xs rounded-[3px] text-spy-text focus:outline-none focus:border-spy-green"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly (Selected Days)</option>
                <option value="custom_n_days">Every N Days</option>
              </select>
            </div>
          </div>

          {newFrequency === "custom_n_days" && (
            <div>
              <label className="block text-[10px] font-mono text-spy-dim uppercase mb-0.5">
                Repeat Interval (Every N Days)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={newInterval}
                onChange={(e) =>
                  setNewInterval(Math.max(1, parseInt(e.target.value, 10) || 1))
                }
                className="w-full bg-spy-surface border border-spy-border px-2 py-1 text-xs rounded-[3px] font-mono text-spy-text focus:outline-none focus:border-spy-green"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-mono text-spy-dim uppercase mb-0.5">
                Due Time
              </label>
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full bg-spy-surface border border-spy-border px-2 py-1 text-xs rounded-[3px] font-mono text-spy-text focus:outline-none focus:border-spy-green"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-spy-dim uppercase mb-0.5">
                XP Reward
              </label>
              <input
                type="number"
                min="10"
                max="200"
                step="5"
                value={newXp}
                onChange={(e) =>
                  setNewXp(Math.max(10, parseInt(e.target.value, 10) || 10))
                }
                className="w-full bg-spy-surface border border-spy-border px-2 py-1 text-xs rounded-[3px] font-mono text-spy-text focus:outline-none focus:border-spy-green"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="stealth"
              size="sm"
              onClick={() => setShowAddForm(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Activate Rule
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

