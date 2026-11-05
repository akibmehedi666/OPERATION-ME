import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { StatCardsRow } from "../dashboard/StatCardsRow";
import { TodayBriefing } from "../dashboard/TodayBriefing";
import { TodayPlanTimeline } from "../dashboard/TodayPlanTimeline";
import { DEFAULT_SCHEDULE, DEFAULT_CATEGORIES } from "@/lib/seeds";
import { Mission } from "@/types/database";

describe("Dashboard Components Verification", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Freeze time: Thursday, Nov 5, 2026, 10:00:00
    vi.setSystemTime(new Date(2026, 10, 5, 10, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("StatCardsRow", () => {
    it("computes and renders Today, Streak, and Overdue stats correctly", () => {
      const now = new Date();
      const mockMissions: Mission[] = [
        // Completed today
        {
          id: "m-1",
          title: "Done today",
          codename: "OP-1",
          status: "completed",
          completed_at: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0).toISOString(),
          deadline: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0).toISOString(),
          priority: "high",
          xp: 50,
          created_at: new Date().toISOString(),
        },
        // Pending due today
        {
          id: "m-2",
          title: "Pending today",
          codename: "OP-2",
          status: "active",
          deadline: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0).toISOString(),
          priority: "medium",
          xp: 50,
          created_at: new Date().toISOString(),
        },
        // Overdue mission
        {
          id: "m-3",
          title: "Overdue mission",
          codename: "OP-3",
          status: "active",
          deadline: new Date(now.getTime() - 24 * 3600 * 1000).toISOString(),
          priority: "urgent",
          xp: 80,
          created_at: new Date().toISOString(),
        },
      ];

      render(<StatCardsRow missions={mockMissions} streak={7} />);
      act(() => {
        vi.advanceTimersByTime(600);
      });

      // Today stat: 1 of 2 completed; Overdue: 1 mission; Streak: 7 days
      expect(screen.getByText(/Today/i)).toBeInTheDocument();
      expect(screen.getByText(/Streak/i)).toBeInTheDocument();
      expect(screen.getByText(/Overdue/i)).toBeInTheDocument();
      expect(screen.getAllByText("1")).toHaveLength(2);
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("7")).toBeInTheDocument();
    });

    it("applies overdue-pulse when overdue count > 0", () => {
      const mockMissions: Mission[] = [
        {
          id: "m-od",
          title: "Overdue task",
          codename: "OP-OD",
          status: "active",
          deadline: new Date(Date.now() - 3600 * 1000).toISOString(),
          priority: "urgent",
          xp: 50,
          created_at: new Date().toISOString(),
        },
      ];

      const { container } = render(<StatCardsRow missions={mockMissions} streak={4} />);
      const overdueElement = container.querySelector(".overdue-pulse");
      expect(overdueElement).toBeTruthy();
    });
  });

  describe("TodayPlanTimeline", () => {
    it("merges classes, tuition, and missions chronologically by time", () => {
      const now = new Date();
      // On THU, default schedule has tuition at 18:00 (6:00 PM)
      const mockMissions: Mission[] = [
        {
          id: "m-plan-1",
          title: "Morning Mission",
          codename: "OP-MORN",
          status: "active",
          deadline: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 30).toISOString(),
          priority: "medium",
          xp: 50,
          created_at: new Date().toISOString(),
        },
        {
          id: "m-plan-2",
          title: "Late Night Mission",
          codename: "OP-NIGHT",
          status: "active",
          deadline: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 22, 0).toISOString(),
          priority: "high",
          xp: 50,
          created_at: new Date().toISOString(),
        },
      ];

      render(
        <TodayPlanTimeline
          schedule={DEFAULT_SCHEDULE}
          missions={mockMissions}
          categories={DEFAULT_CATEGORIES}
          activeMissionId={null}
          onCompleteMission={vi.fn()}
        />
      );

      // Verify all items are rendered
      expect(screen.getByText("Morning Mission")).toBeInTheDocument();
      expect(screen.getByText("Tuition (I teach)")).toBeInTheDocument();
      expect(screen.getByText("Late Night Mission")).toBeInTheDocument();

      // Check chronological appearance in DOM
      const morningEl = screen.getByText("Morning Mission");
      const tuitionEl = screen.getByText("Tuition (I teach)");
      const nightEl = screen.getByText("Late Night Mission");

      expect(morningEl.compareDocumentPosition(tuitionEl) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(tuitionEl.compareDocumentPosition(nightEl) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it("never shows the active hero mission inside Today's Plan to prevent duplicate display", () => {
      const now = new Date();
      const heroMission: Mission = {
        id: "hero-1",
        title: "Hero Active Mission",
        codename: "OP-HERO",
        status: "active",
        deadline: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0).toISOString(),
        priority: "urgent",
        xp: 100,
        created_at: new Date().toISOString(),
      };

      render(
        <TodayPlanTimeline
          schedule={DEFAULT_SCHEDULE}
          missions={[heroMission]}
          categories={DEFAULT_CATEGORIES}
          activeMissionId="hero-1"
          onCompleteMission={vi.fn()}
        />
      );

      expect(screen.queryByText("Hero Active Mission")).toBeNull();
    });
  });

  describe("TodayBriefing", () => {
    it("renders timetable and allows switching between days of the week", () => {
      render(<TodayBriefing schedule={DEFAULT_SCHEDULE} />);

      // Switch to SAT
      const satTab = screen.getByRole("button", { name: "SAT" });
      fireEvent.click(satTab);

      // SAT classes should be visible
      expect(screen.getByText(/Digital Image Processing \(DIP\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Final Year Design Project \(FYDP-I\)/i)).toBeInTheDocument();

      // Switch to SUN
      const sunTab = screen.getByRole("button", { name: "SUN" });
      fireEvent.click(sunTab);

      expect(screen.getByText(/Economics/i)).toBeInTheDocument();
      expect(screen.getByText(/Operating Systems/i)).toBeInTheDocument();
      expect(screen.getByText(/Probability & Statistics/i)).toBeInTheDocument();

      // Switch to MON (Tuition only, no classes)
      const monTab = screen.getByRole("button", { name: "MON" });
      fireEvent.click(monTab);

      expect(screen.getByText(/Tuition \(I teach\)/i)).toBeInTheDocument();
      expect(screen.queryByText(/Operating Systems/i)).toBeNull();
    });
  });
});
