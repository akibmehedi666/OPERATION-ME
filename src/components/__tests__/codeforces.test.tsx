import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CodeforcesView } from "@/components/cf/CodeforcesView";
import { CodeforcesLog } from "@/types/database";

describe("CodeforcesView Component", () => {
  const mockLogs: CodeforcesLog[] = [
    {
      id: "cf-1",
      problem_name: "Watermelon (4A)",
      problem_url: "https://codeforces.com/problemset/problem/4/A",
      rating: 800,
      tags: ["math", "brute force"],
      status: "solved",
      time_taken_minutes: 20,
      date: new Date().toISOString().split("T")[0], // Solved today
      notes: "Check if w is even and greater than 2.",
      xp: 40,
      created_at: new Date().toISOString(),
    },
    {
      id: "cf-2",
      problem_name: "Theatre Square (1A)",
      problem_url: "https://codeforces.com/problemset/problem/1/A",
      rating: 1000,
      tags: ["math"],
      status: "solved",
      time_taken_minutes: 30,
      date: new Date(Date.now() - 86400 * 1000).toISOString().split("T")[0], // Yesterday
      notes: "Ceil division using (n + a - 1) / a.",
      xp: 40,
      created_at: new Date().toISOString(),
    },
    {
      id: "cf-3",
      problem_name: "Maximum Subarray Sum",
      rating: 1400,
      tags: ["dp", "greedy"],
      status: "upsolve",
      time_taken_minutes: 45,
      date: new Date(Date.now() - 3 * 86400 * 1000).toISOString().split("T")[0],
      notes: "Kadane's algorithm dynamic programming reset at 0.",
      xp: 15,
      created_at: new Date().toISOString(),
    },
  ];

  const defaultProps = {
    logs: mockLogs,
    onAddLog: vi.fn(),
    onUpdateLog: vi.fn(),
    onDeleteLog: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("op_me_cf_handle", "tourist");
    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            status: "OK",
            result: [
              {
                handle: "tourist",
                rating: 3850,
                maxRating: 4009,
                rank: "legendary grandmaster",
              },
            ],
          }),
      })
    );
  });

  it("renders CP streak, daily 1/1 target status, and weekly/monthly counters", () => {
    render(<CodeforcesView {...defaultProps} />);

    expect(screen.getByText("CP Streak")).toBeInTheDocument();
    // 2 days consecutive (today and yesterday)
    expect(screen.getByText("2 days")).toBeInTheDocument();

    expect(screen.getByText("Today's Target")).toBeInTheDocument();
    expect(screen.getByText(/Solved \(1\/1\)/i)).toBeInTheDocument();

    expect(screen.getByText("This Week")).toBeInTheDocument();
    expect(screen.getAllByText("2 solved").length).toBe(2);
  });

  it("fetches and displays official Codeforces API profile stats", async () => {
    render(<CodeforcesView {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("tourist")).toBeInTheDocument();
    });

    expect(screen.getByText("legendary grandmaster")).toBeInTheDocument();
    expect(screen.getByText("3850")).toBeInTheDocument();
  });

  it("renders rating distribution and tag breakdown charts", () => {
    render(<CodeforcesView {...defaultProps} />);

    expect(screen.getByText("Rating Distribution")).toBeInTheDocument();
    expect(screen.getByText("<1000")).toBeInTheDocument();
    expect(screen.getByText("1000-1199")).toBeInTheDocument();

    expect(screen.getByText("Top Solved Topics")).toBeInTheDocument();
    expect(screen.getByText("math")).toBeInTheDocument();
    expect(screen.getByText("dp")).toBeInTheDocument();
  });

  it("filters problems by search query and status filter", () => {
    render(<CodeforcesView {...defaultProps} />);

    // Initially displays all 3 problems
    expect(screen.getByText("Watermelon (4A)")).toBeInTheDocument();
    expect(screen.getByText("Theatre Square (1A)")).toBeInTheDocument();
    expect(screen.getByText("Maximum Subarray Sum")).toBeInTheDocument();

    // Filter by search query "Square"
    const searchInput = screen.getByPlaceholderText(/Search problem, tag, or note/i);
    fireEvent.change(searchInput, { target: { value: "Square" } });

    expect(screen.getByText("Theatre Square (1A)")).toBeInTheDocument();
    expect(screen.queryByText("Watermelon (4A)")).not.toBeInTheDocument();
    expect(screen.queryByText("Maximum Subarray Sum")).not.toBeInTheDocument();

    // Reset search
    fireEvent.change(searchInput, { target: { value: "" } });

    // Filter by status "upsolve"
    const upsolveFilterBtn = screen.getByRole("button", { name: /^upsolve$/i });
    fireEvent.click(upsolveFilterBtn);

    expect(screen.getByText("Maximum Subarray Sum")).toBeInTheDocument();
    expect(screen.queryByText("Watermelon (4A)")).not.toBeInTheDocument();
  });

  it("opens modal and logs a new Codeforces problem", () => {
    const onAddLog = vi.fn();
    render(<CodeforcesView {...defaultProps} onAddLog={onAddLog} />);

    const logProblemBtn = screen.getByRole("button", { name: /Log Problem/i });
    fireEvent.click(logProblemBtn);

    expect(screen.getByText(/LOG CODEFORCES PROBLEM/i)).toBeInTheDocument();

    const nameInput = screen.getByPlaceholderText(/e\.g\. Watermelon/i);
    fireEvent.change(nameInput, { target: { value: "Bit++ (282A)" } });

    const ratingInput = screen.getByPlaceholderText("1200");
    fireEvent.change(ratingInput, { target: { value: "800" } });

    const saveBtn = screen.getByRole("button", { name: "Save Problem" });
    fireEvent.click(saveBtn);

    expect(onAddLog).toHaveBeenCalledWith(
      expect.objectContaining({
        problem_name: "Bit++ (282A)",
        rating: 800,
        status: "solved",
      })
    );
  });

  it("allows deleting a Codeforces problem", () => {
    const onDeleteLog = vi.fn();
    render(<CodeforcesView {...defaultProps} onDeleteLog={onDeleteLog} />);

    const deleteBtns = screen.getAllByTitle("Delete entry");
    fireEvent.click(deleteBtns[0]);

    expect(onDeleteLog).toHaveBeenCalledWith("cf-1");
  });
});
