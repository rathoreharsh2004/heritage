const mongoose = require('mongoose');

const PageSectionSchema = new mongoose.Schema({
  sectionKey: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  title: {
    type: String,
    default: '',
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  isVisible: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('PageSection', PageSectionSchema);

