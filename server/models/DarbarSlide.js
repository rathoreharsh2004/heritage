const mongoose = require('mongoose');

const DarbarSlideSchema = new mongoose.Schema({
  image: {
    type: String,
    required: true,
  },
  tagline: {
    type: String,
    required: true,
  },
  subline: {
    type: String,
    default: '',
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

module.exports = mongoose.model('DarbarSlide', DarbarSlideSchema);

