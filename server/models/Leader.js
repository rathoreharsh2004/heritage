const mongoose = require('mongoose');

const LeaderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  designation: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
    default: 'founder.jpeg',
  },
  bio: {
    type: [String],
    default: [],
  },
  company: {
    type: String,
    default: 'Rathore Heritage Developers',
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

module.exports = mongoose.model('Leader', LeaderSchema);

