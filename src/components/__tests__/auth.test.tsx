import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginPage } from "../auth/LoginPage";

describe("LoginPage Component", () => {
  it("renders login authorization page with inputs and credentials", () => {
    render(
      <LoginPage
        onLogin={vi.fn()}
        onGuestBypass={vi.fn()}
        isSupabaseConnected={false}
      />
    );

    expect(screen.getByText("OPERATION: ME")).toBeInTheDocument();
    expect(screen.getByText("Agent Authorization")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/agent\.akib@agency\.internal/i)).toBeInTheDocument();
    expect(screen.getByText("Authenticate")).toBeInTheDocument();
    expect(screen.getByText(/Direct Access as Agent Akib/i)).toBeInTheDocument();
  });

  it("submits login form and calls onLogin with email and password", async () => {
    const user = userEvent.setup();
    const mockLogin = vi.fn().mockResolvedValue({ success: true });

    render(
      <LoginPage
        onLogin={mockLogin}
        onGuestBypass={vi.fn()}
        isSupabaseConnected={true}
      />
    );

    const emailInput = screen.getByPlaceholderText(/agent\.akib@agency\.internal/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••••••/i);
    const submitBtn = screen.getByText("Authenticate");

    await user.clear(emailInput);
    await user.type(emailInput, "test.akib@hq.internal");
    await user.clear(passwordInput);
    await user.type(passwordInput, "correct-pass");
    await user.click(submitBtn);

    expect(mockLogin).toHaveBeenCalledWith("test.akib@hq.internal", "correct-pass", false);
  });

  it("displays error message banner when onLogin returns an error", async () => {
    const user = userEvent.setup();
    const mockLogin = vi.fn().mockResolvedValue({
      success: false,
      error: "Invalid clearance passcode. Access denied.",
    });

    render(
      <LoginPage
        onLogin={mockLogin}
        onGuestBypass={vi.fn()}
        isSupabaseConnected={true}
      />
    );

    const submitBtn = screen.getByText("Authenticate");
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Invalid clearance passcode. Access denied.")).toBeInTheDocument();
    });
  });

  it("calls onGuestBypass when direct bypass button is clicked", async () => {
    const user = userEvent.setup();
    const mockBypass = vi.fn();

    render(
      <LoginPage
        onLogin={vi.fn()}
        onGuestBypass={mockBypass}
        isSupabaseConnected={true}
      />
    );

    const bypassBtn = screen.getByText(/Direct Access as Agent Akib/i);
    await user.click(bypassBtn);

    expect(mockBypass).toHaveBeenCalledTimes(1);
  });

  it("toggles password visibility between text and password", async () => {
    const user = userEvent.setup();

    render(
      <LoginPage
        onLogin={vi.fn()}
        onGuestBypass={vi.fn()}
        isSupabaseConnected={true}
      />
    );

    const passwordInput = screen.getByPlaceholderText(/••••••••••••/i) as HTMLInputElement;
    expect(passwordInput.type).toBe("password");

    const toggleBtn = screen.getByTitle("Show password");
    await user.click(toggleBtn);
    expect(passwordInput.type).toBe("text");

    const hideBtn = screen.getByTitle("Hide password");
    await user.click(hideBtn);
    expect(passwordInput.type).toBe("password");
  });

  it("toggles between Authenticate and Sign up modes", async () => {
    const user = userEvent.setup();

    render(
      <LoginPage
        onLogin={vi.fn()}
        onGuestBypass={vi.fn()}
        isSupabaseConnected={true}
      />
    );

    const toggleModeBtn = screen.getByText(/Need an account\? Sign up/i);
    await user.click(toggleModeBtn);

    expect(screen.getByText("Register Account")).toBeInTheDocument();
    expect(screen.getByText(/Existing agent\? Sign in/i)).toBeInTheDocument();
  });
});
