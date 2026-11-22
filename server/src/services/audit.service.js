import { AuditLog } from '../models/AuditLog.js';

/** Records sensitive admin actions. Never include secrets in `details`. */
export async function recordAudit({ adminId, action, targetType, targetId = '', details = {}, req }) {
  return AuditLog.create({
    admin: adminId,
    action,
    targetType,
    targetId: String(targetId ?? ''),
    details,
    ip: req?.ip ?? '',
    userAgent: String(req?.headers?.['user-agent'] ?? '').slice(0, 300),
  });
}

export async function listAuditLogs({ page = 1, limit = 20 } = {}) {
  const [total, items] = await Promise.all([
    AuditLog.countDocuments({}),
    AuditLog.find({})
      .populate('admin', 'username email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
  ]);
  return { items, total, page, limit };
}
