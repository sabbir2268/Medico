import PDFDocument from 'pdfkit';
import { formatCurrency } from '../utils/format.js';

/** Builds a PDF invoice purely from immutable order snapshot data. */
export function generateInvoiceBuffer(order, user) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 48 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const brand = '#0D9488';
    const muted = '#64748B';
    let y = 48;

    doc.rect(0, 0, doc.page.width, 110).fill(brand);
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(24).text('MEDICO', 48, 38);
    doc.font('Helvetica').fontSize(10).fillColor('#CCFBF1').text('Trusted healthcare, delivered.', 48, 68);
    doc.fontSize(10).text('Invoice', 400, 40, { align: 'right' });
    doc.text(`MD-${String(order._id).slice(-8).toUpperCase()}`, 400, 58, { align: 'right' });
    y = 132;

    doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(12).text('Bill to', 48, y);
    doc.font('Helvetica').fontSize(10).fillColor(muted);
    const delivery = order.delivery;
    doc.text(delivery.fullName, 48, y + 20);
    doc.text(`${delivery.addressLine1}${delivery.addressLine2 ? `, ${delivery.addressLine2}` : ''}`, 48, y + 36);
    doc.text(`${delivery.city}, ${delivery.postalCode}, ${delivery.country}`, 48, y + 52);
    doc.text(`Phone: ${delivery.phone}`, 48, y + 68);

    doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(12).text('Order details', 320, y);
    doc.font('Helvetica').fontSize(10).fillColor(muted);
    doc.text(`Order: MD-${String(order._id).slice(-8).toUpperCase()}`, 320, y + 20);
    doc.text(`Placed: ${new Date(order.createdAt).toLocaleDateString('en-US')}`, 320, y + 36);
    doc.text(`Status: ${order.status}`, 320, y + 52);
    doc.text(`Payment: ${order.paymentStatus}`, 320, y + 68);
    if (user?.email) doc.text(`Account: ${user.email}`, 320, y + 84);
    y += 110;

    doc.moveTo(48, y).lineTo(doc.page.width - 48, y).strokeColor('#E2E8F0').stroke();
    y += 16;

    const columns = [
      { label: 'Medicine', x: 48, width: 210 },
      { label: 'Qty', x: 268, width: 45 },
      { label: 'Unit', x: 320, width: 75 },
      { label: 'Discount', x: 400, width: 70 },
      { label: 'Total', x: 470, width: 90 },
    ];
    doc.font('Helvetica-Bold').fontSize(9).fillColor(muted);
    columns.forEach((column) => doc.text(column.label, column.x, y, { width: column.width }));
    y += 18;
    doc.moveTo(48, y).lineTo(doc.page.width - 48, y).strokeColor('#E2E8F0').stroke();
    y += 10;

    doc.font('Helvetica').fontSize(9).fillColor('#0F172A');
    for (const item of order.items) {
      const name = item.name.length > 30 ? `${item.name.slice(0, 28)}...` : item.name;
      doc.text(name, 48, y, { width: 210 });
      doc.text(String(item.quantity), 268, y, { width: 45 });
      doc.text(formatCurrency(item.originalPrice), 320, y, { width: 75 });
      doc.text(`${item.discountPercent}%`, 400, y, { width: 70 });
      doc.text(formatCurrency(item.lineTotal), 470, y, { width: 90 });
      y += 20;
    }

    y += 10;
    doc.moveTo(300, y).lineTo(doc.page.width - 48, y).strokeColor('#E2E8F0').stroke();
    y += 14;

    const rows = [
      ['Subtotal', formatCurrency(order.pricing.subtotal)],
      ['Discounts', `- ${formatCurrency(order.pricing.discount)}`],
      ['Delivery', formatCurrency(order.pricing.deliveryCharge)],
    ];
    doc.fontSize(10);
    rows.forEach(([label, value]) => {
      doc.fillColor(muted).text(label, 320, y, { width: 150 });
      doc.fillColor('#0F172A').text(value, 470, y, { width: 90, align: 'right' });
      y += 18;
    });
    doc.font('Helvetica-Bold').fontSize(12).fillColor(brand).text('Total', 320, y + 4);
    doc.text(formatCurrency(order.pricing.total), 470, y + 4, { width: 90, align: 'right' });

    if (order.prescription?.required) {
      y += 44;
      doc.font('Helvetica').fontSize(9).fillColor(muted).text(
        `Prescription verification: ${order.prescription.status}. Prescriber: ${order.prescription.prescriberName || 'pending'}.`,
        48,
        y,
        { width: 500 },
      );
    }

    doc.font('Helvetica').fontSize(8).fillColor(muted).text(
      'This is a computer-generated invoice from Medico. Prices and discounts were verified by the server at checkout.',
      48,
      doc.page.height - 70,
      { width: 500, align: 'center' },
    );

    doc.end();
  });
}
