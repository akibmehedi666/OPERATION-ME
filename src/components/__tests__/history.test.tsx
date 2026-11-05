import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { HistoryView } from "../history/HistoryView";
import { DEFAULT_CATEGORIES } from "@/lib/seeds";
import { Mission } from "@/types/database";

describe("HistoryView Component Verification", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Freeze time: Thursday, Nov 5, 2026, 14:00:00
    vi.setSystemTime(new Date(2026, 10, 5, 14, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const mockCompletedMissions: Mission[] = [
    // Completed today (Nov 5, 2026)
    {
      id: "comp-1",
      title: "Completed DIP Edge Detection",
      codename: "OP-DIP-DONE",
      category_id: "cat-4", // DIP
      priority: "high",
      status: "completed",
      completed_at: "2026-11-05T09:30:00.000Z",
      completion_note: "Implemented Sobel filter cleanly",
      time_spent_minutes: 40,
      xp: 60,
      created_at: "2026-11-01T10:00:00.000Z",
    },
    // Completed yesterday (Nov 4, 2026)
    {
      id: "comp-2",
      title: "Completed OS Deadlock Detection",
      codename: "OP-OS-DEAD",
      category_id: "cat-1", // OS
      priority: "urgent",
      status: "completed",
      completed_at: "2026-11-04T15:00:00.000Z",
      completion_note: "Banker's algorithm verified",
      time_spent_minutes: 55,
      xp: 75,
      created_at: "2026-11-01T10:00:00.000Z",
    },
    // Completed last month (Oct 20, 2026)
    {
      id: "comp-3",
      title: "Completed Economics Midterm Notes",
      codename: "OP-ECON-MID",
      category_id: "cat-3", // Economics
      priority: "medium",
      status: "completed",
      completed_at: "2026-10-20T12:00:00.000Z",
      completion_note: "Macroeconomic inflation summaries",
      time_spent_minutes: 60,
      xp: 50,
      created_at: "2026-10-15T10:00:00.000Z",
    },
  ];

  it("renders summary stats and completed missions grouped by date", () => {
    render(
      <HistoryView
        missions={mockCompletedMissions}
        categories={DEFAULT_CATEGORIES}
        streak={5}
        onEditNote={vi.fn()}
      />
    );

    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Check summary cards
    expect(screen.getByText("This Week")).toBeInTheDocument();
    expect(screen.getByText("This Month")).toBeInTheDocument();
    expect(screen.getByText("Best Streak")).toBeInTheDocument();
    expect(screen.getByText("Top Category")).toBeInTheDocument();

    // Group headings contain formatted dates
    expect(screen.getByText("Completed DIP Edge Detection")).toBeInTheDocument();
    expect(screen.getByText("Completed OS Deadlock Detection")).toBeInTheDocument();
    expect(screen.getByText("Completed Economics Midterm Notes")).toBeInTheDocument();
  });

  it("filters history by text search in title, codename, and debrief notes", () => {
    render(
      <HistoryView
        missions={mockCompletedMissions}
        categories={DEFAULT_CATEGORIES}
        streak={5}
        onEditNote={vi.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search history, directives, or debrief notes/i);

    // Search by note content: "Sobel"
    fireEvent.change(searchInput, { target: { value: "Sobel" } });
    expect(screen.getByText("Completed DIP Edge Detection")).toBeInTheDocument();
    expect(screen.queryByText("Completed OS Deadlock Detection")).toBeNull();

    // Search by note content: "Banker"
    fireEvent.change(searchInput, { target: { value: "Banker" } });
    expect(screen.getByText("Completed OS Deadlock Detection")).toBeInTheDocument();
    expect(screen.queryByText("Completed DIP Edge Detection")).toBeNull();
  });

  it("filters history by range selector (Today / Week / Month / All)", () => {
    render(
      <HistoryView
        missions={mockCompletedMissions}
        categories={DEFAULT_CATEGORIES}
        streak={5}
        onEditNote={vi.fn()}
      />
    );

    // Click "Today" range filter
    const todayBtn = screen.getByRole("button", { name: "Today" });
    fireEvent.click(todayBtn);

    expect(screen.getByText("Completed DIP Edge Detection")).toBeInTheDocument();
    expect(screen.queryByText("Completed Economics Midterm Notes")).toBeNull();

    // Click "All" range filter
    const allBtn = screen.getAllByRole("button", { name: "All" })[0];
    fireEvent.click(allBtn);

    expect(screen.getByText("Completed Economics Midterm Notes")).toBeInTheDocument();
  });

  it("calls onEditNote when edit note icon button is clicked", () => {
    const mockEditNote = vi.fn();

    render(
      <HistoryView
        missions={mockCompletedMissions}
        categories={DEFAULT_CATEGORIES}
        streak={5}
        onEditNote={mockEditNote}
      />
    );

    const editBtns = screen.getAllByTitle(/edit debrief note/i);
    expect(editBtns.length).toBeGreaterThan(0);
    fireEvent.click(editBtns[0]);

    expect(mockEditNote).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "comp-1",
      })
    );
  });
});
