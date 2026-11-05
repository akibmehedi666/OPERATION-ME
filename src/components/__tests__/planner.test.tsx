import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { PlannerView } from "@/components/planner/PlannerView";
import { UpcomingDatesCard } from "@/components/dashboard/UpcomingDatesCard";
import { DashboardBanner } from "@/components/dashboard/DashboardBanner";
import { DEFAULT_CATEGORIES, DEFAULT_TIME_BLOCKS, DEFAULT_ACADEMIC_EVENTS } from "@/lib/seeds";
import { Mission } from "@/types/database";

// Mock sound fx
vi.mock("@/lib/sound", () => ({
  soundFX: {
    playBlip: vi.fn(),
    playAccomplish: vi.fn(),
    playRankUp: vi.fn(),
  },
}));

describe("Planner & Academic Calendar Components", () => {
  const dummyMissions: Mission[] = [
    {
      id: "m-1",
      title: "Operating Systems Page Replacement Analysis",
      codename: "OP-PAGE-1",
      category_id: "cat-1",
      priority: "urgent",
      status: "active",
      deadline: "2026-11-08T18:00:00.000Z",
      time_spent_minutes: 60,
      xp: 60,
      created_at: new Date().toISOString(),
    },
  ];

  it("renders Weekly Grid with columns for 7 days (SAT to FRI) and hours 9 AM to 10 PM", () => {
    render(
      <PlannerView
        timeBlocks={DEFAULT_TIME_BLOCKS}
        academicEvents={DEFAULT_ACADEMIC_EVENTS}
        missions={dummyMissions}
        categories={DEFAULT_CATEGORIES}
        onAddTimeBlock={vi.fn()}
        onUpdateTimeBlock={vi.fn()}
        onDeleteTimeBlock={vi.fn()}
        onAddAcademicEvent={vi.fn()}
        onUpdateAcademicEvent={vi.fn()}
        onDeleteAcademicEvent={vi.fn()}
        onScheduleMission={vi.fn()}
        onConfirmAutoSchedule={vi.fn()}
        onRunAutoSchedule={vi.fn().mockReturnValue(1)}
        onCompleteMission={vi.fn()}
      />
    );

    // Verify 7 weekday column headers
    expect(screen.getAllByText("SAT").length).toBeGreaterThan(0);
    expect(screen.getAllByText("SUN").length).toBeGreaterThan(0);
    expect(screen.getAllByText("MON").length).toBeGreaterThan(0);
    expect(screen.getAllByText("TUE").length).toBeGreaterThan(0);
    expect(screen.getAllByText("WED").length).toBeGreaterThan(0);
    expect(screen.getAllByText("THU").length).toBeGreaterThan(0);
    expect(screen.getAllByText("FRI").length).toBeGreaterThan(0);

    // Verify hours in grid
    expect(screen.getAllByText(/9 AM/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/10 PM/i).length).toBeGreaterThan(0);

    // Verify block legend at bottom
    expect(screen.getByText("University class")).toBeDefined();
    expect(screen.getAllByText("Tuition").length).toBeGreaterThan(0);
    expect(screen.getByText("Project / career")).toBeDefined();
    expect(screen.getByText("Course study")).toBeDefined();
    expect(screen.getByText("CP / SQL practice")).toBeDefined();
    expect(screen.getByText("Break / rest")).toBeDefined();
  });

  it("switches view mode between Weekly Grid and Academic Calendar", () => {
    render(
      <PlannerView
        timeBlocks={DEFAULT_TIME_BLOCKS}
        academicEvents={DEFAULT_ACADEMIC_EVENTS}
        missions={dummyMissions}
        categories={DEFAULT_CATEGORIES}
        onAddTimeBlock={vi.fn()}
        onUpdateTimeBlock={vi.fn()}
        onDeleteTimeBlock={vi.fn()}
        onAddAcademicEvent={vi.fn()}
        onUpdateAcademicEvent={vi.fn()}
        onDeleteAcademicEvent={vi.fn()}
        onScheduleMission={vi.fn()}
        onConfirmAutoSchedule={vi.fn()}
        onRunAutoSchedule={vi.fn().mockReturnValue(1)}
        onCompleteMission={vi.fn()}
      />
    );

    // Click "Academic Calendar" view mode button
    const calendarTabButton = screen.getByRole("button", { name: /Academic Calendar/i });
    fireEvent.click(calendarTabButton);

    // Now calendar month view should be rendered
    expect(screen.getByText(/INSPECTION DOSSIER/i)).toBeDefined();
  });

  it("UpcomingDatesCard renders 3 nearest events with countdowns", () => {
    render(
      <UpcomingDatesCard
        events={DEFAULT_ACADEMIC_EVENTS}
        onOpenCalendar={vi.fn()}
      />
    );

    expect(screen.getByText(/UPCOMING KEY DATES/i)).toBeDefined();
    expect(screen.getAllByText(/Online Saturday class|1st installment due|MID-TERM EXAM/i).length).toBeGreaterThan(0);
  });

  it("DashboardBanner renders when an exam or payment deadline is within 7 days", () => {
    // Event 4 days from now
    const upcomingEvents = [
      {
        id: "ev-test",
        date: new Date(Date.now() + 4 * 86400 * 1000).toISOString().slice(0, 10),
        title: "Test Installment Payment",
        type: "payment" as const,
      },
    ];

    render(
      <DashboardBanner
        events={upcomingEvents}
        onOpenPlanner={vi.fn()}
      />
    );

    expect(screen.getByText(/STRATEGIC DIRECTIVE/i)).toBeDefined();
    expect(screen.getByText(/Test Installment Payment/i)).toBeDefined();
  });
});
