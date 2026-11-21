import { CardSkeleton } from "@/components/shared/AsyncContent";

function Line({ className = "h-3 w-full" }) {
  return <div className={`animate-pulse rounded-full bg-hover ${className}`} />;
}

export function TableSkeleton({ rows = 6 }) {
  return (
    <div aria-busy="true" aria-label="Loading medicines">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[860px] border-collapse">
          <thead>
            <tr className="border-b border-line">
              {["Image", "Medicine", "Company", "Category", "Price", "Actions"].map(
                (heading) => (
                  <th key={heading} className="px-4 py-3 text-left">
                    <Line className="h-2.5 w-16" />
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }, (_, index) => (
              <tr key={index} className="border-b border-line last:border-0">
                <td className="px-4 py-4">
                  <div className="h-14 w-14 animate-pulse rounded-control bg-hover" />
                </td>
                <td className="px-4 py-4">
                  <Line className="h-4 w-40" />
                  <Line className="mt-2 h-3 w-28" />
                </td>
                <td className="px-4 py-4">
                  <Line className="h-3 w-24" />
                </td>
                <td className="px-4 py-4">
                  <Line className="h-3 w-20" />
                </td>
                <td className="px-4 py-4">
                  <Line className="h-4 w-16" />
                </td>
                <td className="px-4 py-4">
                  <div className="flex gap-2">
                    <div className="h-9 w-9 animate-pulse rounded-control bg-hover" />
                    <div className="h-9 w-9 animate-pulse rounded-control bg-hover" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 p-3 sm:grid-cols-2 md:hidden">
        {Array.from({ length: Math.min(rows, 6) }, (_, index) => (
          <CardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
