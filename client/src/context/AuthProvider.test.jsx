import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROLES } from "@/constants/roles";
import { useAuth } from "@/features/auth/hooks/useAuth";
import * as services from "@/features/auth/services/authServices";
import { AuthProvider } from "./AuthProvider";

const customer = {
  uid: "user-1",
  id: "user-1",
  name: "Ada Lovelace",
  email: "ada@example.com",
  photoURL: null,
  role: ROLES.CUSTOMER,
  emailVerified: false,
};

const seller = { ...customer, role: ROLES.VENDOR, name: "Ada Seller" };

vi.mock("firebase/auth", () => ({
  onAuthStateChanged: vi.fn(() => () => {}),
}));

vi.mock("@/config/firebase", () => ({ auth: null }));

vi.mock("@/lib/api", () => ({
  setAccessTokenGetter: vi.fn(),
  setUnauthorizedHandler: vi.fn(),
}));

vi.mock("@/features/auth/services/authServices", () => ({
  clearStoredBackendToken: vi.fn(),
  createFallbackSession: vi.fn(),
  getStoredBackendToken: vi.fn(() => null),
  loginWithEmail: vi.fn(),
  logoutUser: vi.fn(),
  registerWithEmail: vi.fn(),
  resolveSession: vi.fn(),
  signInWithProvider: vi.fn(),
  updateProfileDetails: vi.fn(),
  uploadAvatar: vi.fn(),
}));

function Harness() {
  const { user, loading, login, register, loginWithProvider, logout, updateProfile } =
    useAuth();

  return (
    <div>
      <p data-testid="state">
        {loading ? "loading" : user ? `${user.name}:${user.role}` : "guest"}
      </p>
      <button
        type="button"
        onClick={() => login({ email: "ada@example.com", password: "secret" })}
      >
        Login
      </button>
      <button
        type="button"
        onClick={() =>
          register({
            name: "Ada Seller",
            email: "seller@example.com",
            password: "secret123",
            role: ROLES.VENDOR,
          })
        }
      >
        Register
      </button>
      <button type="button" onClick={() => loginWithProvider("google")}>
        Google
      </button>
      <button
        type="button"
        onClick={() => updateProfile({ name: "Ada Updated", photoURL: "" })}
      >
        Update
      </button>
      <button type="button" onClick={logout}>
        Logout
      </button>
    </div>
  );
}

function renderHarness() {
  render(
    <AuthProvider>
      <Harness />
    </AuthProvider>,
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    services.loginWithEmail.mockResolvedValue({ user: customer, token: "jwt" });
    services.registerWithEmail.mockResolvedValue({ user: seller, token: "jwt" });
    services.signInWithProvider.mockResolvedValue({
      user: customer,
      token: "jwt",
    });
    services.updateProfileDetails.mockResolvedValue({
      ...customer,
      name: "Ada Updated",
    });
    services.logoutUser.mockResolvedValue();
  });

  it("starts as a guest when Firebase is not configured", () => {
    renderHarness();

    expect(screen.getByTestId("state")).toHaveTextContent("guest");
  });

  it("applies the user returned by email login", async () => {
    renderHarness();

    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() =>
      expect(screen.getByTestId("state")).toHaveTextContent("Ada Lovelace:customer"),
    );
    expect(services.loginWithEmail).toHaveBeenCalledWith({
      email: "ada@example.com",
      password: "secret",
    });
  });

  it("applies the seller role returned by registration", async () => {
    renderHarness();

    fireEvent.click(screen.getByRole("button", { name: "Register" }));

    await waitFor(() =>
      expect(screen.getByTestId("state")).toHaveTextContent("Ada Seller:vendor"),
    );
  });

  it("applies the default customer session returned by social login", async () => {
    renderHarness();

    fireEvent.click(screen.getByRole("button", { name: "Google" }));

    await waitFor(() =>
      expect(screen.getByTestId("state")).toHaveTextContent("Ada Lovelace:customer"),
    );
    expect(services.signInWithProvider).toHaveBeenCalledWith("google");
  });

  it("updates the profile in context", async () => {
    renderHarness();

    fireEvent.click(screen.getByRole("button", { name: "Login" }));
    await waitFor(() =>
      expect(screen.getByTestId("state")).toHaveTextContent("customer"),
    );

    fireEvent.click(screen.getByRole("button", { name: "Update" }));

    await waitFor(() =>
      expect(screen.getByTestId("state")).toHaveTextContent("Ada Updated:customer"),
    );
  });

  it("clears the user on logout", async () => {
    renderHarness();

    fireEvent.click(screen.getByRole("button", { name: "Login" }));
    await waitFor(() =>
      expect(screen.getByTestId("state")).toHaveTextContent("customer"),
    );

    fireEvent.click(screen.getByRole("button", { name: "Logout" }));

    await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("guest"));
  });
});
