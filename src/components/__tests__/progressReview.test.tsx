import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ProgressReviewView } from "@/components/review/ProgressReviewView";
import {
  DEMO_STARTER_MISSIONS,
  DEFAULT_CATEGORIES,
  DEMO_LECTURE_LOGS,
  DEMO_CF_LOGS,
  DEMO_PAPERS,
  DEMO_SIDE_PROJECTS,
  DEMO_WEEKLY_REVIEWS,
} from "@/lib/seeds";

describe("ProgressReviewView Component", () => {
  const defaultProps = {
    missions: DEMO_STARTER_MISSIONS,
    categories: DEFAULT_CATEGORIES,
    totalXp: 1450,
    streak: 6,
    lectureLogs: DEMO_LECTURE_LOGS,
    cfLogs: DEMO_CF_LOGS,
    researchPapers: DEMO_PAPERS,
    sideProjects: DEMO_SIDE_PROJECTS,
    weeklyReviews: DEMO_WEEKLY_REVIEWS,
    onSaveWeeklyReview: vi.fn(),
  };

  it("renders metrics banner with total XP and active streak", () => {
    render(<ProgressReviewView {...defaultProps} />);

    expect(screen.getByText("Cumulative XP")).toBeInTheDocument();
    expect(screen.getByText("1450")).toBeInTheDocument();
    expect(screen.getByText("Operational Streak")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
    expect(screen.getByText("Week Accomplished")).toBeInTheDocument();
    expect(screen.getByText("Tactical Flight Time")).toBeInTheDocument();
  });

  it("renders charts for 7-day velocity and time distribution", () => {
    render(<ProgressReviewView {...defaultProps} />);

    expect(screen.getByText("7-Day Velocity & XP Growth")).toBeInTheDocument();
    expect(screen.getByText("Mission Time Distribution")).toBeInTheDocument();
    expect(screen.getByText("University Courses")).toBeInTheDocument();
    expect(screen.getByText("CP & SQL Practice")).toBeInTheDocument();
  });

  it("renders category completion breakdown across operational categories", () => {
    render(<ProgressReviewView {...defaultProps} />);

    expect(screen.getByText("Directives Completion By Domain")).toBeInTheDocument();
    expect(screen.getByText("Operating Systems")).toBeInTheDocument();
    expect(screen.getByText("Codeforces")).toBeInTheDocument();
  });

  it("renders weekly retrospective form and submits reflection", () => {
    const onSave = vi.fn();
    render(<ProgressReviewView {...defaultProps} onSaveWeeklyReview={onSave} />);

    expect(screen.getByText("FRIDAY TACTICAL RETROSPECTIVE")).toBeInTheDocument();

    const wentWellInput = screen.getByPlaceholderText(/Cleared all xv6 kernel homework/i);
    fireEvent.change(wentWellInput, { target: { value: "Aced the midterm review session" } });

    const toFixInput = screen.getByPlaceholderText(/Delayed review on Prob & Stat/i);
    fireEvent.change(toFixInput, { target: { value: "Need earlier sleep schedule" } });

    const focusInput = screen.getByPlaceholderText(/Submit FYDP literature review/i);
    fireEvent.change(focusInput, { target: { value: "1. Finish compiler lab 2. Reach Specialist on CF" } });

    const submitBtn = screen.getByRole("button", { name: /Log Weekly Review/i });
    fireEvent.click(submitBtn);

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        what_went_well: "Aced the midterm review session",
        what_to_fix: "Need earlier sleep schedule",
        next_week_focus: "1. Finish compiler lab 2. Reach Specialist on CF",
      })
    );
  });
});
