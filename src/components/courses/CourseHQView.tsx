"use client";

import React, { useState, useMemo } from "react";
import {
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  ExternalLink,
  FileText,
  FolderGit2,
  Layers,
  MapPin,
  Plus,
  Trash2,
  Edit3,
} from "lucide-react";
import {
  Course,
  LectureLog,
  Mission,
  TimeBlock,
  AcademicEvent,
  Category,
  CourseResource,
} from "@/types/database";
import { getCourseCountdown } from "@/lib/courseCountdown";
import { getCategoryTheme } from "@/lib/categoryTheme";
import { Button } from "@/components/ui/Button";
import { LectureLogModal } from "./LectureLogModal";
import { CourseResourceModal } from "./CourseResourceModal";
import { EditCourseModal } from "./EditCourseModal";

interface CourseHQViewProps {
  courses: Course[];
  selectedCourseId?: string;
  missions: Mission[];
  categories: Category[];
  lectureLogs: LectureLog[];
  timeBlocks: TimeBlock[];
  academicEvents: AcademicEvent[];
  onSelectCourse?: (courseId: string) => void;
  onAddLectureLog: (log: Omit<LectureLog, "id">) => void;
  onUpdateLectureLog: (log: LectureLog) => void;
  onDeleteLectureLog: (logId: string) => void;
  onToggleLectureStudied: (logId: string, studied: boolean) => void;
  onAddCourseResource: (courseId: string, resource: Omit<CourseResource, "id">) => void;
  onDeleteCourseResource: (courseId: string, resourceId: string) => void;
  onCompleteMission: (mission: Mission) => void;
  onAddMissionForCourse: (course: Course) => void;
  onUpdateCourse?: (courseId: string, updates: Partial<Course>) => Promise<void> | void;
}

