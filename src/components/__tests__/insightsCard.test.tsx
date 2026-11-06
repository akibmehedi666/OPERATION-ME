import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { InsightsCard } from "@/components/dashboard/InsightsCard";
import {
  DEMO_STARTER_MISSIONS,
  DEMO_LECTURE_LOGS,
  DEMO_SIDE_PROJECTS,
  DEMO_CF_LOGS,
} from "@/lib/seeds";

describe("InsightsCard Component", () => {
  it("renders tactical intelligence header and insights", () => {
    render(
      <InsightsCard
        missions={DEMO_STARTER_MISSIONS}
        lectureLogs={DEMO_LECTURE_LOGS}
        sideProjects={DEMO_SIDE_PROJECTS}
        streak={5}
        cfLogs={DEMO_CF_LOGS}
      />
    );

    expect(screen.getByText("TACTICAL INTELLIGENCE & INSIGHTS")).toBeInTheDocument();
    expect(screen.getByText("Academic Log Check")).toBeInTheDocument();
  });

  it("triggers onNavigate when clicking an actionable insight", () => {
    const onNavigate = vi.fn();
    render(
      <InsightsCard
        missions={DEMO_STARTER_MISSIONS}
        lectureLogs={DEMO_LECTURE_LOGS}
        sideProjects={DEMO_SIDE_PROJECTS}
        streak={5}
        cfLogs={DEMO_CF_LOGS}
        onNavigate={onNavigate}
      />
    );

    const academicCheck = screen.getByText("Academic Log Check");
    fireEvent.click(academicCheck);

    expect(onNavigate).toHaveBeenCalledWith("courses");
  });
});

