import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginPage } from "../auth/LoginPage";

describe("LoginPage Component - Cloud Isolation & Hardened Auth", () => {
  it("in cloud mode: removes direct-access bypass button and removes sign-up link entirely", () => {
    render(
      <LoginPage
        onLogin={vi.fn()}
        onGuestBypass={vi.fn()}
        isSupabaseConnected={true}
      />
    );

    // Header and normal placeholders
    expect(screen.getByText("OPERATION: ME")).toBeInTheDocument();
    expect(screen.getByText("Agent Authorization")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("••••••••••••")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Authenticate/i })).toBeInTheDocument();

    // STRICT CHECK: Direct Access button MUST NOT exist in cloud mode
    expect(screen.queryByRole("button", { name: /Direct Access/i })).toBeNull();
    expect(screen.queryByText(/Direct Access/i)).toBeNull();

    // STRICT CHECK: Sign up link MUST NOT exist (single-user app)
    expect(screen.queryByText(/Sign up/i)).toBeNull();
    expect(screen.queryByText(/Need an account/i)).toBeNull();

    // Cloud mode indicator
    expect(screen.getByText(/Cloud Mode/i)).toBeInTheDocument();
  });

  it("in local mode: keeps Direct Access clearly labeled with Local Mode notice", async () => {
    const user = userEvent.setup();
    const mockBypass = vi.fn();

    render(
      <LoginPage
        onLogin={vi.fn()}
        onGuestBypass={mockBypass}
        isSupabaseConnected={false}
      />
    );

    const bypassBtn = screen.getByRole("button", { name: /Direct Access \(Local Mode\)/i });
    expect(bypassBtn).toBeInTheDocument();
    expect(screen.getByText(/Local mode: data stays on this device/i)).toBeInTheDocument();

    await user.click(bypassBtn);
    expect(mockBypass).toHaveBeenCalledTimes(1);
  });

  it("submits login form and calls onLogin with entered email and password", async () => {
    const user = userEvent.setup();
    const mockLogin = vi.fn().mockResolvedValue({ success: true });

    render(
      <LoginPage
        onLogin={mockLogin}
        onGuestBypass={vi.fn()}
        isSupabaseConnected={true}
      />
    );

    const emailInput = screen.getByPlaceholderText("you@example.com");
    const passwordInput = screen.getByPlaceholderText("••••••••••••");
    const submitBtn = screen.getByRole("button", { name: /Authenticate/i });

    await user.type(emailInput, "akib@example.com");
    await user.type(passwordInput, "secret-pass-2026");
    await user.click(submitBtn);

    expect(mockLogin).toHaveBeenCalledWith("akib@example.com", "secret-pass-2026");
  });

  it("displays themed error banner when wrong password or credentials are submitted", async () => {
    const user = userEvent.setup();
    const mockLogin = vi.fn().mockResolvedValue({
      success: false,
      error: "Invalid login credentials. Access denied.",
    });

    render(
      <LoginPage
        onLogin={mockLogin}
        onGuestBypass={vi.fn()}
        isSupabaseConnected={true}
      />
    );

    const emailInput = screen.getByPlaceholderText("you@example.com");
    const passwordInput = screen.getByPlaceholderText("••••••••••••");
    const submitBtn = screen.getByRole("button", { name: /Authenticate/i });

    await user.type(emailInput, "akib@example.com");
    await user.type(passwordInput, "wrong-password");
    await user.click(submitBtn);

    await waitFor(() => {
      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent("Invalid login credentials. Access denied.");
    });
  });

  it("forgot password link requires email and calls onResetPassword with success notice", async () => {
    const user = userEvent.setup();
    const mockResetPassword = vi.fn().mockResolvedValue({
      success: true,
      message: "Password recovery link dispatched to your inbox.",
    });

    render(
      <LoginPage
        onLogin={vi.fn()}
        onResetPassword={mockResetPassword}
        onGuestBypass={vi.fn()}
        isSupabaseConnected={true}
      />
    );

    const forgotBtn = screen.getByRole("button", { name: /Forgot password\?/i });
    
    // 1. Click without typing email -> prompts user
    await user.click(forgotBtn);
    expect(screen.getByRole("alert")).toHaveTextContent("Please enter your email address to reset password.");
    expect(mockResetPassword).not.toHaveBeenCalled();

    // 2. Type email and click again -> calls reset and shows success status
    const emailInput = screen.getByPlaceholderText("you@example.com");
    await user.type(emailInput, "operative@agency.org");
    await user.click(forgotBtn);

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith("operative@agency.org");
      const status = screen.getByRole("status");
      expect(status).toHaveTextContent("Password recovery link dispatched to your inbox.");
    });
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

    const passwordInput = screen.getByPlaceholderText("••••••••••••") as HTMLInputElement;
    expect(passwordInput.type).toBe("password");

    const toggleBtn = screen.getByTitle("Show password");
    await user.click(toggleBtn);
    expect(passwordInput.type).toBe("text");

    const hideBtn = screen.getByTitle("Hide password");
    await user.click(hideBtn);
    expect(passwordInput.type).toBe("password");
  });
});
