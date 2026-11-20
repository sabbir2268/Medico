import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { routes } from "./routes";
import { AppProviders } from "./providers/AppProviders";

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
      screen.getByRole("heading", { level: 1, name: /ready-to-use react starter kit/i }),
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
