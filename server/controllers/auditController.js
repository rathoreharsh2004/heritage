const AuditLog = require('../models/AuditLog');

exports.listLogs = async (req, res, next) => {
  try {
    const { action, entityType, page = 1, limit = 50 } = req.query;
    const query = {};

    if (action && action !== 'all') query.action = action;
    if (entityType && entityType !== 'all') query.entityType = entityType;

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      logs,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

