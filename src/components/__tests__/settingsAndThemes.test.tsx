import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { AgentHeader } from "../dashboard/AgentHeader";
import { AnimationProvider, useAnimations } from "@/lib/animationContext";
import { AnimatedCounter } from "../ui/AnimatedCounter";

describe("Settings & Theme Toggle Component Verification", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
  });

  it("header toggles theme when clicking sun/moon icon", () => {
    const mockToggle = vi.fn();
    const mockUpdateDefault = vi.fn();

    render(
      <AgentHeader
        agentName="Agent Akib"
        totalXp={450}
        streak={5}
        currentTheme="dark"
        defaultTheme="dark"
        onToggleTheme={mockToggle}
        onUpdateDefaultTheme={mockUpdateDefault}
        onQuickAdd={vi.fn()}
        onLogout={vi.fn()}
      />
    );

    const themeToggleBtn = screen.getByTitle(/switch to light theme/i);
    expect(themeToggleBtn).toBeInTheDocument();
    fireEvent.click(themeToggleBtn);

    expect(mockToggle).toHaveBeenCalledTimes(1);
  });

  it("opens Settings modal and allows changing default theme preference (Dark / Light / System)", () => {
    const mockUpdateDefault = vi.fn();

    render(
      <AgentHeader
        agentName="Agent Akib"
        totalXp={450}
        streak={5}
        currentTheme="dark"
        defaultTheme="dark"
        onToggleTheme={vi.fn()}
        onUpdateDefaultTheme={mockUpdateDefault}
        onQuickAdd={vi.fn()}
        onLogout={vi.fn()}
      />
    );

    // Open settings modal
    const settingsBtn = screen.getByTitle(/settings/i);
    fireEvent.click(settingsBtn);

    expect(screen.getByText("SETTINGS")).toBeInTheDocument();
    expect(screen.getByText("Default Theme")).toBeInTheDocument();

    // Click "Light" preference
    const lightOptionBtn = screen.getByRole("button", { name: /^light$/i });
    fireEvent.click(lightOptionBtn);
    expect(mockUpdateDefault).toHaveBeenCalledWith("light");

    // Click "System" preference
    const systemOptionBtn = screen.getByRole("button", { name: /^system$/i });
    fireEvent.click(systemOptionBtn);
    expect(mockUpdateDefault).toHaveBeenCalledWith("system");
  });

  it("toggles animations enabled/disabled in Settings", () => {
    render(
      <AnimationProvider>
        <AgentHeader
          agentName="Agent Akib"
          totalXp={450}
          streak={5}
          currentTheme="dark"
          defaultTheme="dark"
          onToggleTheme={vi.fn()}
          onUpdateDefaultTheme={vi.fn()}
          onQuickAdd={vi.fn()}
          onLogout={vi.fn()}
        />
      </AnimationProvider>
    );

    // Open settings modal
    const settingsBtn = screen.getByTitle(/settings/i);
    fireEvent.click(settingsBtn);

    expect(screen.getByText("UI Animations")).toBeInTheDocument();

    // Toggle animations off
    const animToggleBtn = screen.getByRole("button", { name: "ON" });
    fireEvent.click(animToggleBtn);

    expect(localStorage.getItem("op_me_animations_enabled")).toBe("false");
  });

  it("AnimatedCounter immediately sets final value when reduced-motion / animations are disabled", () => {
    // When animations are disabled, AnimatedCounter should render the final value immediately without lag
    const ConsumerComponent = () => {
      const { setAnimationsEnabled } = useAnimations();
      React.useEffect(() => {
        setAnimationsEnabled(false);
      }, [setAnimationsEnabled]);

      return (
        <div>
          <AnimatedCounter value={250} />
        </div>
      );
    };

    render(
      <AnimationProvider>
        <ConsumerComponent />
      </AnimationProvider>
    );

    expect(screen.getByText("250")).toBeInTheDocument();
  });

  it("Settings > Data tab provides export and requires typing RESET to confirm progress reset", async () => {
    const mockReset = vi.fn().mockResolvedValue({ success: true });

    render(
      <AgentHeader
        agentName="Agent Akib"
        totalXp={0}
        streak={0}
        currentTheme="dark"
        defaultTheme="dark"
        onToggleTheme={vi.fn()}
        onUpdateDefaultTheme={vi.fn()}
        onQuickAdd={vi.fn()}
        onLogout={vi.fn()}
        onResetAllProgress={mockReset}
      />
    );

    // Open settings modal
    const settingsBtn = screen.getByTitle(/settings/i);
    fireEvent.click(settingsBtn);

    // Switch to Data tab
    const dataTabBtn = screen.getByRole("button", { name: "Data" });
    fireEvent.click(dataTabBtn);

    expect(screen.getByText("Reset All Progress")).toBeInTheDocument();
    expect(screen.getByText("Export all data first before resetting")).toBeInTheDocument();

    const resetBtn = screen.getByRole("button", { name: /Reset all progress/i });
    expect(resetBtn).toBeDisabled();

    // Type incorrect confirmation
    const confirmInput = screen.getByPlaceholderText("RESET");
    fireEvent.change(confirmInput, { target: { value: "NO" } });
    expect(resetBtn).toBeDisabled();

    // Type correct confirmation
    fireEvent.change(confirmInput, { target: { value: "RESET" } });
    expect(resetBtn).not.toBeDisabled();

    // Click reset
    fireEvent.click(resetBtn);
    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it("Settings > Data tab displays error alert if resetAllProgress fails", async () => {
    const mockFailedReset = vi.fn().mockResolvedValue({
      success: false,
      error: "Failed to reset cloud tables: [cf_log]: RLS Policy Denied",
    });

    render(
      <AgentHeader
        agentName="Agent Akib"
        totalXp={0}
        streak={0}
        currentTheme="dark"
        defaultTheme="dark"
        onToggleTheme={vi.fn()}
        onUpdateDefaultTheme={vi.fn()}
        onQuickAdd={vi.fn()}
        onLogout={vi.fn()}
        onResetAllProgress={mockFailedReset}
      />
    );

    // Open settings modal
    const settingsBtn = screen.getByTitle(/settings/i);
    fireEvent.click(settingsBtn);

    // Switch to Data tab
    const dataTabBtn = screen.getByRole("button", { name: "Data" });
    fireEvent.click(dataTabBtn);

    const confirmInput = screen.getByPlaceholderText("RESET");
    fireEvent.change(confirmInput, { target: { value: "RESET" } });

    const resetBtn = screen.getByRole("button", { name: /Reset all progress/i });
    fireEvent.click(resetBtn);

    expect(mockFailedReset).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Failed to reset cloud tables: [cf_log]: RLS Policy Denied"
    );
  });
});
