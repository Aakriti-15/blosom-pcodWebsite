const express = require('express');
const router = express.Router();
const { 
  getCycles, 
  logCycle, 
  updateCycle, 
  deleteCycle, 
  getCycleStats 
} = require('../controllers/cycleController');
const { protect } = require('../middleware/auth');

// All cycle routes require authentication
router.use(protect);

// Stats route must be before /:id routes
// Otherwise Express thinks "stats" is an ID
router.get('/stats', getCycleStats);

// Main routes
router.route('/')
  .get(getCycles)
  .post(logCycle);

router.route('/:id')
  .put(updateCycle)
  .delete(deleteCycle);

module.exports = router;