const WebsiteSettings = require('../models/WebsiteSettings');
const PageSection = require('../models/PageSection');
const Leader = require('../models/Leader');
const Craftsmanship = require('../models/Craftsmanship');
const MaterialElement = require('../models/MaterialElement');
const Project = require('../models/Project');
const RawMaterial = require('../models/RawMaterial');
const DarbarSlide = require('../models/DarbarSlide');
const ServiceOffer = require('../models/ServiceOffer');
const Enquiry = require('../models/Enquiry');
const Media = require('../models/Media');
const AuditLog = require('../models/AuditLog');

// Helper to log audit actions
async function logAction(req, action, entityType, entityId, description, previous = null, updated = null) {
  try {
    await AuditLog.create({
      adminEmail: req.admin ? req.admin.email : 'system',
      adminUsername: req.admin ? req.admin.username : 'system',
      action,
      entityType,
      entityId: entityId ? entityId.toString() : '',
      description,
      changes: { previous, updated },
      ipAddress: req.ip || req.connection.remoteAddress,
    });
  } catch (err) {
    console.error('[AuditLog] Failed to record:', err.message);
  }
}

// ─────────────────────────────────────────────────────────────
// 1. PUBLIC AGGREGATED CONTENT ENDPOINT
// ─────────────────────────────────────────────────────────────
exports.getPublicContent = async (req, res, next) => {
  try {
    const [
      settings,
      sectionsArray,
      leaders,
      craftsmanship,
      materials,
      projects,
      rawMaterials,
      darbarSlides,
      services,
    ] = await Promise.all([
      WebsiteSettings.findOne().lean(),
      PageSection.find({ isVisible: true }).lean(),
      Leader.find({ isActive: true }).sort({ order: 1, _id: 1 }).lean(),
      Craftsmanship.find({ isActive: true }).sort({ order: 1, _id: 1 }).lean(),
      MaterialElement.find({ isActive: true }).sort({ order: 1, _id: 1 }).lean(),
      Project.find({ isActive: true }).sort({ order: 1, _id: 1 }).lean(),
      RawMaterial.find({ isActive: true }).sort({ order: 1, _id: 1 }).lean(),
      DarbarSlide.find({ isActive: true }).sort({ order: 1, _id: 1 }).lean(),
      ServiceOffer.find({ isActive: true }).sort({ order: 1, _id: 1 }).lean(),
    ]);

    // Map sections into a keyed dictionary { hero: {...}, legacy: {...}, ... }
    const sections = {};
    if (sectionsArray) {
      sectionsArray.forEach(sec => {
        sections[sec.sectionKey] = {
          title: sec.title,
          ...sec.data,
        };
      });
    }

    // Map projects into a slug-indexed object for instant subpage lookup
    const projectsBySlug = {};
    if (projects) {
      projects.forEach(p => {
        projectsBySlug[p.slug] = p;
      });
    }

    res.json({
      success: true,
      data: {
        settings: settings || {},
        sections,
        leaders: leaders || [],
        craftsmanship: craftsmanship || [],
        materials: materials || [],
        projects: projects || [],
        projectsBySlug,
        rawMaterials: rawMaterials || [],
        darbarSlides: darbarSlides || [],
        services: services || [],
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// 2. DASHBOARD METRICS
// ─────────────────────────────────────────────────────────────
exports.getDashboardStats = async (req, res, next) => {
  try {
    const [
      projectCount,
      craftCount,
      materialCount,
      mediaCount,
      enquiryCount,
      newEnquiryCount,
      recentEnquiries,
      recentLogs,
      recentMedia,
    ] = await Promise.all([
      Project.countDocuments(),
      Craftsmanship.countDocuments(),
      MaterialElement.countDocuments(),
      Media.countDocuments(),
      Enquiry.countDocuments(),
      Enquiry.countDocuments({ status: 'New' }),
      Enquiry.find().sort({ createdAt: -1 }).limit(5).lean(),
      AuditLog.find().sort({ createdAt: -1 }).limit(8).lean(),
      Media.find().sort({ createdAt: -1 }).limit(6).lean(),
    ]);

    res.json({
      success: true,
      stats: {
        projects: projectCount,
        craftsmanship: craftCount,
        materials: materialCount,
        media: mediaCount,
        enquiries: enquiryCount,
        newEnquiries: newEnquiryCount,
      },
      recentEnquiries,
      recentLogs,
      recentMedia,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// 3. WEBSITE SETTINGS
// ─────────────────────────────────────────────────────────────
exports.getSettings = async (req, res, next) => {
  try {
    let settings = await WebsiteSettings.findOne();
    if (!settings) {
      settings = await WebsiteSettings.create({});
    }
    res.json({ success: true, settings });
  } catch (err) {
    next(err);
  }
};

exports.updateSettings = async (req, res, next) => {
  try {
    let settings = await WebsiteSettings.findOne();
    const prev = settings ? settings.toObject() : {};

    if (!settings) {
      settings = new WebsiteSettings(req.body);
    } else {
      Object.assign(settings, req.body);
    }

    await settings.save();
    await logAction(req, 'UPDATE', 'WebsiteSettings', settings._id, 'Updated general website configuration', prev, settings.toObject());

    res.json({ success: true, message: 'Settings saved successfully', settings });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// 4. PAGE SECTIONS
// ─────────────────────────────────────────────────────────────
exports.getAllSections = async (req, res, next) => {
  try {
    const sections = await PageSection.find().sort({ sectionKey: 1 });
    res.json({ success: true, sections });
  } catch (err) {
    next(err);
  }
};

exports.getSection = async (req, res, next) => {
  try {
    const section = await PageSection.findOne({ sectionKey: req.params.key });
    if (!section) {
      return res.status(404).json({ success: false, message: 'Section not found' });
    }
    res.json({ success: true, section });
  } catch (err) {
    next(err);
  }
};

exports.updateSection = async (req, res, next) => {
  try {
    const { key } = req.params;
    const { title, data, isVisible } = req.body;

    let section = await PageSection.findOne({ sectionKey: key });
    const prev = section ? section.toObject() : null;

    if (!section) {
      section = new PageSection({
        sectionKey: key,
        title: title || key,
        data: data || {},
        isVisible: isVisible !== undefined ? isVisible : true,
      });
    } else {
      if (title !== undefined) section.title = title;
      if (data !== undefined) section.data = data;
      if (isVisible !== undefined) section.isVisible = isVisible;
    }

    await section.save();
    await logAction(req, 'UPDATE', 'PageSection', section._id, `Updated section: ${key}`, prev, section.toObject());

    res.json({ success: true, message: `Section "${key}" updated successfully`, section });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// 5. GENERIC CRUD HANDLER CREATOR FOR REPEATED ENTITIES
// ─────────────────────────────────────────────────────────────
function createCrudHandlers(Model, entityName) {
  return {
    list: async (req, res, next) => {
      try {
        const items = await Model.find().sort({ order: 1, createdAt: -1 });
        res.json({ success: true, items });
      } catch (err) {
        next(err);
      }
    },

    get: async (req, res, next) => {
      try {
        const item = await Model.findById(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: `${entityName} not found` });
        res.json({ success: true, item });
      } catch (err) {
        next(err);
      }
    },

    create: async (req, res, next) => {
      try {
        const item = await Model.create(req.body);
        await logAction(req, 'CREATE', entityName, item._id, `Created new ${entityName}: ${item.title || item.name || item.code || item._id}`, null, item.toObject());
        res.status(201).json({ success: true, message: `${entityName} created successfully`, item });
      } catch (err) {
        next(err);
      }
    },

    update: async (req, res, next) => {
      try {
        const item = await Model.findById(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: `${entityName} not found` });

        const prev = item.toObject();
        Object.assign(item, req.body);
        await item.save();

        await logAction(req, 'UPDATE', entityName, item._id, `Updated ${entityName}: ${item.title || item.name || item.code || item._id}`, prev, item.toObject());
        res.json({ success: true, message: `${entityName} updated successfully`, item });
      } catch (err) {
        next(err);
      }
    },

    delete: async (req, res, next) => {
      try {
        const item = await Model.findById(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: `${entityName} not found` });

        const prev = item.toObject();
        await Model.findByIdAndDelete(req.params.id);
        await logAction(req, 'DELETE', entityName, req.params.id, `Deleted ${entityName}: ${prev.title || prev.name || prev.code || prev._id}`, prev, null);

        res.json({ success: true, message: `${entityName} deleted successfully` });
      } catch (err) {
        next(err);
      }
    },
  };
}

exports.leaders = createCrudHandlers(Leader, 'Leader');
exports.craftsmanship = createCrudHandlers(Craftsmanship, 'Craftsmanship');
exports.materials = createCrudHandlers(MaterialElement, 'MaterialElement');
exports.projects = createCrudHandlers(Project, 'Project');
exports.rawMaterials = createCrudHandlers(RawMaterial, 'RawMaterial');
exports.darbarSlides = createCrudHandlers(DarbarSlide, 'DarbarSlide');
exports.services = createCrudHandlers(ServiceOffer, 'ServiceOffer');

