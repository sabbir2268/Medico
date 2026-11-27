import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Navbar from "./Navbar";

const authState = vi.hoisted(() => ({ value: {} }));

vi.mock("@/features/auth/hooks/useAuth", () => ({
  useAuth: () => authState.value,
}));

function LocationProbe() {
  const location = useLocation();

  return <span data-testid="location">{location.pathname}</span>;
}

function renderNavbar() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Navbar />
      <LocationProbe />
    </MemoryRouter>,
  );
}

function setAuthenticatedUser(overrides = {}) {
  authState.value = {
    ...authState.value,
    isAuthenticated: true,
    user: {
      name: "Asha",
      email: "asha@example.com",
      photoURL: "https://example.com/asha.png",
      ...overrides,
    },
  };
}

beforeEach(() => {
  localStorage.clear();
  authState.value = {
    user: null,
    isAuthenticated: false,
    submitting: false,
    logout: vi.fn().mockResolvedValue(undefined),
  };
});

afterEach(() => {
  document.documentElement.lang = "en";
});

describe("Navbar authentication UI", () => {
  it("shows Join Us for guests and navigates to login", async () => {
    const user = userEvent.setup();
    renderNavbar();

    expect(screen.getByRole("button", { name: "Join Us" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Open profile menu" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Join Us" }));

    expect(screen.getByTestId("location")).toHaveTextContent("/login");
  });

  it("uses the Firebase profile photo and exposes the profile dropdown", async () => {
    const user = userEvent.setup();
    setAuthenticatedUser();
    renderNavbar();

    expect(screen.queryByRole("button", { name: "Join Us" })).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Asha's profile picture" })).toHaveAttribute(
      "src",
      "https://example.com/asha.png",
    );

    await user.click(screen.getByRole("button", { name: "Open profile menu" }));

    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Update Profile" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Logout" })).toBeInTheDocument();
  });

  it("shows a default avatar when there is no photo", () => {
    setAuthenticatedUser({ photoURL: "" });
    renderNavbar();

    expect(
      screen.getByRole("img", { name: "Default profile picture" }),
    ).toBeInTheDocument();
  });

  it("falls back to the default avatar when the photo fails to load", async () => {
    setAuthenticatedUser({ photoURL: "https://example.com/broken.png" });
    renderNavbar();

    fireEvent.error(screen.getByRole("img", { name: "Asha's profile picture" }));

    expect(
      await screen.findByRole("img", { name: "Default profile picture" }),
    ).toBeInTheDocument();
  });
});

describe("Navbar profile dropdown actions", () => {
  it("navigates to the profile and dashboard pages", async () => {
    const user = userEvent.setup();
    setAuthenticatedUser();
    renderNavbar();

    await user.click(screen.getByRole("button", { name: "Open profile menu" }));
    await user.click(screen.getByRole("menuitem", { name: "Update Profile" }));
    expect(screen.getByTestId("location")).toHaveTextContent("/dashboard/profile");

    await user.click(screen.getByRole("button", { name: "Open profile menu" }));
    await user.click(screen.getByRole("menuitem", { name: "Dashboard" }));
    expect(screen.getByTestId("location")).toHaveTextContent("/dashboard");
  });

  it("logs out and immediately restores the guest UI", async () => {
    const user = userEvent.setup();
    const logout = vi.fn().mockImplementation(async () => {
      authState.value = { ...authState.value, isAuthenticated: false, user: null };
    });

    setAuthenticatedUser();
    authState.value.logout = logout;
    renderNavbar();

    await user.click(screen.getByRole("button", { name: "Open profile menu" }));
    await user.click(screen.getByRole("menuitem", { name: "Logout" }));

    await waitFor(() => expect(logout).toHaveBeenCalledOnce());
    expect(await screen.findByRole("button", { name: "Join Us" })).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/");
  });
});

describe("Navbar shared controls", () => {
  it("shows the cart count and applies a selected language", async () => {
    const user = userEvent.setup();
    localStorage.setItem("medico.cart", JSON.stringify([{ id: "m1", quantity: 2 }]));
    renderNavbar();

    expect(screen.getByText("2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Select language" }));
    await user.click(screen.getByRole("menuitem", { name: /Español/ }));

    expect(document.documentElement.lang).toBe("es");
  });

  it("closes the language dropdown when clicking outside", async () => {
    const user = userEvent.setup();
    renderNavbar();

    await user.click(screen.getByRole("button", { name: "Select language" }));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await user.click(document.body);

    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
  });
});
