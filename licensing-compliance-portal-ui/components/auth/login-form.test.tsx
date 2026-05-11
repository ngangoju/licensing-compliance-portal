import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LoginForm } from "@/components/auth/login-form";

const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
    refresh,
  }),
}));

describe("LoginForm", () => {
  it("shows backend validation errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: { message: "Invalid email or password" } }),
      }),
    );

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "applicant@kcb.rw" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "wrong" },
    });
    fireEvent.submit(screen.getByRole("button", { name: /sign in/i }));

    await screen.findByText("Invalid email or password");
  });

  it("redirects to the correct workspace on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ user: { role: "APPLICANT" } }),
      }),
    );

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "applicant@kcb.rw" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "Test@1234" },
    });
    fireEvent.submit(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/applicant/dashboard");
      expect(refresh).toHaveBeenCalled();
    });
  });
});
