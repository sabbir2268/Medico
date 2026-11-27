import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

/** Send the customer back to the top whenever the route changes. */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return <Outlet />;
}
