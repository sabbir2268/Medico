import * as admin from '../services/admin.service.js';
import { salesReportToCsv, salesReportToPdf } from '../services/report.service.js';
import { listAuditLogs } from '../services/audit.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendPaginated, sendSuccess } from '../utils/apiResponse.js';

const q = (req) => req.validated.query;
const b = (req) => req.validated.body;
const actor = (req) => req.user._id;

const paginated = (res, result, message) =>
  sendPaginated(res, { items: result.items, pagination: result.pagination, message });

export const dashboard = asyncHandler(async (req, res) =>
  sendSuccess(res, { message: 'Admin dashboard retrieved.', data: await admin.getDashboard() }),
);

export const analytics = asyncHandler(async (req, res) =>
  sendSuccess(res, { message: 'Analytics retrieved.', data: await admin.getAnalytics(q(req)) }),
);

export const listUsers = asyncHandler(async (req, res) =>
  paginated(res, await admin.listUsers(q(req)), 'Users retrieved.'),
);

export const updateUserRole = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    message: 'User role updated.',
    data: { user: await admin.updateUserRole(actor(req), req.params.id, b(req).role, req) },
  }),
);

export const updateUserStatus = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    message: b(req).isActive ? 'User unblocked.' : 'User blocked.',
    data: { user: await admin.updateUserStatus(actor(req), req.params.id, b(req).isActive, req) },
  }),
);

export const deleteUser = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    message: 'User removed.',
    data: await admin.deleteUser(actor(req), req.params.id, req),
  }),
);

export const listSellers = asyncHandler(async (req, res) =>
  paginated(res, await admin.listSellers(q(req)), 'Sellers retrieved.'),
);

export const updateSellerStatus = asyncHandler(async (req, res) => {
  const { sellerStatus, reason } = b(req);
  return sendSuccess(res, {
    message: 'Seller status updated.',
    data: {
      seller: await admin.updateSellerStatus(actor(req), req.params.id, sellerStatus, reason, req),
    },
  });
});

export const listCategories = asyncHandler(async (req, res) =>
  paginated(res, await admin.listCategories(q(req)), 'Categories retrieved.'),
);

export const createCategory = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    statusCode: 201,
    message: 'Category created.',
    data: { category: await admin.createCategory(actor(req), b(req), req) },
  }),
);

export const updateCategory = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    message: 'Category updated.',
    data: { category: await admin.updateCategory(actor(req), req.params.id, b(req), req) },
  }),
);

export const deleteCategory = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    message: 'Category deleted.',
    data: await admin.deleteCategory(actor(req), req.params.id, req),
  }),
);

export const listMedicines = asyncHandler(async (req, res) =>
  paginated(res, await admin.listMedicines(q(req)), 'Medicines retrieved.'),
);

export const updateMedicineStatus = asyncHandler(async (req, res) => {
  const { status, reason } = b(req);
  return sendSuccess(res, {
    message: 'Medicine status updated.',
    data: {
      medicine: await admin.updateMedicineStatus(actor(req), req.params.id, status, reason, req),
    },
  });
});

export const listOrders = asyncHandler(async (req, res) =>
  paginated(res, await admin.listOrders(q(req)), 'Orders retrieved.'),
);

export const listPayments = asyncHandler(async (req, res) =>
  paginated(res, await admin.listPayments(q(req)), 'Payments retrieved.'),
);

export const salesReport = asyncHandler(async (req, res) => {
  const report = await admin.getSalesReport(q(req));
  const format = String(req.query.format ?? 'json').toLowerCase();

  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="medico-sales-report.csv"');
    return res.send(salesReportToCsv(report));
  }
  if (format === 'pdf') {
    const pdf = await salesReportToPdf(report);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="medico-sales-report.pdf"');
    return res.send(pdf);
  }
  return sendSuccess(res, { message: 'Sales report retrieved.', data: report });
});

export const listAdvertisements = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    message: 'Advertisements retrieved.',
    data: { items: await admin.listAdvertisements() },
  }),
);

export const updateAdvertisementStatus = asyncHandler(async (req, res) => {
  const { status, reason } = b(req);
  return sendSuccess(res, {
    message: 'Advertisement reviewed.',
    data: {
      advertisement: await admin.updateAdvertisementStatus(
        actor(req),
        req.params.id,
        status,
        reason,
        req,
      ),
    },
  });
});

export const listHealthTips = asyncHandler(async (req, res) =>
  paginated(res, await admin.listHealthTips(q(req)), 'Health tips retrieved.'),
);

export const createHealthTip = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    statusCode: 201,
    message: 'Health tip created.',
    data: { healthTip: await admin.createHealthTip(actor(req), b(req), req) },
  }),
);

export const updateHealthTip = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    message: 'Health tip updated.',
    data: { healthTip: await admin.updateHealthTip(actor(req), req.params.id, b(req), req) },
  }),
);

export const deleteHealthTip = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    message: 'Health tip deleted.',
    data: await admin.deleteHealthTip(actor(req), req.params.id, req),
  }),
);

export const auditLogs = asyncHandler(async (req, res) => {
  const result = await listAuditLogs({ page: q(req).page, limit: q(req).limit });
  return paginated(res, result, 'Audit logs retrieved.');
});
