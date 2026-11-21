import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROLES } from "@/constants/roles";
import { RoleRoute } from "./index";

const authState = vi.hoisted(() => ({ value: {} }));

vi.mock("@/features/auth/hooks/useAuth", () => ({
  useAuth: () => authState.value,
}));

function renderRoleRoute(user) {
  authState.value = { user, loading: false };

  render(
    <MemoryRouter initialEntries={["/seller"]}>
      <Routes>
        <Route element={<RoleRoute allowedRoles={[ROLES.SELLER]} />}>
          <Route path="/seller" element={<h1>Seller tools</h1>} />
        </Route>
        <Route path="/" element={<h1>Home</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("role-protected routes", () => {
  it("allows a seller into the seller area", () => {
    renderRoleRoute({ uid: "uid-1", role: ROLES.SELLER });

    expect(screen.getByRole("heading", { name: "Seller tools" })).toBeInTheDocument();
  });

  it("redirects a regular user away from the seller area", () => {
    renderRoleRoute({ uid: "uid-2", role: ROLES.USER });

    expect(screen.getByRole("heading", { name: "Home" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Seller tools" })).not.toBeInTheDocument();
  });
});
