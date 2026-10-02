const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const { requireAuth } = require('../middleware/auth');

// Public aggregate content
router.get('/content', contentController.getPublicContent);
router.get('/settings', contentController.getSettings);

// Admin dashboard stats
router.get('/dashboard', requireAuth, contentController.getDashboardStats);

// Settings update
router.put('/settings', requireAuth, contentController.updateSettings);

// Page sections
router.get('/sections', contentController.getAllSections);
router.get('/sections/:key', contentController.getSection);
router.put('/sections/:key', requireAuth, contentController.updateSection);

// Helper to register standard CRUD endpoints
function registerCrudRoutes(prefix, controllerGroup) {
  router.get(`/${prefix}`, controllerGroup.list);
  router.get(`/${prefix}/:id`, controllerGroup.get);
  router.post(`/${prefix}`, requireAuth, controllerGroup.create);
  router.put(`/${prefix}/:id`, requireAuth, controllerGroup.update);
  router.delete(`/${prefix}/:id`, requireAuth, controllerGroup.delete);
}

registerCrudRoutes('leaders', contentController.leaders);
registerCrudRoutes('craftsmanship', contentController.craftsmanship);
registerCrudRoutes('materials', contentController.materials);
registerCrudRoutes('projects', contentController.projects);
registerCrudRoutes('rawmaterials', contentController.rawMaterials);
registerCrudRoutes('darbar', contentController.darbarSlides);
registerCrudRoutes('services', contentController.services);

module.exports = router;

