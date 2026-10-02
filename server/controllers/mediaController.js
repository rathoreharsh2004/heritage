const mongoose = require('mongoose');
const { Readable } = require('stream');
const { getGridFSBucket } = require('../config/db');
const Media = require('../models/Media');
const AuditLog = require('../models/AuditLog');
const PageSection = require('../models/PageSection');
const Craftsmanship = require('../models/Craftsmanship');
const Project = require('../models/Project');
const Leader = require('../models/Leader');
const MaterialElement = require('../models/MaterialElement');
const DarbarSlide = require('../models/DarbarSlide');
const RawMaterial = require('../models/RawMaterial');

// Scan database to find where an image filename or media ID is used
async function calculateMediaUsages(filename, mediaIdStr) {
  const usedIn = [];

  const [
    sections,
    crafts,
    projects,
    leaders,
    materials,
    darbar,
    raw,
  ] = await Promise.all([
    PageSection.find().lean(),
    Craftsmanship.find({ $or: [{ image: filename }, { subImages: filename }] }).lean(),
    Project.find({ $or: [{ hero: filename }, { images: filename }] }).lean(),
    Leader.find({ avatar: filename }).lean(),
    MaterialElement.find({ image: filename }).lean(),
    DarbarSlide.find({ image: filename }).lean(),
    RawMaterial.find({ src: filename }).lean(),
  ]);

  // Check sections
  if (sections) {
    sections.forEach(sec => {
      const str = JSON.stringify(sec.data);
      if (str.includes(filename) || (mediaIdStr && str.includes(mediaIdStr))) {
        usedIn.push(`Section: ${sec.title || sec.sectionKey}`);
      }
    });
  }

  if (crafts) crafts.forEach(c => usedIn.push(`Craftsmanship: ${c.title}`));
  if (projects) projects.forEach(p => usedIn.push(`Project: ${p.title}`));
  if (leaders) leaders.forEach(l => usedIn.push(`Leader: ${l.name}`));
  if (materials) materials.forEach(m => usedIn.push(`Material: ${m.title}`));
  if (darbar) darbar.forEach(d => usedIn.push(`Darbar Gallery Slide (${d.tagline.slice(0, 20)}...)`));
  if (raw) raw.forEach(r => usedIn.push(`Raw Material Slide (${r.tagline.slice(0, 20)}...)`));

  return usedIn;
}

