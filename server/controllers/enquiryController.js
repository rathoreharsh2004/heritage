const Enquiry = require('../models/Enquiry');
const AuditLog = require('../models/AuditLog');

// Public form submission
exports.submitEnquiry = async (req, res, next) => {
  try {
    const { name, phone, email, projectType, message } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Name and phone number are required' });
    }

    const enquiry = await Enquiry.create({
      name,
      phone,
      email,
      projectType: projectType || 'Unspecified',
      message: message || '',
    });

    res.status(201).json({
      success: true,
      message: 'Enquiry received successfully. Our heritage consultant will contact you shortly.',
      enquiryId: enquiry._id,
    });
  } catch (err) {
    next(err);
  }
};

// Admin list enquiries
exports.listEnquiries = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { projectType: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Enquiry.countDocuments(query);
    const enquiries = await Enquiry.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      enquiries,
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

// Admin update enquiry status or notes
exports.updateEnquiry = async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    const enquiry = await Enquiry.findById(req.params.id);
    if (!enquiry) return res.status(404).json({ success: false, message: 'Enquiry not found' });

    const prev = enquiry.toObject();
    if (status) enquiry.status = status;
    if (notes !== undefined) enquiry.notes = notes;
    await enquiry.save();

    if (req.admin) {
      await AuditLog.create({
        adminEmail: req.admin.email,
        adminUsername: req.admin.username,
        action: 'UPDATE',
        entityType: 'Enquiry',
        entityId: enquiry._id.toString(),
        description: `Updated enquiry status to "${enquiry.status}" for client ${enquiry.name}`,
        changes: { previous: prev, updated: enquiry.toObject() },
        ipAddress: req.ip,
      }).catch(() => {});
    }

    res.json({ success: true, message: 'Enquiry updated successfully', enquiry });
  } catch (err) {
    next(err);
  }
};

// Admin delete enquiry
exports.deleteEnquiry = async (req, res, next) => {
  try {
    const enquiry = await Enquiry.findByIdAndDelete(req.params.id);
    if (!enquiry) return res.status(404).json({ success: false, message: 'Enquiry not found' });

    if (req.admin) {
      await AuditLog.create({
        adminEmail: req.admin.email,
        adminUsername: req.admin.username,
        action: 'DELETE',
        entityType: 'Enquiry',
        entityId: req.params.id,
        description: `Deleted enquiry from ${enquiry.name} (${enquiry.phone})`,
        ipAddress: req.ip,
      }).catch(() => {});
    }

    res.json({ success: true, message: 'Enquiry deleted successfully' });
  } catch (err) {
    next(err);
  }
};

