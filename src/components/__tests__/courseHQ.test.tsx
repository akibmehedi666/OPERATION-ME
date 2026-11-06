import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CourseHQView } from "@/components/courses/CourseHQView";
import { DEMO_COURSES, DEFAULT_CATEGORIES, DEFAULT_TIME_BLOCKS, DEFAULT_ACADEMIC_EVENTS, DEMO_LECTURE_LOGS } from "@/lib/seeds";
import { Mission } from "@/types/database";

describe("CourseHQView Component", () => {
  const mockMissions: Mission[] = [
    {
      id: "m-os-1",
      title: "Implement Page Table Walk in xv6",
      codename: "OP-PAGING",
      category_id: "cat-1",
      course_id: "course-os",
      priority: "urgent",
      status: "active",
      xp: 60,
      deadline: "2026-11-06T23:59:00",
      created_at: new Date().toISOString(),
    },
    {
      id: "m-os-2",
      title: "Analyze TLB Miss Rates",
      codename: "OP-TLB",
      category_id: "cat-1",
      course_id: "course-os",
      priority: "medium",
      status: "completed",
      xp: 50,
      completed_at: new Date().toISOString(),
      time_spent_minutes: 75,
      created_at: new Date().toISOString(),
    },
  ];

  const defaultProps = {
    courses: DEMO_COURSES,
    selectedCourseId: "course-os",
    missions: mockMissions,
    categories: DEFAULT_CATEGORIES,
    lectureLogs: DEMO_LECTURE_LOGS,
    timeBlocks: DEFAULT_TIME_BLOCKS,
    academicEvents: DEFAULT_ACADEMIC_EVENTS,
    onSelectCourse: vi.fn(),
    onAddLectureLog: vi.fn(),
    onUpdateLectureLog: vi.fn(),
    onDeleteLectureLog: vi.fn(),
    onToggleLectureStudied: vi.fn(),
    onAddCourseResource: vi.fn(),
    onDeleteCourseResource: vi.fn(),
    onCompleteMission: vi.fn(),
    onAddMissionForCourse: vi.fn(),
  };

  it("renders all 6 courses in the selector bar and defaults to Operating Systems", () => {
    render(<CourseHQView {...defaultProps} />);

    // Check course pills in selector bar
    expect(screen.getAllByText("CSE-406")[0]).toBeInTheDocument();
    expect(screen.getByText("CSE-827")).toBeInTheDocument();
    expect(screen.getByText("ECO-406")).toBeInTheDocument();
    expect(screen.getByText("CSE-425")).toBeInTheDocument();
    expect(screen.getByText("STAT-630")).toBeInTheDocument();
    expect(screen.getByText("CSE-626")).toBeInTheDocument();

    // Course title in header
    expect(screen.getByRole("heading", { level: 1, name: "Operating Systems" })).toBeInTheDocument();
    expect(screen.getByText("Dr. Tariqul Islam")).toBeInTheDocument();
    expect(screen.getByText("Room 406")).toBeInTheDocument();
  });

  it("switches to another course when clicking a course pill", () => {
    const onSelectCourse = vi.fn();
    render(<CourseHQView {...defaultProps} onSelectCourse={onSelectCourse} />);

    // Click on Economics pill
    const ecoBtn = screen.getByText("ECO-406").closest("button");
    expect(ecoBtn).not.toBeNull();
    fireEvent.click(ecoBtn!);

    expect(onSelectCourse).toHaveBeenCalledWith("course-econ");
    expect(screen.getByRole("heading", { level: 1, name: "Economics" })).toBeInTheDocument();
    expect(screen.getByText("Prof. Farzana Rahman")).toBeInTheDocument();
  });

  it("renders progress summary cards (Lectures Studied, Missions, Time spent)", () => {
    render(<CourseHQView {...defaultProps} />);

    expect(screen.getByText("Lectures Studied")).toBeInTheDocument();
    expect(screen.getByText("Course Missions")).toBeInTheDocument();
    expect(screen.getByText("Time This Week")).toBeInTheDocument();

    // Operating Systems has 2 lecture logs, both studied (100%)
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
    expect(screen.getByText("(100%)")).toBeInTheDocument();
  });

  it("displays course missions and allows accomplishing a mission", () => {
    const onCompleteMission = vi.fn();
    render(<CourseHQView {...defaultProps} onCompleteMission={onCompleteMission} />);

    expect(screen.getByText("Implement Page Table Walk in xv6")).toBeInTheDocument();
    expect(screen.getByText("[OP-PAGING]")).toBeInTheDocument();

    const accomplishBtn = screen.getByRole("button", { name: /Accomplish/i });
    fireEvent.click(accomplishBtn);

    expect(onCompleteMission).toHaveBeenCalledWith(
      expect.objectContaining({ id: "m-os-1" })
    );
  });

  it("switches to Lecture Log tab and toggles studied status", () => {
    const onToggleLectureStudied = vi.fn();
    render(<CourseHQView {...defaultProps} onToggleLectureStudied={onToggleLectureStudied} />);

    // Switch to Lecture Log tab
    const lecturesTabBtn = screen.getByRole("button", { name: /Lecture Log/i });
    fireEvent.click(lecturesTabBtn);

    expect(screen.getByText("Virtual Memory & Paging Mechanisms")).toBeInTheDocument();
    expect(screen.getByText("Page Replacement Algorithms (LRU, Clock, FIFO)")).toBeInTheDocument();

    // Toggle studied status on the first lecture (sorted newest first, so ll-2 on Nov 4 is first)
    const studiedButtons = screen.getAllByRole("button", { name: /STUDIED/i });
    fireEvent.click(studiedButtons[0]);

    expect(onToggleLectureStudied).toHaveBeenCalledWith("ll-2", false);
  });

  it("opens Log Lecture modal and records a new lecture", () => {
    const onAddLectureLog = vi.fn();
    render(<CourseHQView {...defaultProps} onAddLectureLog={onAddLectureLog} />);

    // Switch to Lecture Log tab
    const lecturesTabBtn = screen.getByRole("button", { name: /Lecture Log/i });
    fireEvent.click(lecturesTabBtn);

    // Click Log Lecture button
    const logBtn = screen.getByRole("button", { name: /Log Lecture/i });
    fireEvent.click(logBtn);

    expect(screen.getByText(/LOG NEW LECTURE/i)).toBeInTheDocument();

    const topicInput = screen.getByPlaceholderText(/Page Replacement Algorithms/i);
    fireEvent.change(topicInput, { target: { value: "Concurrency & Deadlock Prevention" } });

    const saveBtn = screen.getByRole("button", { name: "Record Lecture" });
    fireEvent.click(saveBtn);

    expect(onAddLectureLog).toHaveBeenCalledWith(
      expect.objectContaining({
        course_name: "Operating Systems",
        topic: "Concurrency & Deadlock Prevention",
      })
    );
  });

  it("switches to Deadlines & Exams tab and shows academic milestones", () => {
    render(<CourseHQView {...defaultProps} />);

    // Switch to Deadlines tab
    const deadlinesTabBtn = screen.getByRole("button", { name: /Deadlines & Exams/i });
    fireEvent.click(deadlinesTabBtn);

    expect(screen.getByText(/Academic Schedule & Milestone Countdown/i)).toBeInTheDocument();
    expect(screen.getByText("MID-TERM EXAM")).toBeInTheDocument();
    expect(screen.getByText("FINAL EXAM")).toBeInTheDocument();
  });

  it("switches to Resources tab and lists resources with external links", () => {
    const onDeleteCourseResource = vi.fn();
    render(<CourseHQView {...defaultProps} onDeleteCourseResource={onDeleteCourseResource} />);

    // Switch to Resources tab
    const resourcesTabBtn = screen.getByRole("button", { name: /Resources/i });
    fireEvent.click(resourcesTabBtn);

    expect(screen.getByText("xv6 RISC-V Operating System Book")).toBeInTheDocument();
    expect(screen.getByText("Operating System Concepts (Silberschatz)")).toBeInTheDocument();

    // Click delete on the first resource
    const deleteBtns = screen.getAllByTitle("Delete resource");
    fireEvent.click(deleteBtns[0]);

    expect(onDeleteCourseResource).toHaveBeenCalledWith("course-os", "res-os-1");
  });
});