export const CourseHQView: React.FC<CourseHQViewProps> = ({
  courses,
  selectedCourseId,
  missions,
  lectureLogs,
  timeBlocks,
  academicEvents,
  onSelectCourse,
  onAddLectureLog,
  onUpdateLectureLog,
  onDeleteLectureLog,
  onToggleLectureStudied,
  onAddCourseResource,
  onDeleteCourseResource,
  onCompleteMission,
  onAddMissionForCourse,
  onUpdateCourse,
}) => {
  const [activeCourseId, setActiveCourseId] = useState<string>(() => {
    return selectedCourseId || courses[0]?.id || "course-os";
  });
  const [courseTab, setCourseTab] = useState<"missions" | "lectures" | "deadlines" | "resources">("missions");

  // Modals state
  const [isLectureModalOpen, setIsLectureModalOpen] = useState(false);
  const [editingLecture, setEditingLecture] = useState<LectureLog | null>(null);
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isEditCourseModalOpen, setIsEditCourseModalOpen] = useState(false);

  // Sync when selectedCourseId changes from outside
  React.useEffect(() => {
    if (selectedCourseId) {
      setActiveCourseId(selectedCourseId);
    }
  }, [selectedCourseId]);

  const activeCourse = useMemo(() => {
    return courses.find((c) => c.id === activeCourseId) || courses[0];
  }, [courses, activeCourseId]);

  const courseTheme = useMemo(() => {
    return getCategoryTheme(activeCourse?.name || "");
  }, [activeCourse]);

  // Live countdown to next class
  const countdownInfo = useMemo(() => {
    if (!activeCourse) return null;
    return getCourseCountdown(activeCourse, timeBlocks, academicEvents);
  }, [activeCourse, timeBlocks, academicEvents]);

  // Course Missions
  const courseMissions = useMemo(() => {
    if (!activeCourse) return [];
    return missions.filter((m) => {
      if (m.course_id === activeCourse.id) return true;
      if (activeCourse.category_id && m.category_id === activeCourse.category_id) return true;
      return false;
    });
  }, [missions, activeCourse]);

  const activeMissions = useMemo(() => courseMissions.filter((m) => m.status === "active"), [courseMissions]);
  const completedMissions = useMemo(() => courseMissions.filter((m) => m.status === "completed"), [courseMissions]);

  // Course Lecture Logs
  const courseLectures = useMemo(() => {
    if (!activeCourse) return [];
    return lectureLogs
      .filter((l) => {
        if (l.course_id === activeCourse.id) return true;
        if (l.course_name.toLowerCase() === activeCourse.name.toLowerCase()) return true;
        return false;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [lectureLogs, activeCourse]);

  const studiedLecturesCount = courseLectures.filter((l) => l.studied).length;
  const totalLecturesCount = courseLectures.length;
  const lectureStudiedPct = totalLecturesCount > 0 ? Math.round((studiedLecturesCount / totalLecturesCount) * 100) : 0;

  // Time spent this week on this course
  const weeklyTimeMinutes = useMemo(() => {
    const oneWeekAgo = Date.now() - 7 * 24 * 3600 * 1000;
    return completedMissions
      .filter((m) => m.completed_at && new Date(m.completed_at).getTime() >= oneWeekAgo)
      .reduce((acc, m) => acc + (m.time_spent_minutes || 45), 0);
  }, [completedMissions]);

  // Deadlines & Academic Events for this course
  const courseDeadlines = useMemo(() => {
    if (!activeCourse) return [];

    // Filter relevant academic events (exams, project cutoffs, overrides)
    const matchedEvents = academicEvents.filter((e) => {
      const titleLower = e.title.toLowerCase();
      const courseCodeLower = activeCourse.code.toLowerCase();
      const courseNameLower = activeCourse.name.toLowerCase();
      if (titleLower.includes(courseCodeLower) || titleLower.includes(courseNameLower)) return true;
      if (e.type === "exam") return true; // mid-term and final apply to all courses
      return false;
    });

    return matchedEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [academicEvents, activeCourse]);

  const handleSelectCourse = (id: string) => {
    setActiveCourseId(id);
    onSelectCourse?.(id);
  };

  const handleOpenEditLecture = (log: LectureLog) => {
    setEditingLecture(log);
    setIsLectureModalOpen(true);
  };

  const handleOpenAddLecture = () => {
    setEditingLecture(null);
    setIsLectureModalOpen(true);
  };

  if (!activeCourse) {
    return (
      <div className="p-8 text-center font-mono text-spy-muted clean-card">
        No courses configured.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. COURSE SELECTOR TABS (6 Courses) */}
      <div className="clean-card p-2 sm:p-2.5 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-max">
          {courses.map((course) => {
            const isSelected = course.id === activeCourse.id;
            const theme = getCategoryTheme(course.name);
            return (
              <button
                key={course.id}
                onClick={() => handleSelectCourse(course.id)}
                className={`px-3 py-2 rounded-[4px] border text-xs font-mono font-medium flex items-center gap-2 transition-all ${
                  isSelected
                    ? `${theme.chipClass} shadow-xs font-bold scale-[1.02]`
                    : "bg-spy-surface2 border-spy-border text-spy-muted hover:text-spy-text hover:bg-spy-surface"
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: course.color || "#10b981" }}
                />
                <span className="font-bold">{course.code}</span>
                <span className="hidden md:inline opacity-80">{course.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. COURSE COMMAND HEADER */}
      <div
        className={`clean-card p-5 sm:p-6 border-l-[4px] relative overflow-hidden transition-all ${courseTheme.leftAccentClass}`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left Details */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-[3px] border ${courseTheme.chipClass}`}>
                {activeCourse.code}
              </span>
              {activeCourse.section && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-[3px] bg-spy-surface2 border border-spy-border text-spy-dim">
                  Section {activeCourse.section}
                </span>
              )}
              {activeCourse.credits && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-[3px] bg-spy-surface2 border border-spy-border text-spy-dim">
                  {activeCourse.credits} Credits
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-spy-text tracking-tight">
              {activeCourse.name}
            </h1>

            <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs font-mono text-spy-muted pt-0.5">
              {activeCourse.room && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-spy-dim" />
                  <span>Room {activeCourse.room}</span>
                </div>
              )}
              {activeCourse.class_times && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-spy-dim" />
                  <span>{activeCourse.class_times}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Live Countdown Banner + Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {countdownInfo && (
              <div
                className={`p-3 rounded-[4px] border font-mono text-right min-w-[190px] ${
                  countdownInfo.status === "in_session"
                    ? "bg-[#dcf3e4] text-[#14663a] border-[#b9e7c8] dark:bg-spy-green/20 dark:text-spy-green dark:border-spy-green animate-pulse"
                    : countdownInfo.status === "upcoming"
                    ? "bg-[#e4eefc] text-[#1d4f9f] border-[#c6ddf9] dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/50"
                    : "bg-spy-surface2 border-spy-border text-spy-muted"
                }`}
              >
                <div className="text-[10px] uppercase tracking-wider text-spy-dim font-bold flex items-center justify-end gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Next Class</span>
                </div>
                <div
                  className="text-xs font-black tracking-wide mt-0.5"
                  dangerouslySetInnerHTML={{ __html: countdownInfo.countdownText }}
                />
                <div className="text-[10px] text-spy-dim truncate mt-0.5">
                  {countdownInfo.nextDateText} &middot; {countdownInfo.room}
                </div>
              </div>
            )}

            {/* Edit Course Button */}
            {onUpdateCourse && (
              <Button
                variant="stealth"
                size="sm"
                onClick={() => setIsEditCourseModalOpen(true)}
                className="border border-spy-border hover:border-spy-green text-spy-muted hover:text-spy-text"
                title="Edit Course Information"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Course</span>
              </Button>
            )}

            {/* Quick Add Dropdown */}
            <div className="relative">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsQuickAddOpen(!isQuickAddOpen)}
                className="w-full sm:w-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Quick Add</span>
              </Button>

              {isQuickAddOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setIsQuickAddOpen(false)}
                  />
                  <div className="absolute right-0 mt-1.5 w-48 bg-spy-surface border border-spy-border rounded-[4px] shadow-xl py-1 z-30 font-mono text-xs">
                    <button
                      onClick={() => {
                        setIsQuickAddOpen(false);
                        onAddMissionForCourse(activeCourse);
                      }}
                      className="w-full text-left px-3 py-2 text-spy-text hover:bg-spy-surface2 flex items-center gap-2"
                    >
                      <Plus className="w-3.5 h-3.5 text-spy-green" />
                      <span>New Mission</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsQuickAddOpen(false);
                        handleOpenAddLecture();
                      }}
                      className="w-full text-left px-3 py-2 text-spy-text hover:bg-spy-surface2 flex items-center gap-2 border-t border-spy-border"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-spy-green" />
                      <span>Log Lecture</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsQuickAddOpen(false);
                        setIsResourceModalOpen(true);
                      }}
                      className="w-full text-left px-3 py-2 text-spy-text hover:bg-spy-surface2 flex items-center gap-2 border-t border-spy-border"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-spy-green" />
                      <span>Add Resource</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. PROGRESS SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Lectures Studied */}
        <div className="clean-card p-3.5 sm:p-4 bg-[#eef6f0] border-[#cde5d4] dark:bg-spy-surface dark:border-spy-border flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs font-mono uppercase tracking-wider text-[#14663a] dark:text-spy-muted">
              Lectures Studied
            </div>
            <div className="text-base sm:text-lg font-mono font-bold text-[#14663a] dark:text-spy-green">
              {studiedLecturesCount} / {totalLecturesCount}
              <span className="text-xs font-normal opacity-80 ml-1.5">({lectureStudiedPct}%)</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-[4px] bg-[#dcf3e4] border border-[#b9e7c8] text-[#14663a] dark:bg-spy-surface2 dark:border-spy-border dark:text-spy-green flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Missions Completed */}
        <div className="clean-card p-3.5 sm:p-4 bg-[#fdf6ea] border-[#f6e2be] dark:bg-spy-surface dark:border-spy-border flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs font-mono uppercase tracking-wider text-[#9a5b00] dark:text-spy-muted">
              Course Missions
            </div>
            <div className="text-base sm:text-lg font-mono font-bold text-[#9a5b00] dark:text-spy-amber">
              {completedMissions.length}
              <span className="text-xs font-normal opacity-80 ml-1.5">
                ({activeMissions.length} active)
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-[4px] bg-[#fbefd5] border border-[#f4dcaa] text-[#9a5b00] dark:bg-spy-surface2 dark:border-spy-border dark:text-spy-amber flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Weekly Study Time */}
        <div className="clean-card p-3.5 sm:p-4 bg-[#e4eefc] border-[#c6ddf9] dark:bg-spy-surface dark:border-spy-border flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs font-mono uppercase tracking-wider text-[#1d4f9f] dark:text-spy-muted">
              Time This Week
            </div>
            <div className="text-base sm:text-lg font-mono font-bold text-[#1d4f9f] dark:text-blue-400">
              {Math.floor(weeklyTimeMinutes / 60)}h {weeklyTimeMinutes % 60}m
            </div>
          </div>
          <div className="w-10 h-10 rounded-[4px] bg-[#d6e7fa] border border-[#b8d6f7] text-[#1d4f9f] dark:bg-spy-surface2 dark:border-spy-border dark:text-blue-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 4. FOUR COURSE TABS NAVIGATION */}
      <div className="border-b border-spy-border flex items-center gap-1 font-mono text-xs overflow-x-auto no-scrollbar">
        {[
          { key: "missions", label: `Missions (${courseMissions.length})`, icon: <Layers className="w-3.5 h-3.5" /> },
          { key: "lectures", label: `Lecture Log (${courseLectures.length})`, icon: <BookOpen className="w-3.5 h-3.5" /> },
          { key: "deadlines", label: `Deadlines & Exams (${courseDeadlines.length})`, icon: <Calendar className="w-3.5 h-3.5" /> },
          { key: "resources", label: `Resources (${activeCourse.resources?.length || 0})`, icon: <FolderGit2 className="w-3.5 h-3.5" /> },
        ].map((tab) => {
          const isActive = courseTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setCourseTab(tab.key as "missions" | "lectures" | "deadlines" | "resources")}
              className={`px-3 sm:px-4 py-2 border-b-2 font-medium flex items-center gap-1.5 transition-colors shrink-0 -mb-[1px] ${
                isActive
                  ? "border-[#1f7a4d] text-[#14663a] dark:border-spy-green dark:text-spy-green font-bold bg-[#dcf3e4]/50 dark:bg-spy-surface2"
                  : "border-transparent text-spy-muted hover:text-spy-text hover:bg-spy-surface2"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 5. TAB CONTENT */}
      {/* ================= TAB 1: MISSIONS ================= */}
      {courseTab === "missions" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-mono uppercase tracking-wider text-spy-muted">
              Active Objectives ({activeMissions.length})
            </div>
            <Button
              variant="stealth"
              size="sm"
              onClick={() => onAddMissionForCourse(activeCourse)}
            >
              <Plus className="w-3.5 h-3.5 text-spy-green" />
              <span>Add Mission</span>
            </Button>
          </div>

          {activeMissions.length === 0 ? (
            <div className="clean-card p-6 text-center font-mono text-xs text-spy-muted space-y-2">
              <CheckCircle className="w-8 h-8 text-spy-green/60 mx-auto" />
              <p>No active missions for this course. Excellent command status.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAddMissionForCourse(activeCourse)}
              >
                + Assign New Course Mission
              </Button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {activeMissions.map((mission) => (
                <div
                  key={mission.id}
                  className="clean-card p-3.5 flex items-center justify-between gap-3 border-l-[3px] border-l-spy-green"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded-[2px] bg-spy-green/10 text-spy-green border border-spy-green/20">
                        {mission.priority}
                      </span>
                      <span className="text-xs font-mono text-spy-dim">
                        [{mission.codename}]
                      </span>
                    </div>
                    <div className="text-sm font-medium text-spy-text truncate">
                      {mission.title}
                    </div>
                    {mission.deadline && (
                      <div className="text-[11px] font-mono text-spy-muted flex items-center gap-1">
                        <Clock className="w-3 h-3 text-spy-dim" />
                        <span>Due {new Date(mission.deadline).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onCompleteMission(mission)}
                    className="shrink-0"
                  >
                    Accomplish (+{mission.xp} XP)
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Completed Missions History */}
          {completedMissions.length > 0 && (
            <div className="pt-4 border-t border-spy-border space-y-2.5">
              <div className="text-xs font-mono uppercase tracking-wider text-spy-muted">
                Completed Archive ({completedMissions.length})
              </div>
              <div className="space-y-2">
                {completedMissions.map((mission) => (
                  <div
                    key={mission.id}
                    className="p-3 rounded-[4px] bg-spy-surface2 border border-spy-border flex items-center justify-between gap-3 text-xs opacity-75"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="font-medium text-spy-text line-through">
                        {mission.title}
                      </div>
                      <div className="font-mono text-[10px] text-spy-dim">
                        Completed on {mission.completed_at ? new Date(mission.completed_at).toLocaleDateString([], { month: "short", day: "numeric" }) : "Earlier"} &middot; +{mission.xp} XP
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-[2px] font-mono text-[10px] bg-spy-green/10 text-spy-green border border-spy-green/30">
                      ACCOMPLISHED
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: LECTURE LOG ================= */}
      {courseTab === "lectures" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-mono uppercase tracking-wider text-spy-muted">
              Recorded Lectures ({courseLectures.length})
            </div>
            <Button variant="primary" size="sm" onClick={handleOpenAddLecture}>
              <Plus className="w-3.5 h-3.5" />
              <span>Log Lecture</span>
            </Button>
          </div>

          {courseLectures.length === 0 ? (
            <div className="clean-card p-6 text-center font-mono text-xs text-spy-muted space-y-2">
              <BookOpen className="w-8 h-8 text-spy-muted mx-auto" />
              <p>No lectures recorded yet for this course.</p>
              <Button variant="outline" size="sm" onClick={handleOpenAddLecture}>
                + Record Lecture 01
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {courseLectures.map((log) => (
                <div
                  key={log.id}
                  className={`clean-card p-4 transition-colors border-l-[3px] ${
                    log.studied ? "border-l-spy-green" : "border-l-spy-amber"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-[2px] bg-spy-surface2 border border-spy-border text-spy-text">
                          LEC {String(log.lecture_number || 1).padStart(2, "0")}
                        </span>
                        <span className="text-[11px] font-mono text-spy-dim">
                          {new Date(log.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-spy-text">
                        {log.topic || "Lecture Topic"}
                      </h4>
                    </div>

                    {/* Studied Toggle Button */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => onToggleLectureStudied(log.id, !log.studied)}
                        className={`px-2.5 py-1 rounded-[3px] border text-xs font-mono font-medium flex items-center gap-1.5 transition-all ${
                          log.studied
                            ? "bg-[#dcf3e4] text-[#14663a] border-[#b9e7c8] dark:bg-spy-green/20 dark:text-spy-green dark:border-spy-green"
                            : "bg-[#fbefd5] text-[#9a5b00] border-[#f4dcaa] dark:bg-spy-amber/20 dark:text-spy-amber dark:border-spy-amber"
                        }`}
                        title="Click to toggle studied status"
                      >
                        {log.studied ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5 stroke-[2.2]" />
                            <span>STUDIED</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5 stroke-[2.2]" />
                            <span>NEEDS STUDY</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleOpenEditLecture(log)}
                        className="p-1.5 text-spy-muted hover:text-spy-text rounded-[3px] border border-spy-border bg-spy-surface2"
                        title="Edit lecture"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteLectureLog(log.id)}
                        className="p-1.5 text-spy-muted hover:text-spy-red rounded-[3px] border border-spy-border bg-spy-surface2"
                        title="Delete lecture"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Notes snippet */}
                  {log.notes && (
                    <div className="text-xs text-spy-muted font-sans bg-spy-surface2 border border-spy-border p-2.5 rounded-[3px] mt-2 whitespace-pre-wrap">
                      {log.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: DEADLINES & EXAMS ================= */}
      {courseTab === "deadlines" && (
        <div className="space-y-4">
          <div className="text-xs font-mono uppercase tracking-wider text-spy-muted">
            Academic Schedule & Milestone Countdown
          </div>

          {courseDeadlines.length === 0 ? (
            <div className="clean-card p-6 text-center font-mono text-xs text-spy-muted">
              No specific exam or academic deadline registered for {activeCourse.code}.
            </div>
          ) : (
            <div className="space-y-3">
              {courseDeadlines.map((event) => {
                const eventDate = new Date(event.date);
                const now = new Date();
                const diffDays = Math.ceil((eventDate.getTime() - now.getTime()) / (86400 * 1000));
                const isPast = diffDays < 0;

                return (
                  <div
                    key={event.id}
                    className={`clean-card p-4 flex items-center justify-between gap-3 border-l-[3px] ${
                      event.type === "exam"
                        ? "border-l-spy-red bg-[#fbeae8] dark:bg-spy-danger-surface"
                        : "border-l-spy-amber bg-[#fdf6ea] dark:bg-spy-surface"
                    }`}
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-mono font-bold uppercase px-2 py-0.2 rounded-[2px] border ${
                            event.type === "exam"
                              ? "bg-spy-red/20 text-spy-red border-spy-red/30"
                              : "bg-spy-amber/20 text-spy-amber border-spy-amber/30"
                          }`}
                        >
                          {event.type.toUpperCase()}
                        </span>
                        <span className="text-xs font-mono text-spy-dim">
                          {event.date} {event.end_date ? `to ${event.end_date}` : ""}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-spy-text">
                        {event.title}
                      </div>
                      {event.details && (
                        <div className="text-xs text-spy-muted font-sans">
                          {event.details}
                        </div>
                      )}
                    </div>

                    <div className="text-right font-mono shrink-0">
                      <div
                        className={`text-xs font-bold ${
                          isPast
                            ? "text-spy-dim"
                            : diffDays <= 7
                            ? "text-spy-red"
                            : "text-spy-amber"
                        }`}
                      >
                        {isPast ? "Concluded" : diffDays === 0 ? "TODAY" : `In ${diffDays} days`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 4: RESOURCES ================= */}
      {courseTab === "resources" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-mono uppercase tracking-wider text-spy-muted">
              Course Material, Slides & References ({activeCourse.resources?.length || 0})
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsResourceModalOpen(true)}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Resource</span>
            </Button>
          </div>

          {(!activeCourse.resources || activeCourse.resources.length === 0) ? (
            <div className="clean-card p-6 text-center font-mono text-xs text-spy-muted space-y-2">
              <FolderGit2 className="w-8 h-8 text-spy-muted mx-auto" />
              <p>No resources saved for this course yet.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsResourceModalOpen(true)}
              >
                + Add Syllabus or Book Link
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeCourse.resources.map((res) => (
                <div
                  key={res.id}
                  className="clean-card p-3.5 flex items-start justify-between gap-3 group hover:border-spy-borderLight transition-all"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2 rounded-[4px] bg-spy-surface2 border border-spy-border text-spy-green shrink-0 mt-0.5">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded-[2px] bg-spy-surface border border-spy-border text-spy-dim">
                          {res.type}
                        </span>
                      </div>
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-spy-text hover:text-spy-green block truncate group-hover:underline"
                      >
                        {res.title}
                      </a>
                      <div className="text-[10px] font-mono text-spy-dim truncate">
                        {res.url}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-spy-muted hover:text-spy-text rounded-[3px] border border-spy-border bg-spy-surface2"
                      title="Open in new tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => onDeleteCourseResource(activeCourse.id, res.id)}
                      className="p-1.5 text-spy-muted hover:text-spy-red rounded-[3px] border border-spy-border bg-spy-surface2"
                      title="Delete resource"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODALS */}
      <LectureLogModal
        isOpen={isLectureModalOpen}
        course={activeCourse}
        logToEdit={editingLecture}
        onClose={() => {
          setIsLectureModalOpen(false);
          setEditingLecture(null);
        }}
        onSave={(log) => {
          if ("id" in log) {
            onUpdateLectureLog(log as LectureLog);
          } else {
            onAddLectureLog(log);
          }
        }}
      />

      <CourseResourceModal
        isOpen={isResourceModalOpen}
        course={activeCourse}
        onClose={() => setIsResourceModalOpen(false)}
        onSave={(res) => onAddCourseResource(activeCourse.id, res)}
      />

      {onUpdateCourse && (
        <EditCourseModal
          isOpen={isEditCourseModalOpen}
          course={activeCourse}
          onSave={onUpdateCourse}
          onClose={() => setIsEditCourseModalOpen(false)}
        />
      )}
    </div>
  );
};
