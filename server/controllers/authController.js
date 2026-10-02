const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const AuditLog = require('../models/AuditLog');

function generateToken(admin) {
  return jwt.sign(
    { id: admin._id, username: admin.username, email: admin.email, role: admin.role },
    process.env.JWT_SECRET || 'rathore_heritage_secret_jwt_key_2026_secure',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

exports.login = async (req, res, next) => {
  try {
    const { emailOrUsername, password } = req.body;
    if (!emailOrUsername || !password) {
      return res.status(400).json({ success: false, message: 'Please provide username/email and password' });
    }

    const admin = await Admin.findOne({
      $or: [
        { email: emailOrUsername.toLowerCase().trim() },
        { username: emailOrUsername.trim() },
      ],
    });

    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    admin.lastLogin = new Date();
    await admin.save();

    const token = generateToken(admin);

    // Audit log
    await AuditLog.create({
      adminEmail: admin.email,
      adminUsername: admin.username,
      action: 'LOGIN',
      entityType: 'Admin',
      entityId: admin._id.toString(),
      description: `Admin ${admin.username} logged into the dashboard`,
      ipAddress: req.ip || req.connection.remoteAddress,
    }).catch(err => console.error('AuditLog error:', err.message));

    res.json({
      success: true,
      message: 'Login successful',
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        lastLogin: admin.lastLogin,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res) => {
  res.json({
    success: true,
    admin: req.admin,
  });
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
    }

    const admin = await Admin.findById(req.admin._id);
    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password does not match' });
    }

    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(newPassword, salt);
    await admin.save();

    await AuditLog.create({
      adminEmail: admin.email,
      adminUsername: admin.username,
      action: 'UPDATE',
      entityType: 'Admin',
      entityId: admin._id.toString(),
      description: `Admin ${admin.username} updated their password`,
      ipAddress: req.ip || req.connection.remoteAddress,
    }).catch(err => console.error('AuditLog error:', err.message));

    res.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (err) {
    next(err);
  }
};

