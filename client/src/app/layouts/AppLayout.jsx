import PublicLayout from "./PublicLayout";

/**
 * Backwards-compatible alias for the public storefront layout.
 * New routes should use PublicLayout directly.
 */
function AppLayout() {
  return <PublicLayout />;
}

export default AppLayout;
