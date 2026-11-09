"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AcademicEvent, AcademicEventType, Course, TimeBlock } from "@/types/database";
import { X, Trash2, Calendar, BookOpen, FileText, Award } from "lucide-react";
import { formatTime12 } from "@/lib/formatters";
import { getWeekdayFromDate } from "@/lib/scheduleResolver";

interface AcademicEventModalProps {
  isOpen: boolean;
  event?: AcademicEvent | null;
  defaultDate?: string;
  courses?: Course[];
  timeBlocks?: TimeBlock[];
  onSave: (eventData: Omit<AcademicEvent, "id" | "created_at">) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

const EVENT_TYPES: { type: AcademicEventType; label: string; color: string }[] = [
  { type: "quiz", label: "CT / Quiz", color: "text-purple-500" },
  { type: "exam", label: "Exam (Mid-term / Final)", color: "text-red-500" },
  { type: "deadline", label: "Assignment / Submission Deadline", color: "text-orange-500" },
  { type: "payment", label: "Tuition Installment Payment", color: "text-amber-500" },
  { type: "holiday", label: "Holiday / University Closed", color: "text-gray-400" },
  { type: "class_override", label: "Online Class Schedule Override", color: "text-blue-500" },
];

export const AcademicEventModal: React.FC<AcademicEventModalProps> = ({
  isOpen,
  event,
  defaultDate,
  courses = [],
  timeBlocks = [],
  onSave,
  onDelete,
  onClose,
}) => {
  const [title, setTitle] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [type, setType] = useState<AcademicEventType>("quiz");
  const [details, setDetails] = useState<string>("");

  // CT / Quiz specific state
  const [courseId, setCourseId] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("11:10");
  const [endTime, setEndTime] = useState<string>("12:30");
  const [syllabus, setSyllabus] = useState<string>("");
  const [marks, setMarks] = useState<string>("");

  // Helper: auto-fill start & end time from class schedule slot on the chosen date
  const applyDefaultSlot = useCallback((selectedCourseId: string, targetDateStr: string) => {
    if (!selectedCourseId || !targetDateStr) return;
    const course = courses.find((c) => c.id === selectedCourseId);
    if (!course) return;

    const weekday = getWeekdayFromDate(targetDateStr);
    const matchingBlock = timeBlocks.find(
      (b) =>
        b.weekday === weekday &&
        b.type === "class" &&
        ((course.category_id && b.default_category === course.category_id) ||
          b.label.toLowerCase().includes(course.name.toLowerCase()) ||
          b.label.toLowerCase().includes(course.code.toLowerCase()) ||
          (course.name.toLowerCase().includes("operating") && b.label.toLowerCase().includes("op. systems")) ||
          (course.name.toLowerCase().includes("probability") && b.label.toLowerCase().includes("prob & stat")))
    );

    if (matchingBlock) {
      setStartTime(matchingBlock.start_time);
      setEndTime(matchingBlock.end_time);
    } else {
      // Fallback: check any class block for this course on any day
      const anyBlock = timeBlocks.find(
        (b) =>
          b.type === "class" &&
          ((course.category_id && b.default_category === course.category_id) ||
            b.label.toLowerCase().includes(course.name.toLowerCase()))
      );
      if (anyBlock) {
        setStartTime(anyBlock.start_time);
        setEndTime(anyBlock.end_time);
      }
    }
  }, [courses, timeBlocks]);

  useEffect(() => {
    if (!isOpen) return;

    if (event) {
      setTitle(event.title || "");
      setDate(event.date || "");
      setEndDate(event.end_date || "");
      setType(event.type || "deadline");

      if (event.type === "quiz" || event.type === "ct") {
        if (event.details) {
          try {
            const p = JSON.parse(event.details);
            setCourseId(p.course_id || "");
            setStartTime(p.start_time || "11:10");
            setEndTime(p.end_time || "12:30");
            setSyllabus(p.syllabus || "");
            setMarks(p.marks || "");
          } catch {
            setSyllabus(event.details);
            setCourseId(courses[0]?.id || "");
          }
        }
      } else {
        setDetails(event.details || "");
      }
    } else {
      const initialDate = defaultDate || new Date().toISOString().slice(0, 10);
      setDate(initialDate);
      setEndDate("");
      setType("quiz");
      setDetails("");
      const firstCourse = courses[0];
      setCourseId(firstCourse?.id || "");
      setTitle(firstCourse ? `${firstCourse.name} CT` : "New CT");
      setSyllabus("");
      setMarks("");

      // Default time from course's slot on that day
      if (firstCourse) {
        applyDefaultSlot(firstCourse.id, initialDate);
      }
    }
  }, [isOpen, event, defaultDate, courses, applyDefaultSlot]);

  const handleCourseChange = (newCourseId: string) => {
    setCourseId(newCourseId);
    const course = courses.find((c) => c.id === newCourseId);
    if (course) {
      if (!title || title.includes("CT") || title === "") {
        setTitle(`${course.name} CT`);
      }
      applyDefaultSlot(newCourseId, date);
    }
  };

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    if (type === "quiz" && courseId) {
      applyDefaultSlot(courseId, newDate);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;

    if (type === "quiz" || type === "ct") {
      const selectedCourse = courses.find((c) => c.id === courseId);
      const computedTitle = title.trim() || (selectedCourse ? `${selectedCourse.name} CT` : "CT / Quiz");
      const detailsPayload = {
        course_id: courseId || null,
        course_name: selectedCourse?.name || null,
        course_code: selectedCourse?.code || null,
        start_time: startTime,
        end_time: endTime,
        syllabus: syllabus.trim() || null,
        marks: marks.trim() || null,
      };

      onSave({
        title: computedTitle,
        date,
        end_date: null,
        type: "quiz",
        details: JSON.stringify(detailsPayload),
      });
    } else {
      if (!title.trim()) return;
      onSave({
        title: title.trim(),
        date,
        end_date: endDate || null,
        type,
        details: details.trim() || null,
      });
    }

    onClose();
  };

  const isQuiz = type === "quiz" || type === "ct";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg p-6 bg-spy-surface border border-spy-border rounded-[6px] shadow-2xl text-spy-text max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-spy-border mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-spy-green" />
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-spy-text">
              {event ? "EDIT ACADEMIC KEY DATE" : "NEW ACADEMIC EVENT"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-spy-muted hover:text-spy-text rounded-[3px] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Event Type selector */}
          <div>
            <label className="block text-xs font-mono uppercase text-spy-muted mb-1.5">
              Event Type *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {EVENT_TYPES.map((et) => {
                const isSelected = type === et.type || (et.type === "quiz" && type === "ct");
                return (
                  <button
                    key={et.type}
                    type="button"
                    onClick={() => {
                      setType(et.type);
                      if (et.type === "quiz" && courses.length > 0 && !courseId) {
                        setCourseId(courses[0].id);
                        setTitle(`${courses[0].name} CT`);
                        applyDefaultSlot(courses[0].id, date);
                      }
                    }}
                    className={`p-2 rounded-[3px] border text-left transition-colors flex items-center gap-2 text-xs font-mono ${
                      isSelected
                        ? "bg-spy-surface2 border-purple-500 text-purple-600 dark:text-purple-300 font-bold shadow-xs"
                        : "bg-spy-surface border-spy-border text-spy-muted hover:text-spy-text"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${et.color} bg-current shrink-0`} />
                    <span className="truncate">{et.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conditional Fields based on Event Type */}
          {isQuiz ? (
            /* CT / Quiz Form Fields */
            <div className="space-y-3.5 p-3.5 rounded-[4px] bg-purple-500/5 border border-purple-400/25">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-purple-600 dark:text-purple-300">
                <BookOpen className="w-3.5 h-3.5" />
                <span>CLASS TEST / QUIZ CONFIGURATION</span>
              </div>

              {/* Course Dropdown */}
              <div>
                <label className="block text-xs font-mono uppercase text-spy-muted mb-1">
                  Course *
                </label>
                <select
                  required
                  value={courseId}
                  onChange={(e) => handleCourseChange(e.target.value)}
                  className="w-full bg-spy-surface2 border border-spy-border px-3 py-2 text-sm text-spy-text rounded-[3px] focus:outline-none focus:border-purple-500 font-sans"
                >
                  <option value="" disabled>Select course...</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} – {c.name} {c.section ? `(Sec ${c.section})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title / Label */}
              <div>
                <label className="block text-xs font-mono uppercase text-spy-muted mb-1">
                  Title / Label *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. OS CT, Stats CT"
                  className="w-full bg-spy-surface2 border border-spy-border px-3 py-2 text-sm text-spy-text rounded-[3px] focus:outline-none focus:border-purple-500 font-sans"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-mono uppercase text-spy-muted mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full bg-spy-surface2 border border-spy-border px-3 py-2 text-sm text-spy-text rounded-[3px] focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              {/* 12-Hour Start & End Time (Defaulted to class slot) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase text-spy-muted mb-1">
                    Start Time ({formatTime12(startTime)}) *
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-spy-surface2 border border-spy-border px-3 py-2 text-sm text-spy-text rounded-[3px] focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-spy-muted mb-1">
                    End Time ({formatTime12(endTime)}) *
                  </label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-spy-surface2 border border-spy-border px-3 py-2 text-sm text-spy-text rounded-[3px] focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
              </div>

              {/* Syllabus / Notes */}
              <div>
                <label className="block text-xs font-mono uppercase text-spy-muted mb-1 flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  <span>Syllabus / Notes</span>
                </label>
                <textarea
                  rows={2}
                  value={syllabus}
                  onChange={(e) => setSyllabus(e.target.value)}
                  placeholder="e.g. Process Synchronization & CPU Scheduling (Chapters 5-6)..."
                  className="w-full bg-spy-surface2 border border-spy-border px-3 py-2 text-xs text-spy-text rounded-[3px] focus:outline-none focus:border-purple-500 font-sans"
                />
              </div>

              {/* Marks (Optional) */}
              <div>
                <label className="block text-xs font-mono uppercase text-spy-muted mb-1 flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  <span>Marks (Optional)</span>
                </label>
                <input
                  type="text"
                  value={marks}
                  onChange={(e) => setMarks(e.target.value)}
                  placeholder="e.g. 20"
                  className="w-full bg-spy-surface2 border border-spy-border px-3 py-2 text-sm text-spy-text rounded-[3px] focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>
            </div>
          ) : (
            /* Standard Event Fields */
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-mono uppercase text-spy-muted mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Mid-term exam, Tuition payment due"
                  className="w-full bg-spy-surface2 border border-spy-border px-3 py-2 text-sm text-spy-text rounded-[3px] focus:outline-none focus:border-spy-green font-sans"
                />
              </div>

              {/* Date & Optional End Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase text-spy-muted mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-spy-surface2 border border-spy-border px-3 py-2 text-sm text-spy-text rounded-[3px] focus:outline-none focus:border-spy-green font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-spy-muted mb-1">
                    End Date (Optional Range)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-spy-surface2 border border-spy-border px-3 py-2 text-sm text-spy-text rounded-[3px] focus:outline-none focus:border-spy-green font-mono"
                  />
                </div>
              </div>

              {/* Details */}
              <div>
                <label className="block text-xs font-mono uppercase text-spy-muted mb-1">
                  Details / Instructions (Optional)
                </label>
                <textarea
                  rows={2}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="e.g. Covers chapters 1-4, carry scientific calculator..."
                  className="w-full bg-spy-surface2 border border-spy-border px-3 py-2 text-xs text-spy-text rounded-[3px] focus:outline-none focus:border-spy-green font-sans"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-spy-border">
            {event && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  onDelete(event.id);
                  onClose();
                }}
                className="px-3 py-1.5 text-xs font-mono text-spy-red hover:bg-spy-redMuted rounded-[3px] transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-mono text-spy-muted hover:text-spy-text border border-spy-border rounded-[3px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-mono font-bold bg-[#14663a] text-white hover:bg-[#0f4d2c] dark:bg-spy-green dark:text-black dark:hover:bg-spy-green/90 rounded-[3px] shadow-sm transition-colors"
              >
                {event ? "Save Changes" : "Create Event"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
