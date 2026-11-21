import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROLES } from "@/constants/roles";
import RoleRoute from "./RoleRoute";

const authState = vi.hoisted(() => ({
  current: { user: null, loading: false },
}));

vi.mock("@/features/auth/hooks/useAuth", () => ({
  useAuth: () => authState.current,
}));

function renderRoute() {
  render(
    <MemoryRouter initialEntries={["/seller"]}>
      <Routes>
        <Route
          element={<RoleRoute allowedRoles={[ROLES.VENDOR]} redirectTo="/dashboard" />}
        >
          <Route path="/seller" element={<p>Seller area</p>} />
        </Route>
        <Route path="/dashboard" element={<p>Dashboard area</p>} />
        <Route path="/login" element={<p>Login area</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("RoleRoute", () => {
  beforeEach(() => {
    authState.current = { user: null, loading: false };
  });

  it("redirects guests to login", () => {
    renderRoute();

    expect(screen.getByText("Login area")).toBeInTheDocument();
  });

  it("redirects users without the required role", () => {
    authState.current = {
      user: { uid: "1", role: ROLES.CUSTOMER },
      loading: false,
    };

    renderRoute();

    expect(screen.getByText("Dashboard area")).toBeInTheDocument();
  });

  it("renders the route for an allowed role", () => {
    authState.current = {
      user: { uid: "1", role: ROLES.VENDOR },
      loading: false,
    };

    renderRoute();

    expect(screen.getByText("Seller area")).toBeInTheDocument();
  });

  it("shows a loader while auth is initializing", () => {
    authState.current = { user: null, loading: true };

    renderRoute();

    expect(screen.getByRole("status")).toHaveTextContent("Checking permissions...");
  });
});
