const express = require('express');
const router = express.Router();
const {
  getSymptomLogs,
  getSymptomLog,
  createSymptomLog,
  updateSymptomLog,
  deleteSymptomLog,
  getSymptomStats,
} = require('../controllers/symptomController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Stats route must be before /:id
router.get('/stats', getSymptomStats);

// Main routes
router.route('/')
  .get(getSymptomLogs)
  .post(createSymptomLog);

router.route('/:id')
  .get(getSymptomLog)
  .put(updateSymptomLog)
  .delete(deleteSymptomLog);

module.exports = router;