// ─────────────────────────────────────────────────────────────
// 1. UPLOAD MEDIA TO GRIDFS
// ─────────────────────────────────────────────────────────────
exports.uploadMedia = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const bucket = getGridFSBucket();
    const originalName = req.file.originalname;
    const sanitizedName = Date.now() + '-' + originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const { category, altText } = req.body;

    // Stream buffer into GridFS
    const readableStream = new Readable();
    readableStream.push(req.file.buffer);
    readableStream.push(null);

    const uploadStream = bucket.openUploadStream(sanitizedName, {
      contentType: req.file.mimetype,
      metadata: {
        originalName,
        category: category || 'general',
        uploadedBy: req.admin ? req.admin.email : 'system',
      },
    });

    readableStream.pipe(uploadStream);

    uploadStream.on('error', (err) => {
      console.error('[GridFS Upload Error]', err);
      return res.status(500).json({ success: false, message: 'Failed to write file to GridFS', error: err.message });
    });

    uploadStream.on('finish', async () => {
      try {
        const mediaDoc = await Media.create({
          fileId: uploadStream.id,
          filename: sanitizedName,
          originalName,
          mimeType: req.file.mimetype,
          size: req.file.size,
          altText: altText || originalName.split('.')[0],
          category: category || 'general',
          url: `/api/media/${uploadStream.id}`,
        });

        // Audit log
        if (req.admin) {
          await AuditLog.create({
            adminEmail: req.admin.email,
            adminUsername: req.admin.username,
            action: 'CREATE',
            entityType: 'Media',
            entityId: mediaDoc._id.toString(),
            description: `Uploaded media: ${originalName} (${(req.file.size / 1024).toFixed(1)} KB)`,
            ipAddress: req.ip,
          }).catch(() => {});
        }

        res.status(201).json({
          success: true,
          message: 'Media uploaded and stored in MongoDB GridFS successfully',
          media: mediaDoc,
        });
      } catch (docErr) {
        next(docErr);
      }
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// 2. STREAM MEDIA FROM GRIDFS (BY ID)
// ─────────────────────────────────────────────────────────────
exports.getMediaById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let fileObjectId;

    try {
      fileObjectId = new mongoose.Types.ObjectId(id);
    } catch {
      return res.status(400).json({ success: false, message: 'Invalid media ID' });
    }

    const bucket = getGridFSBucket();
    const files = await bucket.find({ _id: fileObjectId }).toArray();

    if (!files || files.length === 0) {
      return res.status(404).json({ success: false, message: 'Media file not found in GridFS' });
    }

    const file = files[0];
    res.set({
      'Content-Type': file.contentType || 'application/octet-stream',
      'Content-Length': file.length,
      'Cache-Control': 'public, max-age=86400', // Cache for 1 day
    });

    const downloadStream = bucket.openDownloadStream(fileObjectId);
    downloadStream.on('error', (err) => {
      res.status(500).end();
    });
    downloadStream.pipe(res);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// 3. STREAM MEDIA FROM GRIDFS (BY FILENAME)
// ─────────────────────────────────────────────────────────────
exports.getMediaByName = async (req, res, next) => {
  try {
    const { filename } = req.params;
    const bucket = getGridFSBucket();
    const files = await bucket.find({ filename }).toArray();

    if (!files || files.length === 0) {
      return res.status(404).json({ success: false, message: 'Media file not found' });
    }

    const file = files[0];
    res.set({
      'Content-Type': file.contentType || 'application/octet-stream',
      'Content-Length': file.length,
      'Cache-Control': 'public, max-age=86400',
    });

    const downloadStream = bucket.openDownloadStreamByName(filename);
    downloadStream.on('error', () => res.status(500).end());
    downloadStream.pipe(res);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// 4. LIST MEDIA WITH SEARCH & FILTER
// ─────────────────────────────────────────────────────────────
exports.listMedia = async (req, res, next) => {
  try {
    const { category, search, page = 1, limit = 50 } = req.query;
    const query = {};

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { filename: { $regex: search, $options: 'i' } },
        { originalName: { $regex: search, $options: 'i' } },
        { altText: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Media.countDocuments(query);
    const media = await Media.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      media,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// 5. GET MEDIA DETAILS & LIVE USAGE COUNT
// ─────────────────────────────────────────────────────────────
exports.getMediaUsage = async (req, res, next) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) return res.status(404).json({ success: false, message: 'Media record not found' });

    const usedIn = await calculateMediaUsages(media.filename, media.fileId.toString());
    media.usageCount = usedIn.length;
    media.usedIn = usedIn;
    await media.save();

    res.json({
      success: true,
      media,
      usageCount: usedIn.length,
      usedIn,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// 6. UPDATE MEDIA METADATA (Alt text, category)
// ─────────────────────────────────────────────────────────────
exports.updateMedia = async (req, res, next) => {
  try {
    const { altText, category } = req.body;
    const media = await Media.findById(req.params.id);
    if (!media) return res.status(404).json({ success: false, message: 'Media record not found' });

    if (altText !== undefined) media.altText = altText;
    if (category !== undefined) media.category = category;

    await media.save();
    res.json({ success: true, message: 'Media details updated', media });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// 7. DELETE MEDIA (With usage verification)
// ─────────────────────────────────────────────────────────────
exports.deleteMedia = async (req, res, next) => {
  try {
    const { force } = req.query;
    const media = await Media.findById(req.params.id);
    if (!media) return res.status(404).json({ success: false, message: 'Media record not found' });

    const usedIn = await calculateMediaUsages(media.filename, media.fileId.toString());

    if (usedIn.length > 0 && force !== 'true') {
      return res.status(409).json({
        success: false,
        message: `This media is currently used in ${usedIn.length} location(s).`,
        usageCount: usedIn.length,
        usedIn,
        requiresConfirmation: true,
      });
    }

    // Delete from GridFS bucket
    const bucket = getGridFSBucket();
    try {
      await bucket.delete(media.fileId);
    } catch (delErr) {
      console.warn('[GridFS Delete Warning]', delErr.message);
    }

    // Delete document
    await Media.findByIdAndDelete(req.params.id);

    // Audit log
    if (req.admin) {
      await AuditLog.create({
        adminEmail: req.admin.email,
        adminUsername: req.admin.username,
        action: 'DELETE',
        entityType: 'Media',
        entityId: media._id.toString(),
        description: `Deleted media file: ${media.filename} (${media.originalName})`,
        ipAddress: req.ip,
      }).catch(() => {});
    }

    res.json({
      success: true,
      message: 'Media deleted successfully from MongoDB GridFS and library',
    });
  } catch (err) {
    next(err);
  }
};

