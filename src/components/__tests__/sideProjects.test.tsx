import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SideProjectsView } from "@/components/projects/SideProjectsView";
import { DEMO_SIDE_PROJECTS } from "@/lib/seeds";

describe("SideProjectsView Component", () => {
  const defaultProps = {
    projects: DEMO_SIDE_PROJECTS,
    onAddProject: vi.fn(),
    onUpdateProject: vi.fn(),
    onDeleteProject: vi.fn(),
    onAddStepMission: vi.fn(),
  };

  it("renders metrics row and project items", () => {
    render(<SideProjectsView {...defaultProps} />);

    expect(screen.getByText("Total R&D")).toBeInTheDocument();
    expect(screen.getByText("Active Build")).toBeInTheDocument();
    expect(screen.getByText("Momentum Risk")).toBeInTheDocument();
    expect(screen.getAllByText("Shipped").length).toBeGreaterThanOrEqual(1);

    expect(screen.getByText("OPERATION: ME (Mission Control)")).toBeInTheDocument();
    expect(screen.getByText("RISC-V xv6 Kernel Extension")).toBeInTheDocument();
    expect(screen.getByText("Distributed Raft Consensus KV Store")).toBeInTheDocument();
  });

  it("renders 7+ days inactive momentum warning badge on stalled projects", () => {
    render(<SideProjectsView {...defaultProps} />);

    // DEFAULT_SIDE_PROJECTS[2] has 10 days inactive
    const warningBadges = screen.getAllByText(/7\+ DAYS INACTIVE — REQUIRES MOMENTUM/i);
    expect(warningBadges.length).toBeGreaterThanOrEqual(1);

    expect(screen.getByText(/MOMENTUM ALERT:/i)).toBeInTheDocument();
  });

  it("filters projects by search query and status tabs", () => {
    render(<SideProjectsView {...defaultProps} />);

    // Filter by query "Raft"
    const searchInput = screen.getByPlaceholderText(/Search projects by name, scope, or next step/i);
    fireEvent.change(searchInput, { target: { value: "Raft" } });

    expect(screen.getByText("Distributed Raft Consensus KV Store")).toBeInTheDocument();
    expect(screen.queryByText("OPERATION: ME (Mission Control)")).not.toBeInTheDocument();

    // Reset search
    fireEvent.change(searchInput, { target: { value: "" } });

    // Filter by status "Active"
    const activeFilterBtn = screen.getByRole("button", { name: "Active" });
    fireEvent.click(activeFilterBtn);

    expect(screen.getByText("OPERATION: ME (Mission Control)")).toBeInTheDocument();
    expect(screen.queryByText("Distributed Raft Consensus KV Store")).not.toBeInTheDocument();
  });

  it("opens modal and registers a new side project", () => {
    const onAddProject = vi.fn();
    render(<SideProjectsView {...defaultProps} onAddProject={onAddProject} />);

    const newBtn = screen.getByRole("button", { name: /New Project/i });
    fireEvent.click(newBtn);

    expect(screen.getByText("REGISTER NEW SIDE PROJECT")).toBeInTheDocument();

    const nameInput = screen.getByPlaceholderText(/OPERATION: ME/i);
    fireEvent.change(nameInput, { target: { value: "Compiler IR Optimizer in LLVM" } });

    const stepInput = screen.getByPlaceholderText(/copy-on-write/i);
    fireEvent.change(stepInput, { target: { value: "Implement dead code elimination pass" } });

    const submitBtn = screen.getByRole("button", { name: "Initialize Project" });
    fireEvent.click(submitBtn);

    expect(onAddProject).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Compiler IR Optimizer in LLVM",
        next_step: "Implement dead code elimination pass",
      })
    );
  });

  it("allows logging a work session to update momentum and next step", () => {
    const onUpdateProject = vi.fn();
    render(<SideProjectsView {...defaultProps} onUpdateProject={onUpdateProject} />);

    const logButtons = screen.getAllByRole("button", { name: /Log Session/i });
    fireEvent.click(logButtons[0]);

    expect(screen.getByText("Log Work Session & Update Next Step")).toBeInTheDocument();

    const nextStepInput = screen.getByPlaceholderText(/What is your immediate next step now/i);
    fireEvent.change(nextStepInput, { target: { value: "Run benchmarks on 4 cores" } });

    const saveBtn = screen.getByRole("button", { name: /Save & Record Momentum/i });
    fireEvent.click(saveBtn);

    expect(onUpdateProject).toHaveBeenCalledWith(
      expect.objectContaining({
        next_step: "Run benchmarks on 4 cores",
      })
    );
  });

  it("triggers onAddStepMission callback when + Step Mission is clicked", () => {
    const onAddStepMission = vi.fn();
    render(<SideProjectsView {...defaultProps} onAddStepMission={onAddStepMission} />);

    const stepMissionBtns = screen.getAllByRole("button", { name: /\+ Step Mission/i });
    fireEvent.click(stepMissionBtns[0]);

    expect(onAddStepMission).toHaveBeenCalled();
  });
});
