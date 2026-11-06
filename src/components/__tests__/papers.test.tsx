import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ResearchPapersView } from "@/components/papers/ResearchPapersView";
import { DEMO_PAPERS } from "@/lib/seeds";

describe("ResearchPapersView Component", () => {
  const defaultProps = {
    papers: DEMO_PAPERS,
    onAddPaper: vi.fn(),
    onUpdatePaper: vi.fn(),
    onDeletePaper: vi.fn(),
  };

  it("renders catalog header with total count and status metrics", () => {
    render(<ResearchPapersView {...defaultProps} />);

    expect(screen.getByText("Total Catalog")).toBeInTheDocument();
    expect(screen.getByText("Mastered (Done)")).toBeInTheDocument();
    expect(screen.getByText("In Progress")).toBeInTheDocument();
    expect(screen.getByText("To-Read Queue")).toBeInTheDocument();
  });

  it("displays currently reading spotlight paper when a paper has reading status", () => {
    render(<ResearchPapersView {...defaultProps} />);

    // FlashAttention has status "reading" in DEFAULT_PAPERS
    expect(screen.getByText("Active Reading Objective")).toBeInTheDocument();
    expect(screen.getAllByText(/FlashAttention/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("button", { name: /Mark Read & Summarize/i })).toBeInTheDocument();
  });

  it("filters papers by search query and status filter", () => {
    render(<ResearchPapersView {...defaultProps} />);

    expect(screen.getByText("Attention Is All You Need")).toBeInTheDocument();
    expect(screen.getByText("A Fast and Scalable Key-Value Store for Flash Storage")).toBeInTheDocument();

    // Filter by query "LSM"
    const searchInput = screen.getByPlaceholderText(/Search paper title, authors, tags/i);
    fireEvent.change(searchInput, { target: { value: "LSM" } });

    expect(screen.getByText("A Fast and Scalable Key-Value Store for Flash Storage")).toBeInTheDocument();
    expect(screen.queryByText("Attention Is All You Need")).not.toBeInTheDocument();
  });

  it("displays 3-line synthesis and key architectural takeaway", () => {
    render(<ResearchPapersView {...defaultProps} />);

    expect(screen.getByText("3-Line Synthesis")).toBeInTheDocument();
    expect(screen.getByText("Key Architectural Takeaway")).toBeInTheDocument();
  });

  it("opens modal and records a new paper", () => {
    const onAddPaper = vi.fn();
    render(<ResearchPapersView {...defaultProps} onAddPaper={onAddPaper} />);

    const addBtns = screen.getAllByRole("button", { name: "Add Paper" });
    fireEvent.click(addBtns[0]);

    expect(screen.getByText("ADD RESEARCH PAPER")).toBeInTheDocument();

    const titleInput = screen.getByPlaceholderText(/FlashAttention/i);
    fireEvent.change(titleInput, { target: { value: "MapReduce: Simplified Data Processing on Large Clusters" } });

    const saveBtn = screen.getByRole("button", { name: "Record Paper" });
    fireEvent.click(saveBtn);

    expect(onAddPaper).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "MapReduce: Simplified Data Processing on Large Clusters",
      })
    );
  });

  it("allows switching status of a paper", () => {
    const onUpdatePaper = vi.fn();
    render(<ResearchPapersView {...defaultProps} onUpdatePaper={onUpdatePaper} />);

    const doneButtons = screen.getAllByTitle("Set status to done");
    fireEvent.click(doneButtons[0]);

    expect(onUpdatePaper).toHaveBeenCalledWith(
      expect.objectContaining({ status: "done" })
    );
  });
});
