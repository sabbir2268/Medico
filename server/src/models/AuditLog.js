import { Schema, model } from 'mongoose';

const auditLogSchema = new Schema(
  {
    admin: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: { type: String, required: true, index: true },
    targetType: { type: String, required: true },
    targetId: { type: String, default: '' },
    details: { type: Schema.Types.Mixed, default: {} },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },
  },
  { timestamps: true },
);

auditLogSchema.index({ admin: 1, createdAt: -1 });

export const AuditLog = model('AuditLog', auditLogSchema);
