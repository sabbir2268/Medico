import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROLES } from "@/constants/roles";
import ForgotPassword from "./ForgotPassword";
import Login from "./Login";
import Profile from "./Profile";
import Register from "./Register";

const authState = vi.hoisted(() => ({ value: {} }));

vi.mock("@/features/auth/hooks/useAuth", () => ({
  useAuth: () => authState.value,
}));

function renderPage(page) {
  return render(<MemoryRouter>{page}</MemoryRouter>);
}

beforeEach(() => {
  const session = { user: { uid: "uid-1" }, token: "backend-jwt" };

  authState.value = {
    user: {
      uid: "uid-1",
      username: "Asha",
      name: "Asha",
      email: "asha@example.com",
      photoURL: "https://example.com/asha.png",
      role: ROLES.SELLER,
      provider: "password",
      emailVerified: true,
    },
    submitting: false,
    login: vi.fn().mockResolvedValue(session),
    register: vi.fn().mockResolvedValue(session),
    loginWithGoogle: vi.fn().mockResolvedValue(session),
    loginWithGitHub: vi.fn().mockResolvedValue(session),
    updateProfile: vi.fn().mockResolvedValue(session),
    changePassword: vi.fn().mockResolvedValue(true),
    resetPassword: vi.fn().mockResolvedValue(true),
    uploadPhoto: vi.fn().mockResolvedValue("https://example.com/new.png"),
    logout: vi.fn().mockResolvedValue(undefined),
  };
});

describe("login page", () => {
  it("validates input and signs in with email and password", async () => {
    const user = userEvent.setup();
    authState.value.user = null;
    renderPage(<Login />);

    await user.type(screen.getByLabelText("Email"), "bad-email");
    await user.type(screen.getByLabelText("Password"), "x");
    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(await screen.findByText("Enter a valid email address")).toBeInTheDocument();
    expect(authState.value.login).not.toHaveBeenCalled();

    await user.clear(screen.getByLabelText("Email"));
    await user.type(screen.getByLabelText("Email"), "asha@example.com");
    await user.clear(screen.getByLabelText("Password"));
    await user.type(screen.getByLabelText("Password"), "StrongPass1");
    await user.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() =>
      expect(authState.value.login).toHaveBeenCalledWith({
        email: "asha@example.com",
        password: "StrongPass1",
      }),
    );
  });

  it("offers Google and GitHub sign-in", async () => {
    const user = userEvent.setup();
    authState.value.user = null;
    renderPage(<Login />);

    await user.click(screen.getByRole("button", { name: "Google" }));
    await user.click(screen.getByRole("button", { name: "GitHub" }));

    expect(authState.value.loginWithGoogle).toHaveBeenCalledOnce();
    expect(authState.value.loginWithGitHub).toHaveBeenCalledOnce();
  });
});

describe("forgot password page", () => {
  it("sends a reset link and shows a confirmation", async () => {
    const user = userEvent.setup();
    authState.value.user = null;
    renderPage(<ForgotPassword />);

    await user.type(screen.getByLabelText("Email"), "asha@example.com");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    await waitFor(() =>
      expect(authState.value.resetPassword).toHaveBeenCalledWith("asha@example.com"),
    );
    expect(
      await screen.findByRole("heading", { level: 1, name: "Check your email" }),
    ).toBeInTheDocument();
  });
});

describe("registration page", () => {
  it("only exposes user and seller roles and registers the selected role", async () => {
    const user = userEvent.setup();
    authState.value.user = null;
    renderPage(<Register />);

    expect(screen.queryByRole("radio", { name: /admin/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: /seller/i }));
    await user.type(screen.getByLabelText("Username"), "Asha Patel");
    await user.type(screen.getByLabelText("Email"), "asha@example.com");
    await user.type(screen.getByLabelText("Password"), "StrongPass1");
    await user.type(screen.getByLabelText("Confirm password"), "StrongPass1");
    await user.click(screen.getByRole("button", { name: "Register" }));

    await waitFor(() =>
      expect(authState.value.register).toHaveBeenCalledWith(
        expect.objectContaining({ role: ROLES.SELLER }),
      ),
    );
  });

  it("blocks weak passwords before calling the auth action", async () => {
    const user = userEvent.setup();
    authState.value.user = null;
    renderPage(<Register />);

    await user.type(screen.getByLabelText("Username"), "Asha Patel");
    await user.type(screen.getByLabelText("Email"), "asha@example.com");
    await user.type(screen.getByLabelText("Password"), "weak");
    await user.type(screen.getByLabelText("Confirm password"), "weak");
    await user.click(screen.getByRole("button", { name: "Register" }));

    expect(await screen.findByText("Use at least 8 characters")).toBeInTheDocument();
    expect(authState.value.register).not.toHaveBeenCalled();
  });
});

describe("profile page", () => {
  it("loads account details and saves profile changes", async () => {
    const user = userEvent.setup();
    renderPage(<Profile />);

    expect(screen.getByLabelText("Username")).toHaveValue("Asha");
    expect(screen.getByText("seller")).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Username"));
    await user.type(screen.getByLabelText("Username"), "Asha New");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() =>
      expect(authState.value.updateProfile).toHaveBeenCalledWith(
        expect.objectContaining({ username: "Asha New" }),
      ),
    );
  });

  it("changes the password and signs out", async () => {
    const user = userEvent.setup();
    renderPage(<Profile />);

    await user.type(screen.getByLabelText("Current password"), "OldPass1");
    await user.type(screen.getByLabelText("New password"), "NewPass1");
    await user.type(screen.getByLabelText("Confirm new password"), "NewPass1");
    await user.click(screen.getByRole("button", { name: "Update password" }));

    await waitFor(() =>
      expect(authState.value.changePassword).toHaveBeenCalledWith({
        currentPassword: "OldPass1",
        newPassword: "NewPass1",
        confirmPassword: "NewPass1",
      }),
    );

    await user.click(screen.getByRole("button", { name: /log out/i }));
    expect(authState.value.logout).toHaveBeenCalledOnce();
  });
});
