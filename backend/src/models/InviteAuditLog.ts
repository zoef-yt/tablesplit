import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IInviteAuditLog extends Document {
  _id: Types.ObjectId;
  inviteId: Types.ObjectId;
  action: 'created' | 'sent' | 'resent' | 'accepted' | 'expired' | 'cancelled';
  performedBy?: Types.ObjectId;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const inviteAuditLogSchema = new Schema<IInviteAuditLog>(
  {
    inviteId: {
      type: Schema.Types.ObjectId,
      ref: 'Invite',
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: ['created', 'sent', 'resent', 'accepted', 'expired', 'cancelled'],
      required: true,
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Index for querying audit logs by invite
inviteAuditLogSchema.index({ inviteId: 1, createdAt: -1 });

export const InviteAuditLog = mongoose.model<IInviteAuditLog>('InviteAuditLog', inviteAuditLogSchema);
