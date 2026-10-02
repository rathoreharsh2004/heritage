const mongoose = require('mongoose');

const RawMaterialSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['image', 'video'],
    default: 'image',
  },
  src: {
    type: String,
    required: true,
  },
  tagline: {
    type: String,
    required: true,
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

module.exports = mongoose.model('RawMaterial', RawMaterialSchema);

