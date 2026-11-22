import PDFDocument from 'pdfkit';
import { formatCurrency } from '../utils/format.js';

function csvCell(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function salesReportToCsv(report) {
  const header = ['Date', 'Order', 'Amount', 'Status', 'Provider'];
  const rows = report.rows.map((row) => [
    row.date,
    row.orderNumber,
    row.amount,
    row.status,
    row.provider,
  ]);
  return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
}

export function salesReportToPdf(report) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 48 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.rect(0, 0, doc.page.width, 100).fill('#0D9488');
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(22).text('MEDICO', 48, 32);
    doc.font('Helvetica').fontSize(10).fillColor('#CCFBF1').text('Sales report', 48, 62);
    doc.fontSize(10).text(new Date().toLocaleDateString('en-US'), 400, 40, { align: 'right' });

    let y = 124;
    doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(12).text('Summary', 48, y);
    doc.font('Helvetica').fontSize(10).fillColor('#64748B');
    y += 22;
    [
      ['Period', `${report.range.from ?? 'all'} to ${report.range.to ?? 'now'}`],
      ['Orders', String(report.summary.orders)],
      ['Paid payments', String(report.summary.paidPayments)],
      ['Revenue', formatCurrency(report.summary.revenue)],
    ].forEach(([label, value]) => {
      doc.text(`${label}: ${value}`, 48, y);
      y += 16;
    });

    y += 16;
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#64748B');
    doc.text('Date', 48, y, { width: 90 });
    doc.text('Order', 150, y, { width: 120 });
    doc.text('Amount', 300, y, { width: 90 });
    doc.text('Status', 410, y, { width: 100 });
    y += 18;
    doc.moveTo(48, y).lineTo(doc.page.width - 48, y).strokeColor('#E2E8F0').stroke();
    y += 8;

    doc.font('Helvetica').fontSize(9).fillColor('#0F172A');
    for (const row of report.rows.slice(0, 40)) {
      if (y > doc.page.height - 70) {
        doc.addPage();
        y = 48;
      }
      doc.text(row.date, 48, y, { width: 90 });
      doc.text(row.orderNumber, 150, y, { width: 120 });
      doc.text(formatCurrency(row.amount), 300, y, { width: 90 });
      doc.text(row.status, 410, y, { width: 100 });
      y += 16;
    }

    doc.font('Helvetica').fontSize(8).fillColor('#64748B').text(
      'Generated from verified Stripe payment records. Historical records are immutable.',
      48,
      doc.page.height - 50,
      { width: 500, align: 'center' },
    );
    doc.end();
  });
}
