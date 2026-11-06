import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CyberRoadmapView } from "@/components/cyber/CyberRoadmapView";
import { DEFAULT_CYBER_TOPICS } from "@/lib/seeds";

describe("CyberRoadmapView Component", () => {
  const defaultProps = {
    topics: DEFAULT_CYBER_TOPICS,
    onUpdateTopicStatus: vi.fn(),
  };

  it("renders roadmap header with overall progress and stats", () => {
    render(<CyberRoadmapView {...defaultProps} />);

    expect(screen.getByText("CYBERSECURITY TACTICAL ROADMAP")).toBeInTheDocument();
    expect(screen.getByText("Overall Roadmap Mastery")).toBeInTheDocument();
    expect(screen.getByText(/Total Time/i)).toBeInTheDocument();
    expect(screen.getByText(/Legal practice only/i)).toBeInTheDocument();
  });

  it("displays next recommended objective banner", () => {
    render(<CyberRoadmapView {...defaultProps} />);

    expect(screen.getByText(/Next Recommended Objective/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mark Mastered (Done)" })).toBeInTheDocument();
  });

  it("renders sections and switches topic status on click with required hands-on modal", () => {
    const onUpdateTopicStatus = vi.fn();
    render(<CyberRoadmapView {...defaultProps} onUpdateTopicStatus={onUpdateTopicStatus} />);

    expect(screen.getByText("Networking Basics")).toBeInTheDocument();
    expect(screen.getAllByText("OSI Model & TCP/IP Stack Encapsulation").length).toBeGreaterThanOrEqual(1);

    // Click "Done" on the first topic to trigger completion modal
    const doneBtns = screen.getAllByRole("button", { name: "Done" });
    fireEvent.click(doneBtns[0]);

    // Modal is opened
    expect(screen.getByText(/Log Hands-On Lab & Mark Complete/i)).toBeInTheDocument();

    // Check required hands-on checkbox
    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    // Enter required one-line takeaway
    const takeawayInput = screen.getByPlaceholderText(/What was the key mechanism/i);
    fireEvent.change(takeawayInput, { target: { value: "TCP encapsulation wraps headers at each layer." } });

    // Confirm completion
    const confirmBtn = screen.getByRole("button", { name: /Confirm Completion/i });
    fireEvent.click(confirmBtn);

    expect(onUpdateTopicStatus).toHaveBeenCalledWith(
      "ct-01",
      "done",
      undefined,
      expect.any(Number),
      "TCP encapsulation wraps headers at each layer.",
      true
    );
  });

  it("filters topics with search input", () => {
    render(<CyberRoadmapView {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(/Filter topics by keyword/i);
    fireEvent.change(searchInput, { target: { value: "Wireshark" } });

    expect(screen.getByText(/Wireshark: Deep Packet Inspection/i)).toBeInTheDocument();
  });

  it("opens inline editor and saves notes and time spent", () => {
    const onUpdateTopicStatus = vi.fn();
    render(<CyberRoadmapView {...defaultProps} onUpdateTopicStatus={onUpdateTopicStatus} />);

    const editNoteBtns = screen.getAllByRole("button", { name: /Edit Notes|\+ Add Note/i });
    fireEvent.click(editNoteBtns[0]);

    const textarea = screen.getByPlaceholderText(/Key observations, attack vectors/i);
    fireEvent.change(textarea, { target: { value: "TCP SYN floods can be mitigated with SYN cookies." } });

    const saveBtn = screen.getByRole("button", { name: "Save" });
    fireEvent.click(saveBtn);

    expect(onUpdateTopicStatus).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      "TCP SYN floods can be mitigated with SYN cookies.",
      expect.any(Number),
      undefined,
      false
    );
  });
});
