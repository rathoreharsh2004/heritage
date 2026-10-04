const mongoose = require('mongoose');

const WebsiteSettingsSchema = new mongoose.Schema({
  companyName: {
    type: String,
    default: 'Rathore Heritage Developers',
  },
  tagline: {
    type: String,
    default: 'Where Timeless Indian Heritage Meets Royal Living',
  },
  logo: {
    type: String,
    default: 'logo.PNG',
  },
  primaryPhone: {
    type: String,
    default: '+91 94142 28829',
  },
  secondaryPhone: {
    type: String,
    default: '+91 78500 15839',
  },
  whatsappNumber: {
    type: String,
    default: '919414228829',
  },
  email: {
    type: String,
    default: 'rathoreheritagedevelopers@gmail.com',
  },
  address: {
    type: String,
    default: 'Ground Floor & First Floor, Building No. 14/21, Oladar Haveli, Lake Palace Road, Kalaji Goraji, Udaipur, Rajasthan - 313001, India',
  },
  instagramUrl: {
    type: String,
    default: 'https://instagram.com/rh_heritagebuilds',
  },
  footerDescription: {
    type: String,
    default: 'Preserving the soul of Rajasthan. Creating living heritage. Authentic craftsmanship interpreted for spaces of today and tomorrow.',
  },
  copyrightCredit: {
    type: String,
    default: 'Designed by Marwar Infotech',
  },
  preloaderTitle: {
    type: String,
    default: 'Rathore Heritage Developers — Raj Virasat',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('WebsiteSettings', WebsiteSettingsSchema);

