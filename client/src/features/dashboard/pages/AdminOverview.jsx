import { lazy, Suspense } from "react";
import { Loader } from "@/components/ui/Loader";

// Recharts is only needed on the admin overview, so keep it out of the main bundle.
const AdminHome = lazy(() => import("./AdminHome"));

export default function AdminOverview() {
  return (
    <Suspense fallback={<Loader label="Loading overview..." />}>
      <AdminHome />
    </Suspense>
  );
}
