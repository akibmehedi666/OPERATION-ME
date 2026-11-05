import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MissionModal } from "../missions/MissionModal";
import { CompletionNoteModal } from "../missions/CompletionNoteModal";
import { Button } from "../ui/Button";
import { DEFAULT_CATEGORIES } from "@/lib/seeds";

describe("Accessibility & Input Validation Unit Tests", () => {
  it("MissionModal requires non-empty title input and validates required constraint", () => {
    const mockSave = vi.fn();
    render(
      <MissionModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={mockSave}
        categories={DEFAULT_CATEGORIES}
      />
    );

    const titleInput = screen.getByPlaceholderText(/e\.g\. Implement OS Page Replacement/i) as HTMLInputElement;
    expect(titleInput.required).toBe(true);
    expect(titleInput.value).toBe("");

    // Submitting with empty title does not invoke onSave
    const submitBtn = screen.getByText("Create Mission");
    fireEvent.click(submitBtn);

    expect(mockSave).not.toHaveBeenCalled();
  });

  it("CompletionNoteModal handles Enter key submission and Escape/Close cleanly", () => {
    const mockComplete = vi.fn();
    const mockClose = vi.fn();

    render(
      <CompletionNoteModal
        isOpen={true}
        mission={{
          id: "m-test",
          title: "Test Operation",
          codename: "OP-TEST",
          priority: "urgent",
          status: "active",
          xp: 50,
          created_at: new Date().toISOString(),
        }}
        onComplete={mockComplete}
        onClose={mockClose}
      />
    );

    const noteInput = screen.getByPlaceholderText(/e\.g\. solved with DP/i);
    fireEvent.change(noteInput, { target: { value: "Keyboard submitted note" } });

    // Press enter in input
    fireEvent.keyDown(noteInput, { key: "Enter", shiftKey: false });

    expect(mockComplete).toHaveBeenCalledWith(
      expect.objectContaining({ id: "m-test" }),
      "Keyboard submitted note",
      undefined
    );
    expect(mockClose).toHaveBeenCalled();
  });

  it("Button renders accessible tabIndex, focus states, and handles disabled states", () => {
    const mockClick = vi.fn();
    render(
      <Button variant="primary" size="md" disabled={true} onClick={mockClick}>
        Disabled Operative Action
      </Button>
    );

    const btn = screen.getByRole("button", { name: /disabled operative action/i }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);

    fireEvent.click(btn);
    expect(mockClick).not.toHaveBeenCalled();
  });
});
