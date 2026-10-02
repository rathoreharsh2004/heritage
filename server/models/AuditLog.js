const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  adminEmail: {
    type: String,
    required: true,
  },
  adminUsername: {
    type: String,
    default: 'admin',
  },
  action: {
    type: String,
    required: true,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'RESTORE'],
  },
  entityType: {
    type: String,
    required: true,
  },
  entityId: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    required: true,
  },
  changes: {
    previous: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    updated: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  ipAddress: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);

