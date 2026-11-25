import { render, screen, waitFor } from "@testing-library/react";
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

  it("renders the forgot password page for guests", () => {
    renderRoute("/forgot-password");

    expect(
      screen.getByRole("heading", { level: 1, name: "Forgot password" }),
    ).toBeInTheDocument();
  });

  it("renders the shop page for guests", async () => {
    renderRoute("/shop");

    expect(
      await screen.findByRole("heading", { level: 1, name: "Shop medicines" }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByLabelText("Search medicines")).toBeInTheDocument(),
    );
  });

  it("renders the categories page for guests", async () => {
    renderRoute("/categories");

    expect(
      await screen.findByRole("heading", { level: 1, name: "Medicine categories" }),
    ).toBeInTheDocument();
  });

  it("renders medicines for a single category", async () => {
    renderRoute("/categories/cat-otc");

    expect(
      await screen.findByRole("heading", { level: 1, name: "Over-the-Counter" }),
    ).toBeInTheDocument();
  });

  it("redirects unauthenticated dashboard visits to login", () => {
    renderRoute("/dashboard");

    expect(screen.getByRole("heading", { level: 1, name: "Login" })).toBeInTheDocument();
  });

  it("redirects unauthenticated cart visits to login", () => {
    renderRoute("/cart");

    expect(screen.getByRole("heading", { level: 1, name: "Login" })).toBeInTheDocument();
  });

  it("renders the not-found page inside the public layout", () => {
    renderRoute("/missing-page");

    expect(
      screen.getByRole("heading", { level: 1, name: "Page not found" }),
    ).toBeInTheDocument();
  });
});
