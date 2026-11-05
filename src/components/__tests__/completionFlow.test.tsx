import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { CompletionNoteModal } from "../missions/CompletionNoteModal";
import { MissionCelebration } from "../missions/MissionCelebration";
import { Mission } from "@/types/database";

describe("Mission Completion Flow Components", () => {
  const sampleMission: Mission = {
    id: "m-sample",
    title: "Implement OS Page Replacement",
    codename: "OP-OS-PAGE",
    priority: "high",
    status: "active",
    xp: 60,
    created_at: new Date().toISOString(),
  };

  const nextMission: Mission = {
    id: "m-next",
    title: "Economics Market Analysis",
    codename: "OP-ECON",
    priority: "medium",
    status: "active",
    xp: 50,
    created_at: new Date().toISOString(),
  };

  describe("CompletionNoteModal", () => {
    it("renders mission debrief modal with title and quick inputs", () => {
      render(
        <CompletionNoteModal
          isOpen={true}
          mission={sampleMission}
          onComplete={vi.fn()}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText("Mission Debrief")).toBeInTheDocument();
      expect(screen.getByText("Implement OS Page Replacement")).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/e\.g\. solved with DP/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/e\.g\. 45/i)).toBeInTheDocument();
      expect(screen.getByText("Skip note")).toBeInTheDocument();
      expect(screen.getByText("Save & Complete")).toBeInTheDocument();
    });

    it("Save & Accomplish passes entered note and parsed time spent", () => {
      const mockComplete = vi.fn();
      const mockClose = vi.fn();

      render(
        <CompletionNoteModal
          isOpen={true}
          mission={sampleMission}
          onComplete={mockComplete}
          onClose={mockClose}
        />
      );

      const noteInput = screen.getByPlaceholderText(/e\.g\. solved with DP/i);
      const timeInput = screen.getByPlaceholderText(/e\.g\. 45/i);

      fireEvent.change(noteInput, { target: { value: "All test cases passed cleanly" } });
      fireEvent.change(timeInput, { target: { value: "35" } });

      const saveBtn = screen.getByText("Save & Complete");
      fireEvent.click(saveBtn);

      expect(mockComplete).toHaveBeenCalledWith(
        sampleMission,
        "All test cases passed cleanly",
        35
      );
      expect(mockClose).toHaveBeenCalled();
    });

    it("Skip & Accomplish completes immediately without note or time spent", () => {
      const mockComplete = vi.fn();
      const mockClose = vi.fn();

      render(
        <CompletionNoteModal
          isOpen={true}
          mission={sampleMission}
          onComplete={mockComplete}
          onClose={mockClose}
        />
      );

      const skipBtn = screen.getByText("Skip note");
      fireEvent.click(skipBtn);

      expect(mockComplete).toHaveBeenCalledWith(sampleMission, undefined, undefined);
      expect(mockClose).toHaveBeenCalled();
    });

    it("supports edit-only debrief mode on already completed missions", () => {
      const mockSaveEdit = vi.fn();
      const mockClose = vi.fn();

      const completedMission: Mission = {
        ...sampleMission,
        status: "completed",
        completion_note: "Initial notes",
        time_spent_minutes: 20,
      };

      render(
        <CompletionNoteModal
          isOpen={true}
          mission={completedMission}
          isEditingOnly={true}
          onSaveEdit={mockSaveEdit}
          onClose={mockClose}
        />
      );

      expect(screen.getByText("Edit Debrief Note")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Initial notes")).toBeInTheDocument();
      expect(screen.getByDisplayValue("20")).toBeInTheDocument();

      const noteInput = screen.getByDisplayValue("Initial notes");
      fireEvent.change(noteInput, { target: { value: "Updated detailed retrospective" } });

      const updateBtn = screen.getByText("Save Note");
      fireEvent.click(updateBtn);

      expect(mockSaveEdit).toHaveBeenCalledWith(
        sampleMission.id,
        "Updated detailed retrospective",
        20
      );
      expect(mockClose).toHaveBeenCalled();
    });
  });

  describe("MissionCelebration Modal", () => {
    it("renders mission accomplished celebration with awarded XP and Next Target", () => {
      const mockClose = vi.fn();

      render(
        <MissionCelebration
          isOpen={true}
          completedMission={sampleMission}
          nextMission={nextMission}
          onClose={mockClose}
        />
      );

      expect(screen.getByText("★ MISSION ACCOMPLISHED ★")).toBeInTheDocument();
      expect(screen.getByText("Implement OS Page Replacement")).toBeInTheDocument();
      expect(screen.getByText("+60 XP")).toBeInTheDocument();
      expect(screen.getByText("Next Target Acquired")).toBeInTheDocument();
      expect(screen.getByText("Economics Market Analysis")).toBeInTheDocument();

      const continueBtn = screen.getByText("Continue");
      fireEvent.click(continueBtn);
      expect(mockClose).toHaveBeenCalled();
    });
  });
});
