import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { QueryProvider } from "./providers/QueryProvider";
import { AuthContext } from "@/context/authContext.jsx";
import { routes } from "./routes";
import { ROLES } from "@/constants/roles";

vi.mock("@/features/admin/services/adminServices", async (importOriginal) => {
  const actual = await importOriginal();
  const list = {
    items: [],
    pagination: { page: 1, limit: 10, total: 0, totalPages: 1, hasNext: false, hasPrev: false },
  };
  return {
    ...actual,
    fetchUsers: () => Promise.resolve(list),
    fetchSellers: () => Promise.resolve(list),
    fetchCategories: () => Promise.resolve(list),
    fetchMedicines: () => Promise.resolve(list),
    fetchOrders: () => Promise.resolve(list),
    fetchPayments: () => Promise.resolve(list),
    fetchAuditLogs: () => Promise.resolve(list),
    fetchHealthTips: () => Promise.resolve(list),
    fetchAdvertisements: () => Promise.resolve([]),
    fetchDashboard: () => Promise.resolve({}),
    fetchAnalytics: () => Promise.resolve({ series: [] }),
  };
});

const authValue = {
  user: { id: "u1", email: "admin@test.com", name: "Admin", role: ROLES.ADMIN },
  loading: false,
  isAuthenticated: true,
  role: ROLES.ADMIN,
  isAdmin: true,
  hasRole: () => true,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
};

const cases = [
  ["/dashboard/admin", "Platform overview"],
  ["/dashboard/admin/users", "User management"],
  ["/dashboard/admin/sellers", "Seller management"],
  ["/dashboard/admin/categories", "Category management"],
  ["/dashboard/admin/medicines", "Medicine management"],
  ["/dashboard/admin/orders", "Order management"],
  ["/dashboard/admin/payments", "Payment management"],
  ["/dashboard/admin/reports", "Sales reports"],
  ["/dashboard/admin/advertisements", "Advertisement management"],
  ["/dashboard/admin/health-tips", "Health tips"],
  ["/dashboard/admin/audit", "Audit log"],
];

describe("admin dashboard pages", () => {
  it.each(cases)("renders %s", async (path, heading) => {
    const router = createMemoryRouter(routes, { initialEntries: [path] });
    render(
      <QueryProvider>
        <AuthContext.Provider value={authValue}>
          <RouterProvider router={router} />
        </AuthContext.Provider>
      </QueryProvider>,
    );
    expect((await screen.findAllByText(heading, {}, { timeout: 5000 })).length).toBeGreaterThan(0);
    expect(screen.queryByText("Page not found")).toBeNull();
  });
});
