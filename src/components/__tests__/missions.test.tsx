import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MissionQueue } from "../missions/MissionQueue";
import { MissionModal } from "../missions/MissionModal";
import { DEFAULT_CATEGORIES } from "@/lib/seeds";
import { Mission } from "@/types/database";

describe("Missions Queue & Modal Verification", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Freeze time: Wednesday Nov 4, 2026, 12:00:00
    vi.setSystemTime(new Date(2026, 10, 4, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const now = new Date(2026, 10, 4, 12, 0, 0);

  const testMissions: Mission[] = [
    // 1. Overdue
    {
      id: "m-overdue",
      title: "Overdue Lab Task",
      codename: "OP-OD",
      category_id: "cat-2", // OS Lab
      priority: "urgent",
      status: "active",
      deadline: new Date(now.getTime() - 24 * 3600 * 1000).toISOString(),
      xp: 80,
      created_at: new Date().toISOString(),
    },
    // 2. Today
    {
      id: "m-today",
      title: "Today Economics Assignment",
      codename: "OP-TODAY",
      category_id: "cat-3", // Economics
      priority: "high",
      status: "active",
      deadline: new Date(2026, 10, 4, 20, 0).toISOString(),
      xp: 50,
      created_at: new Date().toISOString(),
    },
    // 3. Tomorrow
    {
      id: "m-tomorrow",
      title: "Tomorrow DIP Homework",
      codename: "OP-TOMORROW",
      category_id: "cat-4", // DIP
      priority: "medium",
      status: "active",
      deadline: new Date(2026, 10, 5, 15, 0).toISOString(),
      xp: 40,
      created_at: new Date().toISOString(),
    },
    // 4. This Week
    {
      id: "m-thisweek",
      title: "This Week P&S Quiz Prep",
      codename: "OP-WEEK",
      category_id: "cat-5", // Prob & Stats
      priority: "medium",
      status: "active",
      deadline: new Date(2026, 10, 7, 18, 0).toISOString(),
      xp: 60,
      created_at: new Date().toISOString(),
    },
    // 5. Later
    {
      id: "m-later",
      title: "Later FYDP Final Phase",
      codename: "OP-LATER",
      category_id: "cat-6", // FYDP
      priority: "urgent",
      status: "active",
      deadline: new Date(2026, 11, 20, 18, 0).toISOString(),
      xp: 150,
      created_at: new Date().toISOString(),
    },
    // 6. Completed
    {
      id: "m-completed",
      title: "Completed Cyber CTF",
      codename: "OP-DONE",
      category_id: "cat-7", // Cybersecurity
      priority: "low",
      status: "completed",
      completed_at: new Date(2026, 10, 3, 10, 0).toISOString(),
      xp: 30,
      created_at: new Date().toISOString(),
    },
  ];

  describe("Groupings & Sections", () => {
    it("groups missions into Overdue, Today, Tomorrow, This Week, Later, and Completed sections", () => {
      render(
        <MissionQueue
          missions={testMissions}
          categories={DEFAULT_CATEGORIES}
          onComplete={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onSetActive={vi.fn()}
        />
      );

      // Verify all section labels are present with their counts
      expect(screen.getByText("OVERDUE")).toBeInTheDocument();
      expect(screen.getByText("TODAY")).toBeInTheDocument();
      expect(screen.getByText("TOMORROW")).toBeInTheDocument();
      expect(screen.getByText("THIS WEEK")).toBeInTheDocument();
      expect(screen.getByText("LATER")).toBeInTheDocument();
      expect(screen.getByText("COMPLETED")).toBeInTheDocument();

      // Open completed section (collapsed by default)
      const completedHeader = screen.getByText("COMPLETED").closest("button")!;
      fireEvent.click(completedHeader);

      expect(screen.getByText("Completed Cyber CTF")).toBeInTheDocument();
    });

    it("filters missions by category chip", () => {
      render(
        <MissionQueue
          missions={testMissions}
          categories={DEFAULT_CATEGORIES}
          onComplete={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onSetActive={vi.fn()}
        />
      );

      // Click "Eco" chip
      const ecoChip = screen.getByRole("button", { name: "Eco" });
      fireEvent.click(ecoChip);

      expect(screen.getByText("Today Economics Assignment")).toBeInTheDocument();
      expect(screen.queryByText("Tomorrow DIP Homework")).toBeNull();
      expect(screen.queryByText("Overdue Lab Task")).toBeNull();
    });

    it("filters missions using search input query", () => {
      render(
        <MissionQueue
          missions={testMissions}
          categories={DEFAULT_CATEGORIES}
          onComplete={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onSetActive={vi.fn()}
        />
      );

      const searchInput = screen.getByPlaceholderText(/search missions/i);
      fireEvent.change(searchInput, { target: { value: "FYDP" } });

      expect(screen.getByText("Later FYDP Final Phase")).toBeInTheDocument();
      expect(screen.queryByText("Today Economics Assignment")).toBeNull();
    });

    it("displays empty state when no missions match filters", () => {
      render(
        <MissionQueue
          missions={testMissions}
          categories={DEFAULT_CATEGORIES}
          onComplete={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onSetActive={vi.fn()}
        />
      );

      const searchInput = screen.getByPlaceholderText(/search missions/i);
      fireEvent.change(searchInput, { target: { value: "NonExistentTaskXYZ" } });

      expect(
        screen.getByText("No missions found matching the selected filter parameters.")
      ).toBeInTheDocument();
    });
  });

  describe("MissionModal CRUD", () => {
    it("renders New Mission modal and saves new mission with title, category, priority", () => {
      const mockSave = vi.fn();
      const mockClose = vi.fn();

      render(
        <MissionModal
          isOpen={true}
          onClose={mockClose}
          onSave={mockSave}
          categories={DEFAULT_CATEGORIES}
          editingMission={null}
        />
      );

      expect(screen.getByText("NEW MISSION")).toBeInTheDocument();

      const titleInput = screen.getByPlaceholderText(/e\.g\. Implement OS Page Replacement/i);
      fireEvent.change(titleInput, { target: { value: "Deploy Kernel Patch" } });

      const submitBtn = screen.getByText("Create Mission");
      fireEvent.click(submitBtn);

      expect(mockSave).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Deploy Kernel Patch",
          priority: "medium",
          xp: 50,
          status: "active",
        })
      );
      expect(mockClose).toHaveBeenCalled();
    });

    it("populates existing mission fields in Edit mode", () => {
      const mockSave = vi.fn();
      const editing: Mission = {
        id: "edit-1",
        title: "Existing Operation",
        codename: "OP-EXIST",
        category_id: "cat-1",
        priority: "urgent",
        status: "active",
        xp: 90,
        deadline: new Date(2026, 10, 8, 14, 0).toISOString(),
        notes: "Detailed mission briefings",
        created_at: new Date().toISOString(),
      };

      render(
        <MissionModal
          isOpen={true}
          onClose={vi.fn()}
          onSave={mockSave}
          categories={DEFAULT_CATEGORIES}
          editingMission={editing}
        />
      );

      expect(screen.getByText("EDIT MISSION")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Existing Operation")).toBeInTheDocument();
      expect(screen.getByDisplayValue("OP-EXIST")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Detailed mission briefings")).toBeInTheDocument();

      const saveBtn = screen.getByText("Save Changes");
      fireEvent.click(saveBtn);

      expect(mockSave).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "edit-1",
          title: "Existing Operation",
          priority: "urgent",
          xp: 90,
        })
      );
    });

    it("hides separate due date by default and auto-syncs deadline with scheduled end time", () => {
      const mockSave = vi.fn();
      render(
        <MissionModal
          isOpen={true}
          onClose={vi.fn()}
          onSave={mockSave}
          categories={DEFAULT_CATEGORIES}
          initialDate="2026-11-10"
          initialStartTime="14:00"
          initialEndTime="15:30"
        />
      );

      // Separate deadline input should not be visible by default
      expect(screen.queryByText(/Mission Deadline \(Separate Due Date\)/i)).not.toBeInTheDocument();
      expect(screen.getByText("+ Add a separate due date")).toBeInTheDocument();

      // Enter title and save
      fireEvent.change(screen.getByPlaceholderText(/e\.g\. Implement OS Page Replacement/i), {
        target: { value: "Auto Due Mission" },
      });
      fireEvent.click(screen.getByText("Create Mission"));

      // Deadline must match scheduled end time (2026-11-10T15:30)
      expect(mockSave).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Auto Due Mission",
          scheduled_end: new Date("2026-11-10T15:30:00").toISOString(),
          deadline: new Date("2026-11-10T15:30:00").toISOString(),
        })
      );
    });

    it("reveals separate due date fields and blocks saving if due date is earlier than scheduled end", () => {
      const mockSave = vi.fn();
      render(
        <MissionModal
          isOpen={true}
          onClose={vi.fn()}
          onSave={mockSave}
          categories={DEFAULT_CATEGORIES}
          initialDate="2026-11-10"
          initialStartTime="14:00"
          initialEndTime="16:00"
        />
      );

      // Click to add separate due date
      fireEvent.click(screen.getByText("+ Add a separate due date"));
      expect(screen.getByText(/Mission Deadline \(Separate Due Date\)/i)).toBeInTheDocument();

      // Set due date to be earlier than scheduled end (e.g. 2026-11-09)
      const dateInputs = screen.getAllByDisplayValue("2026-11-10");
      // The second date input is the separate deadline date
      fireEvent.change(dateInputs[1], { target: { value: "2026-11-09" } });

      // Inline warning should be visible
      expect(screen.getByText(/Due date cannot be earlier than scheduled end/i)).toBeInTheDocument();

      // Save button should be disabled
      const saveBtn = screen.getByText("Create Mission");
      expect(saveBtn).toBeDisabled();

      // Try clicking - should NOT call onSave
      fireEvent.click(saveBtn);
      expect(mockSave).not.toHaveBeenCalled();

      // Fix due date to 2026-11-11
      fireEvent.change(dateInputs[1], { target: { value: "2026-11-11" } });
      expect(screen.queryByText(/Due date cannot be earlier than scheduled end/i)).not.toBeInTheDocument();
      expect(saveBtn).not.toBeDisabled();
    });

    it("shows and requires deadline when 'No specific time (deadline only)' is checked", () => {
      const mockSave = vi.fn();
      render(
        <MissionModal
          isOpen={true}
          onClose={vi.fn()}
          onSave={mockSave}
          categories={DEFAULT_CATEGORIES}
        />
      );

      // Check "No specific time (deadline only)"
      const checkbox = screen.getByLabelText(/No specific time \(deadline only\)/i);
      fireEvent.click(checkbox);

      // Deadline fields should now be directly shown
      expect(screen.getByText(/Mission Deadline/i)).toBeInTheDocument();
      expect(screen.queryByText("+ Add a separate due date")).not.toBeInTheDocument();
    });

    it("keeps separate due date visible when editing a mission whose deadline differs from end time", () => {
      const editing: Mission = {
        id: "diff-1",
        title: "Extended Project",
        codename: "OP-DIFF-1",
        category_id: "cat-1",
        priority: "high",
        status: "active",
        xp: 100,
        scheduled_start: "2026-11-10T10:00:00Z",
        scheduled_end: "2026-11-10T12:00:00Z",
        deadline: "2026-11-15T23:59:00Z", // differs from scheduled_end!
        created_at: new Date().toISOString(),
      };

      render(
        <MissionModal
          isOpen={true}
          onClose={vi.fn()}
          onSave={vi.fn()}
          categories={DEFAULT_CATEGORIES}
          editingMission={editing}
        />
      );

      // Separate deadline section must be visible immediately
      expect(screen.getByText(/Mission Deadline \(Separate Due Date\)/i)).toBeInTheDocument();
      expect(screen.queryByText("+ Add a separate due date")).not.toBeInTheDocument();
    });
  });
});
