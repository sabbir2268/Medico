import { useState } from "react";
import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AdminPageHeader, AdminTableSkeleton } from "../components/AdminUI";
import { downloadSalesReport, fetchSalesReport } from "../services/adminServices";
import { notify } from "@/lib/notify";
import { formatPrice } from "@/lib/format";

export default function AdminReports() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setReport(await fetchSalesReport({ from: from || undefined, to: to || undefined }));
    } catch (error) {
      notify.error(error);
    } finally {
      setLoading(false);
    }
  };

  const exportFile = async (format) => {
    try {
      await downloadSalesReport(format, { from: from || undefined, to: to || undefined });
      notify.success(`${format.toUpperCase()} report downloaded.`);
    } catch (error) {
      notify.error(error);
    }
  };

  return (
    <section className="space-y-6">
      <AdminPageHeader
        eyebrow="Administration"
        title="Sales reports"
        description="Generate and export reports from verified Stripe payment records."
        actions={
          <>
            <Button variant="outline" onClick={() => exportFile("csv")}>
              <Download className="h-4 w-4" aria-hidden="true" /> CSV
            </Button>
            <Button variant="outline" onClick={() => exportFile("pdf")}>
              <FileText className="h-4 w-4" aria-hidden="true" /> PDF
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-end gap-3 rounded-card border border-line bg-surface p-5 shadow-card">
        <label className="text-sm">
          <span className="mb-1 block text-muted">From</span>
          <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="rounded-control border border-line bg-background px-3 py-2" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted">To</span>
          <input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="rounded-control border border-line bg-background px-3 py-2" />
        </label>
        <Button onClick={load} disabled={loading}>{loading ? "Generating…" : "Generate report"}</Button>
      </div>

      {loading ? (
        <AdminTableSkeleton />
      ) : report ? (
        <>
          <div className="grid gap-4 sm:grid-cols-4">
            {[
              ["Revenue", formatPrice(report.summary.revenue)],
              ["Orders", report.summary.orders],
              ["Paid", report.summary.paidPayments],
              ["Failed", report.summary.failedPayments],
            ].map(([label, value]) => (
              <div key={label} className="rounded-card border border-line bg-surface p-5 shadow-card">
                <p className="text-sm text-muted">{label}</p>
                <p className="mt-1 font-heading text-xl font-bold">{value}</p>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto rounded-card border border-line bg-surface shadow-card">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-line">
                <tr>
                  {["Date", "Order", "Amount", "Status"].map((heading) => (
                    <th key={heading} className="px-4 py-3 text-xs font-semibold tracking-wide text-muted uppercase">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {report.rows.map((row, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3">{row.date}</td>
                    <td className="px-4 py-3 font-medium">{row.orderNumber}</td>
                    <td className="px-4 py-3">{formatPrice(row.amount)}</td>
                    <td className="px-4 py-3 capitalize text-muted">{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="text-sm text-muted">Choose a date range and generate a report.</p>
      )}
    </section>
  );
}
