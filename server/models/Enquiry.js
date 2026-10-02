const mongoose = require('mongoose');

const EnquirySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  projectType: {
    type: String,
    default: 'Unspecified',
  },
  message: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['New', 'Contacted', 'In-Progress', 'Closed'],
    default: 'New',
  },
  notes: {
    type: String,
    default: '',
  },
  source: {
    type: String,
    default: 'Website Contact Form',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Enquiry', EnquirySchema);

