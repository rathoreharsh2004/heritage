const mongoose = require('mongoose');

const MediaSchema = new mongoose.Schema({
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  filename: {
    type: String,
    required: true,
    index: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  mimeType: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  altText: {
    type: String,
    default: '',
  },
  category: {
    type: String,
    enum: ['general', 'hero', 'legacy', 'craftsmanship', 'materials', 'projects', 'consultancy', 'rawmaterials', 'gallery', 'leadership'],
    default: 'general',
  },
  url: {
    type: String,
    required: true,
  },
  usageCount: {
    type: Number,
    default: 0,
  },
  usedIn: {
    type: [String],
    default: [],
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Media', MediaSchema);

