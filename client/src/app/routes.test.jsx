import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { routes } from "./routes";
import { AppProviders } from "./providers/AppProviders";

vi.mock("@/features/auth/services/authServices", async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...actual,
    observeAuth: (callback) => {
      callback(null);
      return () => {};
    },
  };
});

beforeEach(() => {
  localStorage.clear();
});

function renderRoute(path) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });

  render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  );
}

describe("route configuration", () => {
  it("renders the public home page", () => {
    renderRoute("/");

    expect(
      screen.getByRole("heading", { level: 2, name: /find exactly what you need/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: /trusted picks from our pharmacy partners/i,
      }),
    ).toBeInTheDocument();
  });

  it("renders the login page for guests", () => {
    renderRoute("/login");

    expect(screen.getByRole("heading", { level: 1, name: "Login" })).toBeInTheDocument();
  });

  it("redirects unauthenticated dashboard visits to login", () => {
    renderRoute("/dashboard");

    expect(screen.getByRole("heading", { level: 1, name: "Login" })).toBeInTheDocument();
  });

  it("renders the not-found page inside the public layout", () => {
    renderRoute("/missing-page");

    expect(
      screen.getByRole("heading", { level: 1, name: "Page not found" }),
    ).toBeInTheDocument();
  });
});
