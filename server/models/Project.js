const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  title: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    default: 'Udaipur',
  },
  type: {
    type: String,
    default: 'Heritage Construction',
  },
  summary: {
    type: String,
    default: '',
  },
  hero: {
    type: String,
    required: true,
  },
  description: {
    type: [String],
    default: [],
  },
  images: {
    type: [String],
    default: [],
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  order: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Project', ProjectSchema);

